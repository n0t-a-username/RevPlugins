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
        size: 10 + Math.random() * 20,
        duration: 3000 + Math.random() * 3000,
        opacity: 0.4 + Math.random() * 0.6,
        // Randomly offset the very first start so they don't all drop at once
        initialDelay: Math.random() * 5000 
    }), []);

    const animValue = React.useRef(new Animated.Value(-50)).current;

    React.useEffect(() => {
        let isMounted = true;

        const run = (isFirstRun = false) => {
            if (!isMounted) return;
            
            animValue.setValue(-50);
            
            const startTiming = () => {
                Animated.timing(animValue, {
                    toValue: SCREEN_HEIGHT + 50,
                    duration: config.duration,
                    useNativeDriver: true,
                    easing: Easing.linear
                }).start(({ finished }) => {
                    const elapsed = Date.now() - startTime;
                    // Keep looping as long as we are in the active window (e.g., 10 seconds)
                    if (finished && isMounted && elapsed < 10000) {
                        run(false);
                    }
                });
            };

            if (isFirstRun) {
                setTimeout(startTiming, config.initialDelay);
            } else {
                startTiming();
            }
        };

        run(true);
        return () => { isMounted = false; animValue.stopAnimation(); };
    }, []);

    return (
        <Animated.View style={{
            position: "absolute", left: config.x, top: 0,
            width: config.size, height: config.size, opacity: config.opacity,
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

const FallingParticles = ({ startTime }: { startTime: number }) => {
    // Increase count slightly for a fuller continuous look
    const particles = React.useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

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
                    // Debounce so multiple clicks don't stack components
                    if (now - lastBurstTime < 10000) return;
                    
                    lastBurstTime = now;
                    storage.SnowEnabled = true;

                    // Keep mounted long enough for all loops and the final fall
                    setTimeout(() => {
                        storage.SnowEnabled = false;
                    }, 15000); 
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
