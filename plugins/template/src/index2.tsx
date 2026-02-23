import { after } from "@vendetta/patcher";
import { findByProps, findByTypeName } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";

let trigger = 0;
let unpatchMessage: any;
let unpatchRender: any;

function Confetti({ t }: { t: number }) {
  const [particles, setParticles] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!t) return;

    const p = Array.from({ length: 40 }).map(() => ({
      id: Math.random(),
      left: Math.random() * 100,
      size: 6 + Math.random() * 6,
    }));

    setParticles(p);

    const timeout = setTimeout(() => setParticles([]), 800);
    return () => clearTimeout(timeout);
  }, [t]);

  return React.createElement(
    React.Fragment,
    null,
    particles.map(x =>
      React.createElement("div", {
        key: x.id,
        style: {
          position: "absolute",
          top: 0,
          left: `${x.left}%`,
          width: x.size,
          height: x.size,
          backgroundColor: `hsl(${Math.random() * 360},100%,50%)`,
          borderRadius: 50,
          pointerEvents: "none",
          zIndex: 9999,
        },
      })
    )
  );
}

export function loadIndex2() {
  const MessageModule = findByProps("receiveMessage");
  const App = findByTypeName("App");

  unpatchMessage = after("receiveMessage", MessageModule, (_, args) => {
    const message = args?.[0];
    if (!message?.content) return;

    if (message.content.toLowerCase().includes("nice")) {
      trigger++;
    }
  });

  if (App?.prototype?.render) {
    unpatchRender = after("render", App.prototype, (_, res) => {
      if (!res?.props?.children) return res;

      const children = Array.isArray(res.props.children)
        ? res.props.children
        : [res.props.children];

      res.props.children = [
        ...children,
        React.createElement(Confetti, { key: "confetti", t: trigger }),
      ];

      return res;
    });
  }
}

export function unloadIndex2() {
  if (unpatchMessage) unpatchMessage();
  if (unpatchRender) unpatchRender();
}
