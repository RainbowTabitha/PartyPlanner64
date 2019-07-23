export function createContext(width: number, height: number): CanvasRenderingContext2D {
  let canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas.getContext("2d")!;
}
