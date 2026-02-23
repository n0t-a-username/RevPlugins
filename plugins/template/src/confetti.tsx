import { React, ReactNative } from "@vendetta/metro/common";

const { View, Animated, Dimensions, Easing } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const COLORS = [
  "#FF3B30", // red
  "#007AFF", // blue
  "#AF52DE", // purple
  "#34C759", // green
  "#FFD700"  // gold
];

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  translateX: Animated.Value;
  translateY: Animated.Value;
  opacity: Animated.Value;
}

export function createBurst(count = 40): Particle[] {
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 3;

  return Array.from({ length: count }).map((_, i) => {
    const angle = Math.random() * 2 * Math.PI;
    const distance = 150 + Math.random() * 100;

    return {
      id: i,
      x: centerX,
      y: centerY,
      size: 6 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(1),
    };
  });
}

const ConfettiItem = ({ particle }: { particle: Particle }) => (
  <Animated.View
    style={{
      position: "absolute",
      left: particle.x,
      top: particle.y,
      width: particle.size,
      height: particle.size,
      borderRadius: particle.size / 2,
      backgroundColor: particle.color,
      opacity: particle.opacity,
      transform: [
        { translateX: particle.translateX },
        { translateY: particle.translateY },
      ],
    }}
  />
);

export const ConfettiBurst = ({ onFinish }: { onFinish: () => void }) => {
  const particles = React.useMemo(() => createBurst(), []);

  React.useEffect(() => {
    const animations = particles.map((p) => {
      const angle = Math.random() * 2 * Math.PI;
      const distance = 150 + Math.random() * 100;

      return Animated.parallel([
        Animated.timing(p.translateX, {
          toValue: Math.cos(angle) * distance,
          duration: 700,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(p.translateY, {
          toValue: Math.sin(angle) * distance,
          duration: 700,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      onFinish();
    });
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
        zIndex: 9999,
      }}
    >
      {particles.map((p) => (
        <ConfettiItem key={p.id} particle={p} />
      ))}
    </View>
  );
};