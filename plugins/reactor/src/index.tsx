import { after } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps, findByName } from "@vendetta/metro";
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
const persistentParticles = [];

function createParticle(index) {
    return {
        id: index,
        x: Math.random() * SCREEN_WIDTH,
        size: 10 + Math.random() * 20,
        duration: 3000 + Math.random() * 2000,
        animValue: new Animated.Value(-50),
        opacity: 0.6 + Math.random() * 0.4,
    };
}

const ParticleItem = React.memo(({ particle, active }) => {
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        if (active) {
            setIsVisible(true);
            const run = () => {
                particle.animValue.setValue(-50);
                Animated.timing(particle.animValue, {
                    toValue: SCREEN_HEIGHT + 50,
                    duration: particle.duration,
                    useNativeDriver: true,
                    easing: Easing.linear
                }).start(({ finished }) => {
                    if (finished && active) run();
                    else setIsVisible(false);
                });
            };
            run();
        } else {
            // If not active, let current animation finish, then hide
        }
    }, [active]);

    if (!isVisible) return null;

    return (
        <Animated.View style={{
            position: "absolute", left: particle.x, top: 0,
            width: particle.size, height: particle.size, opacity: particle.opacity,
            transform: [{ translateY: particle.animValue }]
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
        if (persistentParticles.length === 0) {
            for (let i = 0; i < 40; i++) persistentParticles.push(createParticle(i));
        }
        const timer = setTimeout(() => setActive(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
            {persistentParticles.map(p => (
                <ParticleItem key={p.id} particle={p} active={active} />
            ))}
        </View>
    );
};

const SnowWrapper = () => {
    useProxy(storage);
    // Use a unique key based on a timestamp to force a clean remount on every burst
    const [burstKey, setBurstKey] = React.useState(0);

    React.useEffect(() => {
        if (storage.SnowEnabled) setBurstKey(Date.now());
    }, [storage.SnowEnabled]);

    return storage.SnowEnabled ? <FallingParticles key={burstKey} /> : null;
};

export default {
    onLoad: () => {
        if (ReactionModule) {
            patches.push(before("addReaction", ReactionModule, (args) => {
                const [,, emoji] = args;
                if (emoji?.name === "❄️") {
                    if (snowTimeout) clearTimeout(snowTimeout);
                    
                    // Simple toggle to trigger the useEffect in SnowWrapper
                    storage.SnowEnabled = true;
                    
                    snowTimeout = setTimeout(() => {
                        storage.SnowEnabled = false;
                    }, 5000);
                }
            }));
        }

        // Patch the main App component instead of General.View
        // This avoids the "flashing" because it only renders once
        const App = findByName("App", false);
        if (App) {
            patches.push(after("default", App, (args, res) => {
                // Find the main container in the React tree and append our wrapper
                if (!res?.props?.children) return;
                
                const children = Array.isArray(res.props.children) ? res.props.children : [res.props.children];
                res.props.children = [...children, React.createElement(SnowWrapper)];
            }));
        }
    },
    onUnload: () => {
        patches.forEach(u => u());
        if (snowTimeout) clearTimeout(snowTimeout);
    },
    settings: Settings
};
