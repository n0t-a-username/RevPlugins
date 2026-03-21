import { before } from "@vendetta/patcher";
import { React, ReactNative, flux as Dispatcher } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { General } from "@vendetta/ui/components";
import { storage } from "@vendetta/plugin";
import Settings from "./Settings";

const { View, Animated, Dimensions, Easing, Image, StyleSheet } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ReactionModule = findByProps("addReaction");
let patches = [];
let isBursting = false;

const ParticleItem = React.memo(({ active }: { active: boolean }) => {
    const config = React.useMemo(() => ({
        x: Math.random() * SCREEN_WIDTH,
        size: 12 + Math.random() * 18,
        duration: 2500 + Math.random() * 2500,
        opacity: 0.6 + Math.random() * 0.4,
    }), []);

    const animValue = React.useRef(new Animated.Value(-50)).current;

    React.useEffect(() => {
        let isMounted = true;
        const run = () => {
            if (!isMounted) return;
            animValue.setValue(-50);
            Animated.timing(animValue, {
                toValue: SCREEN_HEIGHT + 50,
                duration: config.duration,
                useNativeDriver: true,
                easing: Easing.linear
            }).start(({ finished }) => {
                if (finished && active && isMounted) run();
            });
        };
        run();
        return () => { isMounted = false; animValue.stopAnimation(); };
    }, [active]);

    return (
        <Animated.View style={{
            position: "absolute", left: config.x, top: 0,
            width: config.size, height: config.size, opacity: config.opacity,
            transform: [{ translateY: animValue }]
        }}>
            <Image source={{ uri: 'https://cdn.bwlok.dev/snowflake.png' }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </Animated.View>
    );
});

const FallingParticles = ({ onFinish }: { onFinish: () => void }) => {
    const [active, setActive] = React.useState(true);

    React.useEffect(() => {
        // 4s of generation
        const activeTimer = setTimeout(() => setActive(false), 4000);
        // 7s total until unmount
        const finishTimer = setTimeout(onFinish, 7000);
        
        return () => {
            clearTimeout(activeTimer);
            clearTimeout(finishTimer);
        };
    }, []);

    const particles = React.useMemo(() => Array.from({ length: 50 }, (_, i) => i), []);

    return (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
            {particles.map(i => <ParticleItem key={i} active={active} />)}
        </View>
    );
};

// Singleton Controller to prevent double-mounts
const SnowController = () => {
    const [show, setShow] = React.useState(false);

    React.useEffect(() => {
        const trigger = () => {
            if (isBursting) return;
            isBursting = true;
            setShow(true);
        };

        // Listen for a custom internal event
        Dispatcher.subscribe("LET_IT_SNOW_TRIGGER", trigger);
        return () => Dispatcher.unsubscribe("LET_IT_SNOW_TRIGGER", trigger);
    }, []);

    if (!show) return null;

    return <FallingParticles onFinish={() => {
        setShow(false);
        isBursting = false;
    }} />;
};

export default {
    onLoad: () => {
        if (ReactionModule) {
            patches.push(before("addReaction", ReactionModule, (args) => {
                const [,, emoji] = args;
                if (emoji?.name === "❄️") {
                    // Fire a custom dispatcher event instead of setting storage
                    Dispatcher.dispatch({ type: "LET_IT_SNOW_TRIGGER" });
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

                const children = Array.isArray(wrapper.children) ? wrapper.children : [wrapper.children];
                if (!children.some(c => c?.key === "snow-logic")) {
                    wrapper.children = [...children, React.createElement(SnowController, { key: "snow-logic" })];
                }
            })
        );
    },
    onUnload: () => {
        patches.forEach(u => u());
        isBursting = false;
    },
    settings: Settings
};
