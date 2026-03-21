import { after, before } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps, findByName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import Settings from "./Settings";

const { View, Animated, Dimensions, Easing, Image, StyleSheet } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ReactionModule = findByProps("addReaction");
// This is the component that renders the actual chat messages
const MessagesList = findByName("MessagesList", false);

storage.SnowEnabled = false; 
let patches = [];
let lastBurstTime = 0;

const ParticleItem = React.memo(({ startTime }: { startTime: number }) => {
    const config = React.useMemo(() => ({
        x: Math.random() * SCREEN_WIDTH,
        size: 10 + Math.random() * 20,
        duration: 3000 + Math.random() * 3000,
        opacity: 0.4 + Math.random() * 0.6,
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
                    if (finished && isMounted && (Date.now() - startTime < 10000)) {
                        run(false);
                    }
                });
            };

            if (isFirstRun) setTimeout(startTiming, config.initialDelay);
            else startTiming();
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

const SnowWrapper = () => {
    useProxy(storage);
    return storage.SnowEnabled ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
            {Array.from({ length: 50 }).map((_, i) => (
                <ParticleItem key={`${lastBurstTime}-${i}`} startTime={lastBurstTime} />
            ))}
        </View>
    ) : null;
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

        // Patch the MessagesList to include the snow
        if (MessagesList) {
            patches.push(after("default", MessagesList, (args, res) => {
                // If there's no render result or we are already injected, skip
                if (!res) return;
                
                // We wrap the original MessagesList result and our Snow in a fragment or View
                return (
                    <View style={{ flex: 1 }}>
                        {res}
                        <SnowWrapper />
                    </View>
                );
            }));
        }
    },
    onUnload: () => {
        patches.forEach(u => u());
        storage.SnowEnabled = false;
    },
    settings: Settings
};
