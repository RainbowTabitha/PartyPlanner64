export function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}

export function midpoint(x1: number, y1: number, x2: number, y2: number) {
  return {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2,
  };
}

// Distance from tx,ty to the line made from x1,y1 --- x2,y2
export function lineDistance(
  tx: number,
  ty: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  return (
    Math.abs((y2 - y1) * tx - (x2 - x1) * ty + x2 * y1 - y2 * x1) /
    Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2))
  );
}

/**
 * Tests if (x,y) falls within the square formed from (x_s,y_s) - (x_f,y_f)
 * Being exactly at (x_s,y_s) or (x_f,y_f) is considered in.
 */
export function pointFallsWithin(
  x: number,
  y: number,
  xs: number,
  ys: number,
  xf: number,
  yf: number
) {
  const [minX, maxX] = [Math.min(xs, xf), Math.max(xs, xf)];
  const [minY, maxY] = [Math.min(ys, yf), Math.max(ys, yf)];
  return x >= minX && x <= maxX && y >= minY && y <= maxY;
}

export function makeDivisibleBy(num: number, by: number) {
  return by * Math.ceil(num / by);
}

export function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}

/**
 * Determines the angle made by two points.
 * @returns Radians counter-clockwise from the +x axis.
 */
export function determineAngle(
  xOrigin: number,
  yOrigin: number,
  x: number,
  y: number
) {
  const deltaX = x - xOrigin;
  const deltaY = y - yOrigin;
  const angleRadians = Math.atan2(deltaY, deltaX);
  if (angleRadians < 0) {
    return Math.abs(angleRadians);
  }
  return Math.abs(angleRadians - Math.PI) + Math.PI;
}

/**
 * Gets the IEEE-754 float formatted version of a number.
 * For example, 1.0 yields 0x3f800000
 */
export function getRawFloat32Format(num: number) {
  const buffer = new ArrayBuffer(4);
  const dataView = new DataView(buffer);
  dataView.setFloat32(0, num);
  return dataView.getUint32(0);
}
