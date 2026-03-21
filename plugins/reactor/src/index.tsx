import { before } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { General } from "@vendetta/ui/components";
import { storage } from "@vendetta/plugin";
import Settings from "./Settings"; 

const { View, Animated, Dimensions, Easing, Image, StyleSheet } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ReactionModule = findByProps("addReaction");
const USE_SNOWFLAKE_IMAGE = !storage.SnowPerformance;

let patches = [];
const persistentParticles = [];
let lastBurstTime = 0;

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
        opacity: USE_SNOWFLAKE_IMAGE ? (0.6 + Math.random() * 0.4) : 1,
        rotation: Math.random() * 360,
        shouldRotate: USE_SNOWFLAKE_IMAGE && Math.random() > 0.4,
        rotationSpeed: 4000 + Math.random() * 8000,
        rotationDirection: Math.random() > 0.5 ? 1 : -1,
    };
}

function startAnimations() {
    persistentParticles.forEach(particle => {
        const animate = () => {
            particle.animValue.setValue(-50);
            if (particle.shouldRotate) particle.rotationValue.setValue(0);

            Animated.timing(particle.animValue, {
                toValue: SCREEN_HEIGHT + 50,
                duration: particle.duration,
                useNativeDriver: true,
                easing: Easing.linear
            }).start(({ finished }) => {
                // Only loop if the plugin hasn't been "turned off" by the timer
                if (finished && storage.SnowEnabled) animate();
            });

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
        animate();
    });
}

const ParticleItem = React.memo(({ particle }: { particle: any }) => {
    const rotation = particle.rotationValue.interpolate({
        inputRange: [-360, 360],
        outputRange: [`${particle.rotation - 360}deg`, `${particle.rotation + 360}deg`]
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
    // Only render the particles if the reaction was actually triggered
    if (!storage.SnowEnabled) return null;

    return (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
            {persistentParticles.map(p => <ParticleItem key={p.id} particle={p} />)}
        </View>
    );
};

export default {
    onLoad: () => {
        storage.SnowEnabled = false;

        if (ReactionModule) {
            patches.push(before("addReaction", ReactionModule, (args) => {
                const [,, emoji] = args;
                if (emoji?.name === "❄️") {
                    const now = Date.now();
                    if (now - lastBurstTime < 15000) return;
                    
                    lastBurstTime = now;
                    
                    // 1. Clear old particles to prevent duplication
                    persistentParticles.length = 0;
                    
                    // 2. Create new ones
                    for (let i = 0; i < 60; i++) {
                        persistentParticles.push(createParticle(i));
                    }
                    
                    // 3. Trigger state and start animations
                    storage.SnowEnabled = true;
                    startAnimations();

                    // 4. Auto-kill after 15s
                    setTimeout(() => {
                        storage.SnowEnabled = false;
                        persistentParticles.length = 0;
                    }, 15000); 
                }
            }));
        }

        patches.push(
            before("render", General.View, (args) => {
                const [wrapper] = args;
                if (!wrapper?.style?.some?.(s => s?.flex === 1)) return;

                const children = Array.isArray(wrapper.children) ? wrapper.children : [wrapper.children];
                // Strict check to prevent duplication during UI moves
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
        storage.SnowEnabled = false;
        persistentParticles.length = 0;
    },
    settings: Settings
};
