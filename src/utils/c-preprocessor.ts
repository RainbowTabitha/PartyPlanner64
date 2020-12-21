import * as cpp from "../lib/cppjs/cppjs";
import { ultra64h } from "../events/includes/ultra64h";

/** Preprocess a given file. */
export async function preprocess(contents: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const preprocessor = cpp.create({
      include_func: (file, is_global, resumer) => {
        if (file.toLowerCase() === "ultra64.h") {
          resumer(ultra64h);
          return;
        }

        // TODO: Handle other file includes.
        return null;
      },

      completion_func(preprocessedText) {
        resolve(preprocessedText);
      },

      warn_func(message: string) {
        console.warn(message);
      },

      error_func(message: string) {
        console.error(message);
        reject(message);
      },
    });

    preprocessor.run(contents);
  });
}
