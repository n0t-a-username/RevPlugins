import { before } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { General } from "@vendetta/ui/components";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import Settings from "./Settings";

const { View, Animated, Dimensions, Easing, Image } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Find the module responsible for adding reactions
const ReactionModule = findByProps("addReaction");

storage.SnowEnabled = false; 
storage.SnowPerformance ??= false;

let patches = [];
const persistentParticles = [];
let initialized = false;
let snowTimeout = null;

function createParticle(index, startFromCurrent = false) {
    const startY = startFromCurrent ? Math.random() * SCREEN_HEIGHT : -50;
    const animValue = new Animated.Value(startY);
    const rotationValue = new Animated.Value(0);
    const x = Math.random() * SCREEN_WIDTH;
    const size = 10 + Math.random() * 20;
    const duration = 3000 + Math.random() * 4000;
    const opacity = 0.6 + Math.random() * 0.4;
    const rotation = Math.random() * 360;
    const shouldRotate = Math.random() > 0.4;
    const rotationSpeed = 3000 + Math.random() * 5000;
    const rotationDirection = Math.random() > 0.5 ? 1 : -1;

    return {
        id: index, x, size, duration, animValue, rotationValue,
        startY, opacity, rotation, shouldRotate, rotationSpeed, rotationDirection
    };
}

function startAnimations(particle) {
    const rotate = () => {
        particle.rotationValue.setValue(0);
        Animated.timing(particle.rotationValue, {
            toValue: particle.rotationDirection * 360,
            duration: particle.rotationSpeed,
            useNativeDriver: true,
            easing: Easing.linear
        }).start(({finished}) => { if (finished) rotate(); });
    };
    if (particle.shouldRotate) rotate();

    const animate = () => {
        particle.animValue.setValue(-50);
        Animated.timing(particle.animValue, {
            toValue: SCREEN_HEIGHT + 50,
            duration: particle.duration,
            useNativeDriver: true,
            easing: Easing.linear
        }).start(({finished}) => { if (finished) animate(); });
    };

    Animated.timing(particle.animValue, {
        toValue: SCREEN_HEIGHT + 50,
        duration: particle.duration * ((SCREEN_HEIGHT + 50 - particle.startY) / (SCREEN_HEIGHT + 100)),
        useNativeDriver: true,
        easing: Easing.linear
    }).start(({finished}) => { if (finished) animate(); });
}

function initializeParticles() {
    if (initialized) return;
    initialized = true;
    for (let i = 0; i < 60; i++) {
        const particle = createParticle(i, true);
        persistentParticles.push(particle);
        startAnimations(particle);
    }
}

const ParticleItem = React.memo(({ particle }: { particle: any }) => {
    useProxy(storage);
    if (storage.SnowPerformance) {
        return (
            <Animated.View style={{
                position: "absolute", left: particle.x, top: 0,
                width: particle.size / 3, height: particle.size / 3,
                borderRadius: 10, backgroundColor: 'white', opacity: 0.5,
                transform: [{ translateY: particle.animValue }]
            }} />
        );
    }

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
    React.useEffect(() => { initializeParticles(); }, []);
    return (
        <View pointerEvents="none" style={{ position: "absolute", inset: 0, zIndex: 9999 }}>
            {persistentParticles.map(p => <ParticleItem key={p.id} particle={p} />)}
        </View>
    );
};

export default {
    onLoad: () => {
        // Patch the actual reaction action
        if (ReactionModule) {
            patches.push(before("addReaction", ReactionModule, (args) => {
                const [channelId, messageId, emoji] = args;
                
                // Trigger only if the emoji name is snowflake
                if (emoji?.name === "❄️") {
                    if (snowTimeout) clearTimeout(snowTimeout);
                    
                    storage.SnowEnabled = true;
                    
                    snowTimeout = setTimeout(() => {
                        storage.SnowEnabled = false;
                    }, 10000); // 10 second burst
                }
            }));
        }

        // UI Injection
        patches.push(
            before("render", General.View, (args) => {
                const [wrapper] = args;
                if (!wrapper || !Array.isArray(wrapper.style)) return;
                if (!wrapper.style.some(s => s?.flex === 1)) return;

                let child = wrapper.children;
                if (Array.isArray(child)) {
                    child = child.find(c => c?.type?.name === "NativeStackViewInner");
                }
                if (child?.type?.name !== "NativeStackViewInner") return;

                const routes = child?.props?.state?.routeNames;
                if (!routes?.includes("main")) return;

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
