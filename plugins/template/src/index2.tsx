import { before } from "@vendetta/patcher";
import { React, ReactNative } from "@vendetta/metro/common";
import { General } from "@vendetta/ui/components";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";

const { View, Animated, Dimensions, Easing } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const { receiveMessage } = findByProps("receiveMessage");

let patches: any[] = [];
let particles: any[] = [];
let triggerBurst: (() => void) | null = null;

function createParticle(id: number) {
    const x = Math.random() * SCREEN_WIDTH;
    const y = new Animated.Value(-20);
    const opacity = new Animated.Value(1);

    const size = 6 + Math.random() * 8;
    const duration = 1500 + Math.random() * 1000;

    return { id, x, y, opacity, size, duration };
}

function animateParticle(particle: any) {
    Animated.parallel([
        Animated.timing(particle.y, {
            toValue: SCREEN_HEIGHT + 40,
            duration: particle.duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
        }),
        Animated.timing(particle.opacity, {
            toValue: 0,
            duration: particle.duration,
            useNativeDriver: true
        })
    ]).start();
}

const ConfettiOverlay = () => {
    const [, forceUpdate] = React.useState(0);

    React.useEffect(() => {
        triggerBurst = () => {
            particles = [];

            for (let i = 0; i < 40; i++) {
                const p = createParticle(i);
                particles.push(p);
                animateParticle(p);
            }

            forceUpdate(x => x + 1);

            setTimeout(() => {
                particles = [];
                forceUpdate(x => x + 1);
            }, 2500);
        };
    }, []);

    return (
        <View
            pointerEvents="none"
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999
            }}
        >
            {particles.map(p => (
                <Animated.View
                    key={p.id}
                    style={{
                        position: "absolute",
                        left: p.x,
                        width: p.size,
                        height: p.size,
                        backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                        transform: [{ translateY: p.y }],
                        opacity: p.opacity
                    }}
                />
            ))}
        </View>
    );
};

export function loadConfetti() {
    patches.push(
        before("render", General.View, (args) => {
            const [wrapper] = args;
            if (!wrapper || !Array.isArray(wrapper.style)) return;

            const hasFlexOne = wrapper.style.some(s => s?.flex === 1);
            if (!hasFlexOne) return;

            const currentChildren = Array.isArray(wrapper.children)
                ? wrapper.children
                : [wrapper.children];

            wrapper.children = [
                ...currentChildren,
                React.createElement(ConfettiOverlay, { key: "confetti-overlay" })
            ];
        })
    );

    patches.push(
        before("receiveMessage", receiveMessage, (args) => {
            if (!storage.confettiEnabled) return;

            const msg = args[0];
            if (!msg?.content) return;

            if (msg.content.toLowerCase().includes("nice")) {
                triggerBurst?.();
            }
        })
    );
}

export function unloadConfetti() {
    for (const unpatch of patches) unpatch();
    patches = [];
}
