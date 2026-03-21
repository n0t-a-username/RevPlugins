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
        duration: 3000 + Math.random() * 2000,
        opacity: 0.4 + Math.random() * 0.6,
        initialDelay: Math.random() * 4000 
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
                    // Check if the 10s "active" window is still open
                    if (finished && isMounted && (Date.now() - startTime < 10000)) {
                        run(false);
                    }
                });
            };

            if (isFirstRun) setTimeout(startTiming, config.initialDelay);
            else startTiming();
        };

        run(true);

        // This is the "Clear on Exit" magic
        return () => { 
            isMounted = false; 
            animValue.stopAnimation(); 
        };
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
                    if (now - lastBurstTime < 10000) return;
                    
                    lastBurstTime = now;
                    storage.SnowEnabled = true;

                    setTimeout(() => {
                        storage.SnowEnabled = false;
                    }, 15000); 
                }
            }));
        }

        // Patch the specific Chat View container
        patches.push(
            before("render", General.View, (args) => {
                const [wrapper] = args;
                if (!wrapper?.style?.some?.(s => s?.flex === 1)) return;

                let child = wrapper.children;
                if (Array.isArray(child)) child = child.find(c => c?.type?.name === "NativeStackViewInner");
                if (child?.type?.name !== "NativeStackViewInner") return;
                
                // Only render if we are in the main chat/home route
                if (!child?.props?.state?.routeNames?.includes("main")) return;

                const SnowWrapper = () => {
                    useProxy(storage);
                    // Use a key that changes with the burst so it resets properly
                    return storage.SnowEnabled ? <FallingParticles key={lastBurstTime} startTime={lastBurstTime} /> : null;
                };

                const children = Array.isArray(wrapper.children) ? wrapper.children : [wrapper.children];
                if (!children.some(c => c?.key === "chat-snow")) {
                    wrapper.children = [...children, React.createElement(SnowWrapper, { key: "chat-snow" })];
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
