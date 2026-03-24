import { after } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import Settings from "./Settings"; 

const { View, Animated, Dimensions, Easing, Image, StyleSheet } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const SelectedChannelStore = findByStoreName("SelectedChannelStore");
const MessageStore = findByProps("addReaction", "removeReaction");
const GeneralModule = findByProps("View");

let patches = [];
let lastBurstTime = 0;
let snowTimer = null;
let fadeTimer = null;
let activeChannelId = null; 

// This stays persistent so animations don't reset abruptly
const globalOpacity = new Animated.Value(0);

storage.SnowEnabled ??= false;

const PARTICLE_COUNT = 25;
const PARTICLE_POOL = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * SCREEN_WIDTH,
    size: 10 + Math.random() * 15,
    duration: 2500 + Math.random() * 2000, 
    baseOpacity: 0.3 + Math.random() * 0.5,
    initialDelay: Math.random() * 3000 
}));

const Particle = () => {
    const data = React.useMemo(() => PARTICLE_POOL[Math.floor(Math.random() * PARTICLE_COUNT)], []);
    const animatedValue = React.useRef(new Animated.Value(-100)).current;

    React.useEffect(() => {
        let isMounted = true;
        
        const runAnimation = (delay = 0) => {
            if (!isMounted) return;
            
            animatedValue.setValue(-100);
            Animated.timing(animatedValue, {
                toValue: SCREEN_HEIGHT + 100,
                duration: data.duration,
                delay: delay,
                useNativeDriver: true,
                easing: Easing.linear
            }).start(({ finished }) => {
                // We loop REGARDLESS of storage.SnowEnabled to keep the "flow" constant
                if (finished && isMounted) runAnimation(0);
            });
        };

        runAnimation(data.initialDelay);
        return () => { isMounted = false; animatedValue.stopAnimation(); };
    }, []);

    return (
        <Animated.View style={{
            position: "absolute", left: data.x, top: 0,
            width: data.size, height: data.size,
            opacity: data.baseOpacity,
            transform: [{ translateY: animatedValue }]
        }}>
            <Image source={{ uri: 'https://cdn.bwlok.dev/snowflake.png' }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </Animated.View>
    );
};

const SnowOverlay = () => {
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const currentViewedChannel = SelectedChannelStore?.getChannelId();

    React.useEffect(() => {
        const interval = setInterval(() => forceUpdate(), 400);
        return () => clearInterval(interval);
    }, []);

    // We keep the component mounted but use opacity for the "off" state
    // This prevents the particles from "snapping" back to the top when you react again
    const isVisible = storage.SnowEnabled && currentViewedChannel === activeChannelId;

    return (
        <Animated.View 
            pointerEvents="none" 
            style={[StyleSheet.absoluteFill, { zIndex: 999, opacity: globalOpacity }]}
        >
            {PARTICLE_POOL.map((_, i) => <Particle key={i} />)}
        </Animated.View>
    );
};

export default {
    onLoad: () => {
        if (MessageStore) {
            patches.push(after("addReaction", MessageStore, (args) => {
                const channelId = args[0];
                const emoji = args[2];
                
                if (emoji?.name === "❄️" || emoji?.id === "❄️") {
                    const now = Date.now();
                    if (now - lastBurstTime < 5000) return;
                    
                    lastBurstTime = now;
                    activeChannelId = channelId; 
                    storage.SnowEnabled = true;

                    // Immediately pop to visible
                    globalOpacity.setValue(1);

                    if (snowTimer) clearTimeout(snowTimer);
                    if (fadeTimer) clearTimeout(fadeTimer);

                    // Fade starts at 4350ms
                    fadeTimer = setTimeout(() => {
                        Animated.timing(globalOpacity, {
                            toValue: 0,
                            duration: 1000, 
                            useNativeDriver: true,
                            easing: Easing.linear
                        }).start();
                    }, 4350);

                    // Logic toggle at 5500ms
                    snowTimer = setTimeout(() => { 
                        storage.SnowEnabled = false; 
                        activeChannelId = null;
                        snowTimer = null;
                    }, 5500);
                }
            }));
        }

        if (GeneralModule?.View) {
            patches.push(after("render", GeneralModule.View, (args, res) => {
                if (!res?.props) return res;
                const style = StyleSheet.flatten(res.props.style);
                if (style?.flex !== 1 || !res.props.onLayout) return res;

                const children = React.Children.toArray(res.props.children);
                if (children.some(c => c?.key === "snow-v7-flow-layer")) return res;

                res.props.children = [...children, React.createElement(SnowOverlay, { key: "snow-v7-flow-layer" })];
                return res;
            }));
        }
    },
    onUnload: () => {
        patches.forEach(p => p?.());
        if (snowTimer) clearTimeout(snowTimer);
        if (fadeTimer) clearTimeout(fadeTimer);
        storage.SnowEnabled = false;
    },
    settings: Settings
};
