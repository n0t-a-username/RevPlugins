import { after, before } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps, findByName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
// Ensure this matches your filename exactly (Case-Sensitive)
import Settings from "./Settings"; 

const { View, Animated, Dimensions, Easing, Image, StyleSheet } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Safety check for all Metro modules
const ReactionModule = findByProps("addReaction");
const General = findByProps("View")?.View ? findByProps("View") : null;

let patches = [];
let lastBurstTime = 0;

// Initialize storage safely
storage.SnowEnabled ??= false;
storage.SnowPerformance ??= false;

const ParticleItem = React.memo(() => {
    const config = React.useMemo(() => ({
        x: Math.random() * SCREEN_WIDTH,
        size: storage.SnowPerformance ? 12 : (15 + Math.random() * 20),
        duration: 3000 + Math.random() * 3000,
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
                if (finished && isMounted && storage.SnowEnabled) run();
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
            {!storage.SnowPerformance ? (
                <Image source={{ uri: 'https://cdn.bwlok.dev/snowflake.png' }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            ) : (
                <View style={{ width: '100%', height: '100%', borderRadius: config.size / 2, backgroundColor: 'white' }} />
            )}
        </Animated.View>
    );
});

const SnowOverlay = () => {
    // Polling is the safest way to react to storage changes across different UI stacks
    const [active, setActive] = React.useState(false);
    
    React.useEffect(() => {
        const t = setInterval(() => {
            if (storage.SnowEnabled !== active) setActive(storage.SnowEnabled);
        }, 500);
        return () => clearInterval(t);
    }, [active]);

    if (!active) return null;

    return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {Array.from({ length: 50 }).map((_, i) => (
                <ParticleItem key={`${lastBurstTime}-${i}`} />
            ))}
        </View>
    );
};

export default {
    onLoad: () => {
        try {
            // 1. Reaction Patch (with extensive safety checks)
            if (ReactionModule?.addReaction) {
                patches.push(before("addReaction", ReactionModule, (args) => {
                    const emoji = args?.[2]; // Standard position for emoji object
                    if (emoji?.name === "❄️") {
                        const now = Date.now();
                        if (now - lastBurstTime < 10000) return;
                        lastBurstTime = now;
                        storage.SnowEnabled = true;
                        setTimeout(() => { storage.SnowEnabled = false; }, 15000);
                    }
                }));
            }

            // 2. The most stable injection point: General.View
            // We use a try-catch inside the patch to prevent the whole app from crashing
            if (General?.View) {
                patches.push(after("render", General.View, (args, res) => {
                    try {
                        if (!res?.props) return res;
                        
                        // Only inject into the root-level background view (flex: 1)
                        const style = ReactNative.StyleSheet.flatten(res.props.style);
                        if (style?.flex !== 1) return res;

                        const children = Array.isArray(res.props.children) ? res.props.children : [res.props.children];
                        if (children.some(c => c?.key === "snow-logic-root")) return res;

                        res.props.children = [
                            ...children,
                            React.createElement(SnowOverlay, { key: "snow-logic-root" })
                        ];
                    } catch (e) {
                        // Fail silently inside the render loop to keep the app alive
                    }
                    return res;
                }));
            }
        } catch (err) {
            // If anything goes wrong during onLoad, we still want the plugin to "enable" 
            // even if it does nothing, so the user can see it's active.
            console.error("[SnowPlugin] Failed to initialize patches:", err);
        }
    },
    onUnload: () => {
        patches.forEach(p => p?.());
        storage.SnowEnabled = false;
    },
    settings: Settings
};
