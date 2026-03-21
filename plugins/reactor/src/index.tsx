import { before } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import Settings from "./Settings"; 

const { View, Animated, Dimensions, Easing, Image, StyleSheet } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// We use the Portal to inject at the highest possible layer
const Portal = findByProps("Portal");
const ReactionModule = findByProps("addReaction");
const USE_SNOWFLAKE_IMAGE = !storage.SnowPerformance;

let patches = [];
const persistentParticles = [];
let lastBurstTime = 0;

function createParticle(index) {
    return {
        id: index,
        x: Math.random() * SCREEN_WIDTH,
        size: USE_SNOWFLAKE_IMAGE ? (10 + Math.random() * 25) : (5 + Math.random() * 20),
        duration: 3500 + Math.random() * 2500,
        animValue: new Animated.Value(-50),
        rotationValue: new Animated.Value(0),
        opacity: USE_SNOWFLAKE_IMAGE ? (0.6 + Math.random() * 0.4) : 1,
        rotation: Math.random() * 360,
        shouldRotate: USE_SNOWFLAKE_IMAGE && Math.random() > 0.4,
        rotationSpeed: 4000 + Math.random() * 8000,
        rotationDirection: Math.random() > 0.5 ? 1 : -1,
    };
}

const ParticleItem = React.memo(({ particle }: { particle: any }) => {
    const rotation = particle.rotationValue.interpolate({
        inputRange: [-360, 360],
        outputRange: [`${particle.rotation - 360}deg`, `${particle.rotation + 360}deg`]
    });

    React.useEffect(() => {
        const run = () => {
            particle.animValue.setValue(-50);
            Animated.timing(particle.animValue, {
                toValue: SCREEN_HEIGHT + 50,
                duration: particle.duration,
                useNativeDriver: true,
                easing: Easing.linear
            }).start(({ finished }) => {
                if (finished && storage.SnowEnabled) run();
            });

            if (particle.shouldRotate) {
                particle.rotationValue.setValue(0);
                Animated.timing(particle.rotationValue, {
                    toValue: particle.rotationDirection * 360,
                    duration: particle.rotationSpeed,
                    useNativeDriver: true,
                    easing: Easing.linear
                }).start();
            }
        };
        run();
    }, []);

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
    // Re-trigger the component when snow is enabled
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    
    React.useEffect(() => {
        if (storage.SnowEnabled) forceUpdate();
    }, [storage.SnowEnabled]);

    if (!storage.SnowEnabled) return null;

    return (
        <Portal>
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                {persistentParticles.map(p => <ParticleItem key={`${lastBurstTime}-${p.id}`} particle={p} />)}
            </View>
        </Portal>
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
                    if (now - lastBurstTime < 10000) return;
                    
                    lastBurstTime = now;
                    persistentParticles.length = 0;
                    
                    for (let i = 0; i < 60; i++) {
                        persistentParticles.push(createParticle(i));
                    }
                    
                    storage.SnowEnabled = true;

                    setTimeout(() => {
                        storage.SnowEnabled = false;
                        persistentParticles.length = 0;
                    }, 15000); 
                }
            }));
        }

        // We still need to mount the "Listener" component once at the root
        patches.push(
            before("render", General.View, (args) => {
                const [wrapper] = args;
                if (!wrapper?.style?.some?.(s => s?.flex === 1)) return;

                const children = Array.isArray(wrapper.children) ? wrapper.children : [wrapper.children];
                if (children.some(c => c?.key === "snow-portal-gate")) return;

                wrapper.children = [
                    ...children,
                    React.createElement(SnowOverlay, { key: "snow-portal-gate" })
                ];
            })
        );
    },
    onUnload: () => {
        patches.forEach(p => p());
        storage.SnowEnabled = false;
    },
    settings: Settings
};
