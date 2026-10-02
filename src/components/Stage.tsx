import { type ReactNode, useEffect, useState } from "react";

export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

function fitScale() {
  return Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
}

export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(fitScale);

  useEffect(() => {
    const onResize = () => setScale(fitScale());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="cork-edge fixed inset-0 overflow-hidden">
      <div
        className="cork font-hand absolute top-1/2 left-1/2 overflow-hidden"
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
