import { after, before } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { logger } from "@vendetta/utils"; // Use this to check logs
import Settings from "./Settings"; 

const { View, Animated, Dimensions, Easing, Image, StyleSheet } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Find the reaction module more aggressively
const ReactionModule = findByProps("addReaction") || findByProps("addEmojiReaction");
// Find the layout container
const Layout = findByProps("AppLayerContainer") || findByProps("Layout");

let patches = [];
let lastBurstTime = 0;

if (storage.SnowEnabled === undefined) storage.SnowEnabled = false;

const ParticleItem = React.memo(({ id }: { id: number }) => {
    const config = React.useMemo(() => ({
        x: Math.random() * SCREEN_WIDTH,
        size: storage.SnowPerformance ? 10 : (15 + Math.random() * 20),
        duration: 3000 + Math.random() * 3000,
        opacity: 0.5 + Math.random() * 0.5,
    }), []);

    const animValue = React.useRef(new Animated.Value(-50)).current;

    React.useEffect(() => {
        const run = () => {
            animValue.setValue(-50);
            Animated.timing(animValue, {
                toValue: SCREEN_HEIGHT + 50,
                duration: config.duration,
                useNativeDriver: true,
                easing: Easing.linear
            }).start(({ finished }) => {
                if (finished && storage.SnowEnabled) run();
            });
        };
        run();
    }, []);

    return (
        <Animated.View style={{
            position: "absolute", left: config.x, top: 0,
            width: config.size, height: config.size, opacity: config.opacity,
            transform: [{ translateY: animValue }]
        }}>
            {!storage.SnowPerformance ? (
                <Image source={{ uri: 'https://cdn.bwlok.dev/snowflake.png' }} style={{ width: '100%', height: '100%' }} />
            ) : (
                <View style={{ width: '100%', height: '100%', borderRadius: config.size / 2, backgroundColor: 'white' }} />
            )}
        </Animated.View>
    );
});

const SnowOverlay = () => {
    // We force a re-render when storage.SnowEnabled changes
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        const check = setInterval(() => {
            if (storage.SnowEnabled !== isVisible) setIsVisible(storage.SnowEnabled);
        }, 300);
        return () => clearInterval(check);
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {Array.from({ length: 50 }).map((_, i) => (
                <ParticleItem key={`${lastBurstTime}-${i}`} id={i} />
            ))}
        </View>
    );
};

export default {
    onLoad: () => {
        logger.log("Snow Plugin Loading...");

        if (ReactionModule) {
            logger.log("ReactionModule found!");
            // Try patching both common reaction methods
            const methods = ["addReaction", "addEmojiReaction"];
            
            methods.forEach(method => {
                if (ReactionModule[method]) {
                    patches.push(before(method, ReactionModule, (args) => {
                        // Emoji is usually the 3rd or 4th argument depending on version
                        const emoji = args.find(a => a?.name === "❄️" || a?.id === "❄️");
                        
                        if (emoji) {
                            logger.log("Snowflake reaction detected!");
                            const now = Date.now();
                            if (now - lastBurstTime < 10000) return;
                            
                            lastBurstTime = now;
                            storage.SnowEnabled = true;
                            setTimeout(() => { storage.SnowEnabled = false; }, 15000);
                        }
                    }));
                }
            });
        } else {
            logger.error("ReactionModule NOT found.");
        }

        // Inject into the top-level layout
        if (Layout?.AppLayerContainer) {
            patches.push(after("AppLayerContainer", Layout, (_, res) => {
                if (!res) return res;
                const children = Array.isArray(res.props.children) ? res.props.children : [res.props.children];
                if (!children.some(c => c?.key === "snow-overlay")) {
                    res.props.children = [...children, React.createElement(SnowOverlay, { key: "snow-overlay" })];
                }
                return res;
            }));
        }
    },
    onUnload: () => {
        patches.forEach(p => p());
        storage.SnowEnabled = false;
    },
    settings: Settings
};
