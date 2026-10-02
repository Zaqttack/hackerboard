import type { Ref } from "react";

export function StringLayer({ ref }: { ref: Ref<SVGSVGElement> }) {
  return (
    <svg
      ref={ref}
      className="pointer-events-none absolute inset-0 z-10"
      width="1920"
      height="1080"
      viewBox="0 0 1920 1080"
      aria-hidden="true"
    />
  );
}
