interface CreateCanvas {
  (width: number, height: number): HTMLCanvasElement;
}

function defaultCreateCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

let _createCanvas: CreateCanvas = defaultCreateCanvas;

export function setCreateCanvas(createCanvasImpl: CreateCanvas): void {
  _createCanvas = createCanvasImpl;
}

export function createContext(
  width: number,
  height: number
): CanvasRenderingContext2D {
  const canvas = _createCanvas(width, height);
  return canvas.getContext("2d")!;
}

interface CreateImage {
  (): HTMLImageElement;
}

function defaultCreateImage(): HTMLImageElement {
  // eslint-disable-next-line no-restricted-globals
  return new Image();
}

let _createImage: CreateImage = defaultCreateImage;

export function setCreateImage(createImageImpl: CreateImage): void {
  _createImage = createImageImpl;
}

export function createImage(): HTMLImageElement {
  return _createImage();
}

export function getMouseCoordsOnCanvas(
  canvas: HTMLElement,
  clientX: number,
  clientY: number
): [number, number] {
  const canvasRect = canvas.getBoundingClientRect();
  clientX = Math.round(clientX);
  clientY = Math.round(clientY);
  return [
    clientX - Math.round(canvasRect.left),
    clientY - Math.round(canvasRect.top),
  ];
}
