type StampProps = {
  text: string;
  rotate?: number;
  size?: number;
  className?: string;
};

export function Stamp({ text, rotate = -3, size = 26, className = "" }: StampProps) {
  return (
    <div
      className={`font-stamp text-string border-string whitespace-nowrap rounded-sm border-4 px-3.5 py-1.5 tracking-[2px] ${className}`}
      style={{ fontSize: size, transform: `rotate(${rotate}deg)` }}
    >
      {text}
    </div>
  );
}
