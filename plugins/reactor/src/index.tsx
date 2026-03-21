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
storage.SnowPerformance ??= false;

let patches = [];
let snowTimeout = null;

// Move particle generation inside the component to ensure clean state
const ParticleItem = React.memo(({ index, active }: { index: number, active: boolean }) => {
    // Generate static values once per mount
    const config = React.useMemo(() => ({
        x: Math.random() * SCREEN_WIDTH,
        size: 12 + Math.random() * 18,
        duration: 2500 + Math.random() * 2500,
        opacity: 0.6 + Math.random() * 0.4,
    }), []);

    const animValue = React.useRef(new Animated.Value(-50)).current;

    React.useEffect(() => {
        let isMounted = true;

        const runAnimation = () => {
            if (!isMounted) return;
            animValue.setValue(-50);
            
            Animated.timing(animValue, {
                toValue: SCREEN_HEIGHT + 50,
                duration: config.duration,
                useNativeDriver: true,
                easing: Easing.linear
            }).start(({ finished }) => {
                // Only loop if we are still "active" and still mounted
                if (finished && active && isMounted) {
                    runAnimation();
                }
            });
        };

        runAnimation();
        return () => { isMounted = false; animValue.stopAnimation(); };
    }, [active]);

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

const FallingParticles = () => {
    const [active, setActive] = React.useState(true);

    React.useEffect(() => {
        // 4 seconds of generation/looping
        const timer = setTimeout(() => setActive(false), 4000);
        return () => clearTimeout(timer);
    }, []);

    // Create a static array of 50 indices
    const particles = React.useMemo(() => Array.from({ length: 50 }, (_, i) => i), []);

    return (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
            {particles.map(i => (
                <ParticleItem key={i} index={i} active={active} />
            ))}
        </View>
    );
};

export default {
    onLoad: () => {
        if (ReactionModule) {
            patches.push(before("addReaction", ReactionModule, (args) => {
                const [,, emoji] = args;
                if (emoji?.name === "❄️") {
                    if (snowTimeout) clearTimeout(snowTimeout);
                    
                    storage.SnowEnabled = false;
                    setTimeout(() => {
                        storage.SnowEnabled = true;
                        // 7s total (4s active + 3s to fall off screen)
                        snowTimeout = setTimeout(() => {
                            storage.SnowEnabled = false;
                        }, 7000);
                    }, 32); 
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
                    return storage.SnowEnabled ? <FallingParticles /> : null;
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
        if (snowTimeout) clearTimeout(snowTimeout);
        storage.SnowEnabled = false;
    },
    settings: Settings
};
