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
        duration: 2500 + Math.random() * 2000,
        animValue: new Animated.Value(-50),
        opacity: 0.6 + Math.random() * 0.4,
    };
}

function startSingleFall(particle, active, onDone) {
    particle.animValue.setValue(-50);
    Animated.timing(particle.animValue, {
        toValue: SCREEN_HEIGHT + 50,
        duration: particle.duration,
        useNativeDriver: true,
        easing: Easing.linear
    }).start(({ finished }) => {
        if (finished) {
            if (active.current) {
                startSingleFall(particle, active, onDone);
            } else {
                onDone();
            }
        }
    });
}

const ParticleItem = React.memo(({ particle, isActive }: { particle: any, isActive: boolean }) => {
    const [visible, setVisible] = React.useState(false);
    const activeRef = React.useRef(isActive);

    React.useEffect(() => {
        activeRef.current = isActive;
        if (isActive && !visible) {
            setVisible(true);
            startSingleFall(particle, activeRef, () => setVisible(false));
        }
    }, [isActive]);

    if (!visible) return null;

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
    useProxy(storage);
    const [active, setActive] = React.useState(true);

    React.useEffect(() => {
        if (!initialized) {
            for (let i = 0; i < 50; i++) persistentParticles.push(createParticle(i));
            initialized = true;
        }
        
        // Stop "creating" (looping) after 3 seconds
        const timer = setTimeout(() => setActive(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View pointerEvents="none" style={{ ...ReactNative.StyleSheet.absoluteFillObject, zIndex: 9999 }}>
            {persistentParticles.map(p => (
                <ParticleItem key={p.id} particle={p} isActive={active} />
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
                    
                    // Force restart logic
                    storage.SnowEnabled = false;
                    setTimeout(() => {
                        storage.SnowEnabled = true;
                        // 3s generation + 2s fall time = 5s total mount
                        snowTimeout = setTimeout(() => {
                            storage.SnowEnabled = false;
                        }, 5000);
                    }, 16); // One frame delay
                }
            }));
        }

        patches.push(
            before("render", General.View, (args) => {
                const [wrapper] = args;
                if (!wrapper?.style?.some?.(s => s?.flex === 1)) return;

                let child = wrapper.children;
                if (Array.isArray(child)) child = child.find(c => c?.type?.name === "NativeStackViewInner");
                if (child?.type?.name !== "NativeStackViewInner") return;
                if (!child?.props?.state?.routeNames?.includes("main")) return;

                const SnowWrapper = () => {
                    useProxy(storage);
                    return storage.SnowEnabled ? <FallingParticles /> : null;
                };

                const children = Array.isArray(wrapper.children) ? wrapper.children : [wrapper.children];
                if (!children.some(c => c?.key === "snow-logic")) {
                    wrapper.children = [...children, React.createElement(SnowWrapper, { key: "snow-logic" })];
                }
            })
        );
    },
    onUnload: () => {
        patches.forEach(u => u());
        if (snowTimeout) clearTimeout(snowTimeout);
    },
    settings: Settings
};
