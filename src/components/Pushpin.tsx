import type { CSSProperties } from "react";

type PushpinProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export function Pushpin({ size = 22, className = "", style }: PushpinProps) {
  return (
    <span
      className={`pin absolute ${className}`}
      style={{ width: size, height: size, ...style }}
    />
  );
}
