import { React, ReactNative } from "@vendetta/metro/common";

const { View, Animated, Dimensions } = ReactNative;
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
  animX: Animated.Value;
  animY: Animated.Value;
  opacity: Animated.Value;
  size: number;
  color: string;
}

function createBurst(): Particle[] {
  const particles: Particle[] = [];

  for (let i = 0; i < 40; i++) {
    particles.push({
      id: i,
      animX: new Animated.Value(SCREEN_WIDTH / 2),
      animY: new Animated.Value(SCREEN_HEIGHT / 2),
      opacity: new Animated.Value(1),
      size: 6 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    });
  }

  return particles;
}

export default function Confetti({ trigger }: { trigger: number }) {
  const [particles, setParticles] = React.useState<Particle[]>([]);

  React.useEffect(() => {
    if (!trigger) return;

    const burst = createBurst();
    setParticles(burst);

    burst.forEach(p => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 150 + Math.random() * 200;

      const toX = SCREEN_WIDTH / 2 + Math.cos(angle) * distance;
      const toY = SCREEN_HEIGHT / 2 + Math.sin(angle) * distance;

      Animated.parallel([
        Animated.timing(p.animX, {
          toValue: toX,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(p.animY, {
          toValue: toY,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true
        })
      ]).start();
    });

    const cleanup = setTimeout(() => {
      setParticles([]);
    }, 900);

    return () => clearTimeout(cleanup);
  }, [trigger]);

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
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: [
              { translateX: p.animX },
              { translateY: p.animY }
            ]
          }}
        />
      ))}
    </View>
  );
}
