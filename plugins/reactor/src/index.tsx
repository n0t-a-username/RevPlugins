import { before } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { General } from "@vendetta/ui/components";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import Settings from "./Settings";

const { View, Animated, Dimensions, Easing, Image, StyleSheet } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ReactionModule = findByProps("addReaction");

storage.SnowEnabled = false; 

let patches = [];
let lastBurstTime = 0;

const ParticleItem = React.memo(({ startTime }: { startTime: number }) => {
    const config = React.useMemo(() => ({
        x: Math.random() * SCREEN_WIDTH,
        size: 12 + Math.random() * 18,
        duration: 2500 + Math.random() * 2500,
        opacity: 0.6 + Math.random() * 0.4,
    }), []);

    const animValue = React.useRef(new Animated.Value(-50)).current;

    React.useEffect(() => {
        let isMounted = true;
        const run = () => {
            if (!isMounted) return;
            animValue.setValue(-50);
            
            Animated.timing(animValue, {
                toValue: SCREEN_HEIGHT + 50,
                duration: config.duration,
                useNativeDriver: true,
                easing: Easing.linear
            }).start(({ finished }) => {
                // Check if we are still within the 4-second "spawn window"
                // since this specific burst started
                const elapsed = Date.now() - startTime;
                if (finished && isMounted && elapsed < 4000) {
                    run();
                }
            });
        };
        run();
        return () => { isMounted = false; animValue.stopAnimation(); };
    }, []);

    return (
        <Animated.View style={{
            position: "absolute", left: config.x, top: 0,
            width: config.size, height: config.size, opacity: config.opacity,
            transform: [{ translateY: animValue }]
        }}>
            <Image source={{ uri: 'https://cdn.bwlok.dev/snowflake.png' }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </Animated.View>
    );
});

const FallingParticles = ({ startTime }: { startTime: number }) => {
    // We create the particles once. They will loop internally 
    // until they realize the 4s window has closed.
    const particles = React.useMemo(() => Array.from({ length: 50 }, (_, i) => i), []);

    return (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
            {particles.map(i => <ParticleItem key={i} startTime={startTime} />)}
        </View>
    );
};

export default {
    onLoad: () => {
        if (ReactionModule) {
            patches.push(before("addReaction", ReactionModule, (args) => {
                const [,, emoji] = args;
                if (emoji?.name === "❄️") {
                    const now = Date.now();
                    // Lock the burst so it can't double-trigger for 8 seconds
                    if (now - lastBurstTime < 8000) return;
                    
                    lastBurstTime = now;
                    storage.SnowEnabled = true;

                    // Keep the component mounted long enough for even the slowest
                    // flake to finish its final 5-second fall after the 4s window.
                    setTimeout(() => {
                        storage.SnowEnabled = false;
                    }, 9000); 
                }
            }));
        }

        patches.push(
            before("render", General.View, (args) => {
                const [wrapper] = args;
                if (!wrapper?.style?.some?.(s => s?.flex === 1)) return;

                let child = wrapper.children;
                if (Array.isArray(child)) child = child.find(c => c?.type?.name === "NativeStackViewInner");
                if (child?.type?.name !== "NativeStackViewInner") return;
                if (!child?.props?.state?.routeNames?.includes("main")) return;

                const SnowWrapper = () => {
                    useProxy(storage);
                    // Pass the global lastBurstTime so particles know when they "started"
                    return storage.SnowEnabled ? <FallingParticles startTime={lastBurstTime} /> : null;
                };

                const children = Array.isArray(wrapper.children) ? wrapper.children : [wrapper.children];
                if (!children.some(c => c?.key === "snow-logic")) {
                    wrapper.children = [...children, React.createElement(SnowWrapper, { key: "snow-logic" })];
                }
            })
        );
    },
    onUnload: () => {
        patches.forEach(u => u());
        storage.SnowEnabled = false;
    },
    settings: Settings
};
