function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sampleY = (u: number) => ((ay * u + by) * u + cy) * u;
  const slopeX = (u: number) => (3 * ax * u + 2 * bx) * u + cx;

  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let u = t;
    for (let i = 0; i < 8; i++) {
      const error = sampleX(u) - t;
      if (Math.abs(error) < 1e-5) break;
      const slope = slopeX(u);
      if (Math.abs(slope) < 1e-6) break;
      u -= error / slope;
    }
    return sampleY(u);
  };
}

export const ease = {
  fall: cubicBezier(0.55, 0, 1, 0.45),
  spring: cubicBezier(0.34, 1.56, 0.64, 1),
  out: cubicBezier(0.16, 1, 0.3, 1),
  inout: cubicBezier(0.65, 0, 0.35, 1),
};
