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
let activeChannelId = null; 

storage.SnowEnabled ??= false;

const PARTICLE_COUNT = 25; // Bumped up slightly for a fuller feel
const PARTICLE_POOL = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * SCREEN_WIDTH,
    size: 10 + Math.random() * 15,
    duration: 4000 + Math.random() * 3000, // Varied speeds
    opacity: 0.3 + Math.random() * 0.5,
    // Start some particles off-screen at different heights
    initialDelay: Math.random() * 5000 
}));

const Particle = ({ data }) => {
    // Each particle gets its own unique animated value
    const animatedValue = React.useRef(new Animated.Value(-100)).current;

    React.useEffect(() => {
        let isMounted = true;

        const runAnimation = (delay = 0) => {
            if (!isMounted || !storage.SnowEnabled) return;

            animatedValue.setValue(-100);
            
            Animated.timing(animatedValue, {
                toValue: SCREEN_HEIGHT + 100,
                duration: data.duration,
                delay: delay, // Use the delay to stagger the "spurts"
                useNativeDriver: true,
                easing: Easing.out(Easing.quad) // Smooth deceleration-like feel
            }).start(({ finished }) => {
                if (finished && isMounted && storage.SnowEnabled) {
                    runAnimation(0); // Loop immediately without the initial delay
                }
            });
        };

        if (storage.SnowEnabled) {
            runAnimation(data.initialDelay);
        } else {
            animatedValue.stopAnimation();
            animatedValue.setValue(-100);
        }

        return () => {
            isMounted = false;
            animatedValue.stopAnimation();
        };
    }, [storage.SnowEnabled]);

    return (
        <Animated.View style={{
            position: "absolute",
            left: data.x,
            top: 0,
            width: data.size,
            height: data.size,
            opacity: data.opacity,
            transform: [{ translateY: animatedValue }]
        }}>
            <Image 
                source={{ uri: 'https://cdn.bwlok.dev/snowflake.png' }} 
                style={{ width: '100%', height: '100%' }} 
                resizeMode="contain" 
            />
        </Animated.View>
    );
};

const SnowOverlay = () => {
    // We use a light interval just to sync the visibility with the storage
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);

    React.useEffect(() => {
        const interval = setInterval(() => forceUpdate(), 500);
        return () => clearInterval(interval);
    }, []);

    const currentViewedChannel = SelectedChannelStore?.getChannelId();
    if (!storage.SnowEnabled || currentViewedChannel !== activeChannelId) return null;

    return (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
            {PARTICLE_POOL.map((p, i) => <Particle key={i} data={p} />)}
        </View>
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

                    if (snowTimer) clearTimeout(snowTimer);
                    snowTimer = setTimeout(() => { 
                        storage.SnowEnabled = false; 
                        activeChannelId = null;
                        snowTimer = null;
                    }, 3000); // Extended slightly for the longer staggered fall
                }
            }));
        }

        if (GeneralModule?.View) {
            patches.push(after("render", GeneralModule.View, (args, res) => {
                if (!res?.props) return res;
                const style = StyleSheet.flatten(res.props.style);
                if (style?.flex !== 1 || !res.props.onLayout) return res;

                const children = React.Children.toArray(res.props.children);
                if (children.some(c => c?.key === "snow-smooth-layer")) return res;

                res.props.children = [
                    ...children,
                    React.createElement(SnowOverlay, { key: "snow-smooth-layer" })
                ];
                return res;
            }));
        }
    },
    onUnload: () => {
        patches.forEach(p => p?.());
        if (snowTimer) clearTimeout(snowTimer);
        storage.SnowEnabled = false;
        activeChannelId = null;
    },
    settings: Settings
};
