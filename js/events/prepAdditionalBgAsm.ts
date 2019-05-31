import { scopeLabelsStaticByDefault } from "./prepAsm";

/** Surrounds the additional bg code with the necessary bg symbols. */
export function prepAdditionalBgAsm(asm: string, defaultBgIndex: number, additionalBgIndices?: number[]): string {
  return scopeLabelsStaticByDefault(`
    .beginfile ; Scopes static labels
    __PP64_INTERNAL_ADDITIONAL_BG_CHOICE:
    ${makeBgSymbols(defaultBgIndex, additionalBgIndices).join("\n")}
    ${asm}
    .align 4
    .endfile
  `, true);
}

function makeBgSymbols(defaultBgIndex: number, additionalBgIndices?: number[]): string[] {
  const syms = [
    `.definelabel DEFAULT_BG,${defaultBgIndex}`
  ];

  if (additionalBgIndices) {
    additionalBgIndices.forEach((bgIndex, i) => {
      syms.push(`.definelabel ADDITIONAL_BG_${i + 1},${bgIndex}`);
    });
  }

  return syms;
}