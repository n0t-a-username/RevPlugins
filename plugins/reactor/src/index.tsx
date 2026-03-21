import { before } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { General } from "@vendetta/ui/components";
import { storage } from "@vendetta/plugin";
import Settings from "./Settings"; 

const { View, Animated, Dimensions, Easing, Image, StyleSheet } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ReactionModule = findByProps("addReaction");

let patches = [];
let lastBurstTime = 0;
// Moving this outside the component ensures we don't duplicate on re-renders
let activeParticles = []; 

storage.SnowEnabled ??= false;

const ParticleItem = React.memo(({ data }: { data: any }) => {
    const animValue = React.useRef(new Animated.Value(-50)).current;

    React.useEffect(() => {
        let isMounted = true;
        const run = () => {
            if (!isMounted) return;
            animValue.setValue(-50);
            Animated.timing(animValue, {
                toValue: SCREEN_HEIGHT + 50,
                duration: data.duration,
                useNativeDriver: true,
                easing: Easing.linear
            }).start(({ finished }) => {
                if (finished && isMounted && storage.SnowEnabled) run();
            });
        };
        run();
        return () => { isMounted = false; animValue.stopAnimation(); };
    }, []);

    return (
        <Animated.View style={{
            position: "absolute", left: data.x, top: 0,
            width: data.size, height: data.size, opacity: data.opacity,
            transform: [{ translateY: animValue }]
        }}>
            <Image 
                source={{ uri: 'https://cdn.bwlok.dev/snowflake.png' }} 
                style={{ width: '100%', height: '100%' }} 
                resizeMode="contain" 
            />
        </Animated.View>
    );
});

const SnowOverlay = () => {
    // We use a simple state to mount/unmount the particles
    const [show, setShow] = React.useState(false);

    React.useEffect(() => {
        const check = setInterval(() => {
            if (storage.SnowEnabled !== show) setShow(storage.SnowEnabled);
        }, 500);
        return () => clearInterval(check);
    }, [show]);

    if (!show) return null;

    return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {activeParticles.map((p, i) => (
                <ParticleItem key={`${lastBurstTime}-${i}`} data={p} />
            ))}
        </View>
    );
};

export default {
    onLoad: () => {
        if (ReactionModule?.addReaction) {
            patches.push(before("addReaction", ReactionModule, (args) => {
                const emoji = args?.[2];
                if (emoji?.name === "❄️") {
                    const now = Date.now();
                    if (now - lastBurstTime < 10000) return;
                    
                    lastBurstTime = now;
                    // Create exactly 40 particles and stop
                    activeParticles = Array.from({ length: 40 }, () => ({
                        x: Math.random() * SCREEN_WIDTH,
                        size: 15 + Math.random() * 15,
                        duration: 3000 + Math.random() * 2000,
                        opacity: 0.5 + Math.random() * 0.5
                    }));

                    storage.SnowEnabled = true;
                    setTimeout(() => { 
                        storage.SnowEnabled = false; 
                        activeParticles = [];
                    }, 12000);
                }
            }));
        }

        if (General?.View) {
            patches.push(after("render", General.View, (args, res) => {
                if (!res?.props) return res;
                const style = StyleSheet.flatten(res.props.style);
                if (style?.flex !== 1) return res;

                const children = Array.isArray(res.props.children) ? res.props.children : [res.props.children];
                if (children.some(c => c?.key === "snow-fixed-layer")) return res;

                res.props.children = [
                    ...children,
                    React.createElement(SnowOverlay, { key: "snow-fixed-layer" })
                ];
                return res;
            }));
        }
    },
    onUnload: () => {
        patches.forEach(p => p?.());
        storage.SnowEnabled = false;
        activeParticles = [];
    },
    settings: Settings
};
