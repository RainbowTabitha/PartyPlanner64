import { HTMLCanvasElement, Image } from "canvas-api-lite";

export function createCanvasNode(
  width: number,
  height: number
): HTMLCanvasElement {
  return new HTMLCanvasElement(width, height);
}

export function createImageNode(): Image {
  return new Image();
}
