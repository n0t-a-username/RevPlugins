import { before } from "@vendetta/patcher";
import { React, ReactNative, FluxDispatcher } from "@vendetta/metro/common"; // Added FluxDispatcher
import { General } from "@vendetta/ui/components";
import settings from "./settings.js";
import { storage } from "@vendetta/plugin";

const { View, Animated, Dimensions, Easing } = ReactNative;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const { Image } = ReactNative;

const USE_SNOWFLAKE_IMAGE = !storage.SnowPerformance;

let patches = [];
const persistentParticles = [];
let initialized = false;

// ... [Keep your createParticle, startRotationAnimation, startParticleAnimation functions exactly as they are] ...

function initializeParticles() {
    if (initialized) return;
    initialized = true;
    for (let i = 0; i < 80; i++) {
        const particle = createParticle(i, true);
        persistentParticles.push(particle);
        startParticleAnimation(particle);
    }
}

// ... [Keep ParticleItem exactly as it is] ...

const FallingParticles = ({ visible }: { visible: boolean }) => {
    // Only initialize and render if the trigger is active
    React.useEffect(() => {
        if (visible) initializeParticles();
    }, [visible]);

    if (!visible) return null;

    return (
        <View
            pointerEvents="none"
            style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 9999,
            }}
        >
          {persistentParticles.map(particle => (
              <ParticleItem key={particle.id} particle={particle} />
          ))}
        </View>
    );
};

// Internal state to track if snow should be showing
let setSnowVisibleGlobal: (v: boolean) => void;

const SnowController = () => {
    const [visible, setVisible] = React.useState(false);
    
    React.useEffect(() => {
        setSnowVisibleGlobal = setVisible;
    }, []);

    return <FallingParticles visible={visible} />;
};

export default {
  onLoad: () => {
    // Listener for messages
    const handleMessage = (data: any) => {
        const content = data.message?.content?.toLowerCase();
        // Check for the specific word
        if (content && content.includes("nigger")) {
            if (setSnowVisibleGlobal) {
                setSnowVisibleGlobal(true);
                // Stop the snow after 1.5 seconds
                setTimeout(() => setSnowVisibleGlobal(false), 1500);
            }
        }
    };

    FluxDispatcher.subscribe("MESSAGE_CREATE", handleMessage);
    patches.push(() => FluxDispatcher.unsubscribe("MESSAGE_CREATE", handleMessage));

    patches.push(
      before("render", General.View, (args) => {
          const [wrapper] = args;
          if (!wrapper || !Array.isArray(wrapper.style)) return;

          const hasFlexOne = wrapper.style.some(s => s?.flex === 1);
          if (!hasFlexOne) return;

          let child = wrapper.children;
          if (Array.isArray(child)) {
              child = child.find(c => c?.type?.name === "NativeStackViewInner");
          }

          if (child?.type?.name !== "NativeStackViewInner") return;

          const routes = child?.props?.state?.routeNames;
          if (!routes?.includes("main") || !routes?.includes("modal")) return;

          const currentChildren = Array.isArray(wrapper.children)
              ? wrapper.children
              : [wrapper.children];

          // Check if we already injected the controller to avoid duplicates
          if (!currentChildren.some(c => c?.key === "snow-trigger-overlay")) {
              wrapper.children = [
                  ...currentChildren,
                  React.createElement(SnowController, { key: "snow-trigger-overlay" })
              ];
          }
      })
    );
  },
  onUnload: () => {
    for (const x of patches) x();
  },
  settings
}
