import { createContext, createImage } from "../canvas";
import resizeImageData from "resize-image-data";

/**
 * Retrieves the ImageData for a source image, sized to particular dimensions.
 * @param src Image source
 * @param width Output data width
 * @param height Output data height
 */
export function getImageData(
  src: string,
  width: number,
  height: number,
): Promise<ImageData> {
  return new Promise<ImageData>((resolve, reject) => {
    const srcImage = createImage();
    const failTimer = setTimeout(() => reject(`Failed to write image!`), 45000);
    srcImage.onload = () => {
      const imgHeight = srcImage.height;
      const imgWidth = srcImage.width;

      // We need to write the image onto a canvas to get the RGBA32 values.
      const canvasCtx = createContext(imgWidth, imgHeight);
      canvasCtx.drawImage(srcImage, 0, 0, imgWidth, imgHeight);

      let imgData = canvasCtx.getImageData(0, 0, imgWidth, imgHeight);

      if (width !== imgWidth || height !== imgHeight) {
        imgData = resizeImageData(
          imgData,
          width,
          height,
        ) as unknown as ImageData;
      }

      clearTimeout(failTimer);
      resolve(imgData);
    };
    srcImage.src = src;
  });
}
