import { after, before } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import Settings from "./Settings"; 

const { View, Animated, Dimensions, Easing, Image, StyleSheet } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// We find these inside onLoad to prevent top-level reference crashes
let ReactionModule;
let GeneralView;

let patches = [];
let lastBurstTime = 0;
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
    const [show, setShow] = React.useState(false);

    React.useEffect(() => {
        const check = setInterval(() => {
            if (storage.SnowEnabled !== show) setShow(storage.SnowEnabled);
        }, 500);
        return () => clearInterval(check);
    }, [show]);

    if (!show || activeParticles.length === 0) return null;

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
        // Find modules safely inside onLoad
        ReactionModule = findByProps("addReaction");
        const GeneralModule = findByProps("View");
        GeneralView = GeneralModule?.View;

        if (ReactionModule) {
            patches.push(before("addReaction", ReactionModule, (args) => {
                const emoji = args?.[2];
                if (emoji?.name === "❄️") {
                    const now = Date.now();
                    if (now - lastBurstTime < 10000) return;
                    
                    lastBurstTime = now;
                    activeParticles = Array.from({ length: 30 }, () => ({
                        x: Math.random() * SCREEN_WIDTH,
                        size: 15 + Math.random() * 10,
                        duration: 3500 + Math.random() * 2000,
                        opacity: 0.5 + Math.random() * 0.4
                    }));

                    storage.SnowEnabled = true;
                    setTimeout(() => { 
                        storage.SnowEnabled = false; 
                        activeParticles = [];
                    }, 12000);
                }
            }));
        }

        if (GeneralView) {
            patches.push(after("render", GeneralView, (args, res) => {
                if (!res?.props) return res;
                
                // Check if it's a main container
                const style = StyleSheet.flatten(res.props.style);
                if (style?.flex !== 1) return res;

                // Stop injection if it's a specific UI element we don't want to double up on
                if (res.type?.name === "Text" || res.type?.name === "Image") return res;

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
