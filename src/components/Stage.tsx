import { useEffect, useState, type ReactNode } from "react";

const STAGE_W = 1920;
const STAGE_H = 1080;

function fitScale() {
  return Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
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
        className="cork absolute top-1/2 left-1/2 overflow-hidden shadow-[0_0_140px_50px_rgba(50,25,5,0.6)]"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
