import type { ReactNode } from "react";

type TapeProps = {
  children: ReactNode;
  rotate?: number;
  className?: string;
};

export function Tape({ children, rotate = 0, className = "" }: TapeProps) {
  return (
    <div
      className={`tape font-stamp text-ink whitespace-nowrap ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </div>
  );
}
