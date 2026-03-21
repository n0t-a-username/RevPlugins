import { before } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { General } from "@vendetta/ui/components";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import Settings from "./Settings";

// Move these into a scope where they won't crash on boot
let SCREEN_WIDTH, SCREEN_HEIGHT;
let patches = [];
const persistentParticles = [];
let initialized = false;
let snowTimeout = null;

// Helper to create particles safely
function createParticle(index) {
    return {
        id: index,
        x: Math.random() * (SCREEN_WIDTH || 400),
        size: 10 + Math.random() * 20,
        duration: 3500 + Math.random() * 2500,
        animValue: new Animated.Value(-50),
        rotationValue: new Animated.Value(0),
        opacity: 0.6 + Math.random() * 0.4,
        rotation: Math.random() * 360,
        shouldRotate: Math.random() > 0.4,
        rotationSpeed: 3000 + Math.random() * 5000,
        rotationDirection: Math.random() > 0.5 ? 1 : -1
    };
}

// Separate Animation Logic
const startSingleFall = (particle, onDone) => {
    particle.animValue.setValue(-50);
    particle.rotationValue.setValue(0);

    if (particle.shouldRotate) {
        ReactNative.Animated.timing(particle.rotationValue, {
            toValue: particle.rotationDirection * 360,
            duration: particle.rotationSpeed,
            useNativeDriver: true,
            easing: ReactNative.Easing.linear
        }).start();
    }

    ReactNative.Animated.timing(particle.animValue, {
        toValue: (SCREEN_HEIGHT || 800) + 50,
        duration: particle.duration,
        useNativeDriver: true,
        easing: ReactNative.Easing.linear
    }).start(({ finished }) => {
        if (finished && onDone) onDone();
    });
}

const ParticleItem = React.memo(({ particle, active }: { particle: any, active: boolean }) => {
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        if (active) {
            setIsVisible(true);
            const runIteration = () => {
                startSingleFall(particle, () => {
                    if (active) runIteration();
                    else setIsVisible(false);
                });
            };
            runIteration();
        }
    }, [active]);

    if (!isVisible) return null;

    const animatedRotation = particle.rotationValue.interpolate({
        inputRange: [0, 360],
        outputRange: [`${particle.rotation}deg`, `${particle.rotation + 360}deg`]
    });

    return (
        <ReactNative.Animated.View style={{
            position: "absolute", left: particle.x, top: 0,
            width: particle.size, height: particle.size, opacity: particle.opacity,
            transform: [
                { translateY: particle.animValue },
                { rotate: particle.shouldRotate ? animatedRotation : `${particle.rotation}deg` }
            ]
        }}>
            <ReactNative.Image
                source={{ uri: 'https://cdn.bwlok.dev/snowflake.png' }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
            />
        </ReactNative.Animated.View>
    );
});

const FallingParticles = () => {
    const [active, setActive] = React.useState(true);

    React.useEffect(() => {
        if (!initialized) {
            for (let i = 0; i < 40; i++) persistentParticles.push(createParticle(i));
            initialized = true;
        }
        const timer = setTimeout(() => setActive(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <ReactNative.View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
            {persistentParticles.map(p => (
                <ParticleItem key={p.id} particle={p} active={active} />
            ))}
        </ReactNative.View>
    );
};

export default {
    onLoad: () => {
        // Initialize dimensions inside onLoad
        const dims = ReactNative.Dimensions.get("window");
        SCREEN_WIDTH = dims.width;
        SCREEN_HEIGHT = dims.height;

        storage.SnowEnabled = false;

        try {
            // 1. Safe Reaction Patch
            const ReactionModule = findByProps("addReaction");
            if (ReactionModule) {
                patches.push(before("addReaction", ReactionModule, (args) => {
                    const [,, emoji] = args;
                    if (emoji?.name === "❄️") {
                        if (snowTimeout) clearTimeout(snowTimeout);
                        storage.SnowEnabled = false;
                        setTimeout(() => {
                            storage.SnowEnabled = true;
                            snowTimeout = setTimeout(() => {
                                storage.SnowEnabled = false;
                            }, 5000);
                        }, 50);
                    }
                }));
            }

            // 2. Safe View Patch
            const ViewComponent = General?.View || findByProps("View")?.View;
            if (ViewComponent) {
                patches.push(
                    before("render", ViewComponent, (args) => {
                        const [wrapper] = args;
                        if (!wrapper?.style?.some(s => s?.flex === 1)) return;

                        let child = wrapper.children;
                        if (Array.isArray(child)) child = child.find(c => c?.type?.name === "NativeStackViewInner");
                        if (child?.type?.name !== "NativeStackViewInner") return;
                        if (!child?.props?.state?.routeNames?.includes("main")) return;

                        const SnowWrapper = () => {
                            useProxy(storage);
                            return storage.SnowEnabled ? <FallingParticles /> : null;
                        };

                        const currentChildren = Array.isArray(wrapper.children) ? wrapper.children : [wrapper.children];
                        wrapper.children = [...currentChildren, React.createElement(SnowWrapper, { key: "snow-effect" })];
                    })
                );
            }
        } catch (err) {
            console.error("[LetItSnow] Load Error:", err);
        }
    },
    onUnload: () => {
        patches.forEach(u => u());
        if (snowTimeout) clearTimeout(snowTimeout);
    },
    settings: Settings
};
