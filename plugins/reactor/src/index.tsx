import { before } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { General } from "@vendetta/ui/components";
import settings from "./settings.js";
import { storage } from "@vendetta/plugin";

const { View, Animated, Dimensions, Easing, Image, StyleSheet } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const USE_SNOWFLAKE_IMAGE = !storage.SnowPerformance;
let patches = [];
const persistentParticles = [];
let initialized = false;

// --- Logic remains the same, just made more robust ---

function createParticle(index, startFromCurrent = false) {
    const startY = startFromCurrent ? Math.random() * SCREEN_HEIGHT : -50;
    const animValue = new Animated.Value(startY);
    const rotationValue = new Animated.Value(0);
    
    return {
        id: index,
        x: Math.random() * SCREEN_WIDTH,
        size: USE_SNOWFLAKE_IMAGE ? (10 + Math.random() * 25) : (5 + Math.random() * 20),
        duration: 4000 + Math.random() * 6000,
        animValue,
        rotationValue,
        startY,
        opacity: USE_SNOWFLAKE_IMAGE ? (0.6 + Math.random() * 0.4) : 1,
        rotation: Math.random() * 360,
        shouldRotate: USE_SNOWFLAKE_IMAGE && Math.random() > 0.4,
        rotationSpeed: 4000 + Math.random() * 8000,
        rotationDirection: Math.random() > 0.5 ? 1 : -1,
    };
}

function startParticleAnimation(particle) {
    const animate = () => {
        particle.animValue.setValue(-50);
        if (particle.shouldRotate) particle.rotationValue.setValue(0);

        // Main Fall
        Animated.timing(particle.animValue, {
            toValue: SCREEN_HEIGHT + 50,
            duration: particle.duration,
            useNativeDriver: true,
            easing: Easing.linear
        }).start(({ finished }) => { if (finished) animate(); });

        // Rotation
        if (particle.shouldRotate) {
            Animated.loop(
                Animated.timing(particle.rotationValue, {
                    toValue: particle.rotationDirection * 360,
                    duration: particle.rotationSpeed,
                    useNativeDriver: true,
                    easing: Easing.linear
                })
            ).start();
        }
    };

    // Initial partial fall so snow doesn't all start at the top on load
    Animated.timing(particle.animValue, {
        toValue: SCREEN_HEIGHT + 50,
        duration: particle.duration * ((SCREEN_HEIGHT + 50 - particle.startY) / (SCREEN_HEIGHT + 100)),
        useNativeDriver: true,
        easing: Easing.linear
    }).start(({ finished }) => { if (finished) animate(); });
}

function initializeParticles() {
    if (initialized) return;
    for (let i = 0; i < 80; i++) {
        const p = createParticle(i, true);
        persistentParticles.push(p);
        startParticleAnimation(p);
    }
    initialized = true;
}

const ParticleItem = React.memo(({ particle }: { particle: any }) => {
    const rotation = particle.rotationValue.interpolate({
        inputRange: [0, 360],
        outputRange: [`${particle.rotation}deg`, `${particle.rotation + 360}deg`]
    });

    return (
        <Animated.View style={{
            position: "absolute", left: particle.x, top: 0,
            width: particle.size, height: particle.size, opacity: particle.opacity,
            transform: [
                { translateY: particle.animValue },
                { rotate: particle.shouldRotate ? rotation : `${particle.rotation}deg` }
            ]
        }}>
            {USE_SNOWFLAKE_IMAGE ? (
                <Image source={{ uri: 'https://cdn.bwlok.dev/snowflake.png' }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            ) : (
                <View style={{ width: '100%', height: '100%', borderRadius: particle.size / 2, backgroundColor: 'white' }} />
            )}
        </Animated.View>
    );
});

const SnowOverlay = () => {
    return (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
            {persistentParticles.map(p => <ParticleItem key={p.id} particle={p} />)}
        </View>
    );
};

export default {
    onLoad: () => {
        initializeParticles();

        patches.push(
            before("render", General.View, (args) => {
                const [wrapper] = args;
                // We target the root-most View by looking for flex: 1 without specific sub-types
                // This makes it show up EVERYWHERE (Settings, DMs, Server List)
                if (!wrapper?.style?.some?.(s => s?.flex === 1)) return;

                // Stop the "Double Injection" or "Restart" by checking for our key
                const children = Array.isArray(wrapper.children) ? wrapper.children : [wrapper.children];
                if (children.some(c => c?.key === "persistent-snow-overlay")) return;

                wrapper.children = [
                    ...children,
                    React.createElement(SnowOverlay, { key: "persistent-snow-overlay" })
                ];
            })
        );
    },
    onUnload: () => {
        patches.forEach(p => p());
        persistentParticles.length = 0;
        initialized = false;
    },
    settings
};
