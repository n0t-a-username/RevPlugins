import { after, before } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import Settings from "./Settings"; 

const { View, Animated, Dimensions, Easing, Image, StyleSheet } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ReactionModule = findByProps("addReaction");
const GeneralModule = findByProps("View");

let patches = [];
let lastBurstTime = 0;

storage.SnowEnabled ??= false;

const PARTICLE_COUNT = 20;
const PARTICLE_POOL = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * SCREEN_WIDTH,
    size: 15 + Math.random() * 10,
    duration: 3500 + Math.random() * 2000,
    opacity: 0.4 + Math.random() * 0.4,
    anim: new Animated.Value(-100)
}));

const Particle = ({ data }) => {
    React.useEffect(() => {
        let isMounted = true;
        const run = () => {
            if (!isMounted || !storage.SnowEnabled) return;
            data.anim.setValue(-100);
            Animated.timing(data.anim, {
                toValue: SCREEN_HEIGHT + 100,
                duration: data.duration,
                useNativeDriver: true,
                easing: Easing.linear
            }).start(({ finished }) => {
                if (finished && isMounted && storage.SnowEnabled) run();
            });
        };

        if (storage.SnowEnabled) run();
        return () => { 
            isMounted = false; 
            data.anim.stopAnimation(); 
            data.anim.setValue(-100);
        };
    }, [storage.SnowEnabled]);

    return (
        <Animated.View style={{
            position: "absolute", left: data.x, top: 0,
            width: data.size, height: data.size, opacity: data.opacity,
            transform: [{ translateY: data.anim }]
        }}>
            <Image 
                source={{ uri: 'https://cdn.bwlok.dev/snowflake.png' }} 
                style={{ width: '100%', height: '100%' }} 
                resizeMode="contain" 
            />
        </Animated.View>
    );
};

// This component acts as the actual "Snow Layer"
const SnowOverlay = () => {
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            // Force a re-render so we catch the storage change instantly
            forceUpdate();
        }, 250);
        return () => clearInterval(interval);
    }, []);

    if (!storage.SnowEnabled) return null;

    return (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
            {PARTICLE_POOL.map((p, i) => <Particle key={i} data={p} />)}
        </View>
    );
};

export default {
    onLoad: () => {
        if (ReactionModule) {
            patches.push(before("addReaction", ReactionModule, (args) => {
                const emoji = args?.[2];
                if (emoji?.name === "❄️") {
                    const now = Date.now();
                    if (now - lastBurstTime < 5000) return;
                    
                    lastBurstTime = now;
                    storage.SnowEnabled = true;
                    // Stop after 12 seconds
                    setTimeout(() => { storage.SnowEnabled = false; }, 12000);
                }
            }));
        }

        if (GeneralModule?.View) {
            patches.push(after("render", GeneralModule.View, (args, res) => {
                if (!res?.props) return res;
                
                const style = StyleSheet.flatten(res.props.style);
                // Target the main chat area (usually flex: 1 with an onLayout)
                if (style?.flex !== 1 || !res.props.onLayout) return res;

                const children = React.Children.toArray(res.props.children);
                if (children.some(c => c?.key === "snow-direct-layer")) return res;

                res.props.children = [
                    ...children,
                    React.createElement(SnowOverlay, { key: "snow-direct-layer" })
                ];
                return res;
            }));
        }
    },
    onUnload: () => {
        patches.forEach(p => p?.());
        storage.SnowEnabled = false;
        PARTICLE_POOL.forEach(p => p.anim.setValue(-100));
    },
    settings: Settings
};
