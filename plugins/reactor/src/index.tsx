import { after, before } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps, findByName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import Settings from "./Settings"; 

const { View, Animated, Dimensions, Easing, Image, StyleSheet } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ReactionModule = findByProps("addReaction");
// Fallback to a very common root component if General.View is being finicky
const AppContainer = findByName("App", false) || findByProps("AppLayerContainer");

let patches = [];
let particles = [];
let lastBurstTime = 0;

// Ensure storage defaults are set so the plugin doesn't crash on load
if (storage.SnowEnabled === undefined) storage.SnowEnabled = false;
if (storage.SnowPerformance === undefined) storage.SnowPerformance = false;

function createParticle(index) {
    const isImg = !storage.SnowPerformance;
    return {
        id: index,
        x: Math.random() * SCREEN_WIDTH,
        size: isImg ? (10 + Math.random() * 25) : (5 + Math.random() * 15),
        duration: 3000 + Math.random() * 3000,
        animValue: new Animated.Value(-50),
        opacity: isImg ? (0.6 + Math.random() * 0.4) : 1,
    };
}

const SnowOverlay = () => {
    // We use local state to trigger a re-render when the global storage changes
    const [active, setActive] = React.useState(false);
    const [trigger, setTrigger] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            if (storage.SnowEnabled !== active) {
                setActive(storage.SnowEnabled);
                if (storage.SnowEnabled) {
                    // Refresh particles on each new burst
                    particles = Array.from({ length: 50 }, (_, i) => createParticle(i));
                    setTrigger(Date.now());
                }
            }
        }, 500); // Check every 500ms for the "reaction" flag
        return () => clearInterval(interval);
    }, [active]);

    if (!active) return null;

    return (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
            {particles.map((p) => (
                <ParticleComponent key={`${trigger}-${p.id}`} p={p} />
            ))}
        </View>
    );
};

const ParticleComponent = ({ p }) => {
    React.useEffect(() => {
        const run = () => {
            p.animValue.setValue(-50);
            Animated.timing(p.animValue, {
                toValue: SCREEN_HEIGHT + 50,
                duration: p.duration,
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
            position: "absolute", left: p.x, top: 0,
            width: p.size, height: p.size, opacity: p.opacity,
            transform: [{ translateY: p.animValue }]
        }}>
            {!storage.SnowPerformance ? (
                <Image source={{ uri: 'https://cdn.bwlok.dev/snowflake.png' }} style={{ width: '100%', height: '100%' }} />
            ) : (
                <View style={{ width: '100%', height: '100%', borderRadius: p.size / 2, backgroundColor: 'white' }} />
            )}
        </Animated.View>
    );
};

export default {
    onLoad: () => {
        // 1. Reaction Patch
        if (ReactionModule) {
            patches.push(before("addReaction", ReactionModule, (args) => {
                const [,, emoji] = args;
                if (emoji?.name === "❄️") {
                    if (Date.now() - lastBurstTime < 10000) return;
                    lastBurstTime = Date.now();
                    storage.SnowEnabled = true;
                    setTimeout(() => { storage.SnowEnabled = false; }, 15000);
                }
            }));
        }

        // 2. Root Injection
        // We use 'after' on the App container to ensure we are the last thing rendered (on top)
        if (AppContainer) {
            patches.push(after("default", AppContainer, (_, res) => {
                if (!res) return res;
                const children = Array.isArray(res.props.children) ? res.props.children : [res.props.children];
                
                if (!children.some(c => c?.key === "snow-root")) {
                    res.props.children = [
                        ...children,
                        React.createElement(SnowOverlay, { key: "snow-root" })
                    ];
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
