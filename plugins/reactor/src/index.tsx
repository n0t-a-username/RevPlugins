import { before } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { General } from "@vendetta/ui/components";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import Settings from "./Settings";

const { View, Animated, Dimensions, Easing, Image, StyleSheet } = ReactNative;
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
        size: 12 + Math.random() * 18,
        duration: 2800 + Math.random() * 2200, // Slightly slower for better visibility
        animValue: new Animated.Value(-50),
        opacity: 0.6 + Math.random() * 0.4,
    };
}

function startSingleFall(particle, activeRef, onDone) {
    particle.animValue.setValue(-50);
    Animated.timing(particle.animValue, {
        toValue: SCREEN_HEIGHT + 50,
        duration: particle.duration,
        useNativeDriver: true,
        easing: Easing.linear
    }).start(({ finished }) => {
        if (finished) {
            // Check the ref to see if we should loop again
            if (activeRef.current) {
                startSingleFall(particle, activeRef, onDone);
            } else {
                onDone(); // Exit and hide
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
    const [active, setActive] = React.useState(true);

    React.useEffect(() => {
        if (!initialized) {
            for (let i = 0; i < 50; i++) persistentParticles.push(createParticle(i));
            initialized = true;
        }
        
        // 4 seconds of "New" snow generation
        const timer = setTimeout(() => setActive(false), 4000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
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
                    
                    // Reset state to trigger a fresh mount
                    storage.SnowEnabled = false;
                    setTimeout(() => {
                        storage.SnowEnabled = true;
                        // Extended duration: 4s active + 3s for final descent
                        snowTimeout = setTimeout(() => {
                            storage.SnowEnabled = false;
                        }, 7000);
                    }, 32); 
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
        storage.SnowEnabled = false;
    },
    settings: Settings
};
