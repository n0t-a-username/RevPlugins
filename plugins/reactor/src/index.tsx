import { before } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { General } from "@vendetta/ui/components";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import Settings from "./Settings";

const { View, Animated, Dimensions, Easing, Image } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ReactionModule = findByProps("addReaction");

storage.SnowEnabled = false; 
storage.SnowPerformance ??= false;

let patches = [];
const persistentParticles = [];
let initialized = false;
let snowTimeout = null;

function createParticle(index) {
    const animValue = new Animated.Value(-50);
    const rotationValue = new Animated.Value(0);
    const x = Math.random() * SCREEN_WIDTH;
    const size = 10 + Math.random() * 20;
    const duration = 3500 + Math.random() * 2500;
    const opacity = 0.6 + Math.random() * 0.4;
    const rotation = Math.random() * 360;
    const shouldRotate = Math.random() > 0.4;
    const rotationSpeed = 3000 + Math.random() * 5000;
    const rotationDirection = Math.random() > 0.5 ? 1 : -1;

    return {
        id: index, x, size, duration, animValue, rotationValue,
        opacity, rotation, shouldRotate, rotationSpeed, rotationDirection
    };
}

function startSingleFall(particle, onDone) {
    particle.animValue.setValue(-50);
    particle.rotationValue.setValue(0);

    // Rotation Loop
    if (particle.shouldRotate) {
        Animated.timing(particle.rotationValue, {
            toValue: particle.rotationDirection * 360,
            duration: particle.rotationSpeed,
            useNativeDriver: true,
            easing: Easing.linear
        }).start();
    }

    // Falling Animation
    Animated.timing(particle.animValue, {
        toValue: SCREEN_HEIGHT + 50,
        duration: particle.duration,
        useNativeDriver: true,
        easing: Easing.linear
    }).start(({ finished }) => {
        if (finished && onDone) onDone();
    });
}

function initializeParticles() {
    if (initialized) return;
    initialized = true;
    for (let i = 0; i < 40; i++) {
        persistentParticles.push(createParticle(i));
    }
}

const ParticleItem = React.memo(({ particle, active }: { particle: any, active: boolean }) => {
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        if (active) {
            setIsVisible(true);
            const runIteration = () => {
                startSingleFall(particle, () => {
                    // Only restart if the parent says we're still active
                    if (active) {
                        runIteration();
                    } else {
                        setIsVisible(false);
                    }
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
        <Animated.View style={{
            position: "absolute", left: particle.x, top: 0,
            width: particle.size, height: particle.size, opacity: particle.opacity,
            transform: [
                { translateY: particle.animValue },
                { rotate: particle.shouldRotate ? animatedRotation : `${particle.rotation}deg` }
            ]
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
    useProxy(storage);
    // storage.SnowEnabled controls the mounting, but we need an "active" prop 
    // to tell particles when to stop looping and just finish their fall.
    const [active, setActive] = React.useState(true);

    React.useEffect(() => {
        initializeParticles();
        // After 3 seconds, stop starting new loops
        const timer = setTimeout(() => setActive(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View pointerEvents="none" style={{ position: "absolute", inset: 0, zIndex: 9999 }}>
            {persistentParticles.map(p => (
                <ParticleItem key={p.id} particle={p} active={active} />
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
                    
                    // Remount the component to start a fresh burst
                    storage.SnowEnabled = false;
                    setTimeout(() => {
                        storage.SnowEnabled = true;
                        // Hard clear after 5 seconds (3s active + 2s drain)
                        snowTimeout = setTimeout(() => {
                            storage.SnowEnabled = false;
                        }, 5000);
                    }, 10);
                }
            }));
        }

        patches.push(
            before("render", General.View, (args) => {
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
    },
    onUnload: () => {
        for (const unpatch of patches) unpatch();
        if (snowTimeout) clearTimeout(snowTimeout);
    },
    settings: Settings
};
