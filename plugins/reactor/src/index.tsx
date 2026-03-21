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
    return {
        id: index,
        x: Math.random() * SCREEN_WIDTH,
        size: 10 + Math.random() * 20,
        duration: 3000 + Math.random() * 2000,
        animValue: new Animated.Value(-50),
        rotationValue: new Animated.Value(0),
        opacity: 0.6 + Math.random() * 0.4,
        rotation: Math.random() * 360,
        shouldRotate: Math.random() > 0.4,
        rotationSpeed: 3000 + Math.random() * 5000,
        rotationDirection: Math.random() > 0.5 ? 1 : -1
    };
}

function startSingleFall(particle, onDone) {
    particle.animValue.setValue(-50);
    particle.rotationValue.setValue(0);

    if (particle.shouldRotate) {
        Animated.timing(particle.rotationValue, {
            toValue: particle.rotationDirection * 360,
            duration: particle.rotationSpeed,
            useNativeDriver: true,
            easing: Easing.linear
        }).start();
    }

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
                    if (active) runIteration();
                    else setIsVisible(false);
                });
            };
            runIteration();
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
        initializeParticles();
        // Stop starting new loops after 3 seconds
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
                    
                    // Toggle to force remount (fixes the "frozen" bug)
                    storage.SnowEnabled = false;
                    setTimeout(() => {
                        storage.SnowEnabled = true;
                        // Total time: 3s active + 2s for last ones to fall
                        snowTimeout = setTimeout(() => {
                            storage.SnowEnabled = false;
                        }, 5000);
                    }, 20);
                }
            }));
        }

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
