import { join } from "../../utils/arrays";

export let currentCheats: ArrayBuffer[] = [];

export function resetCheats() {
  currentCheats = [];
}

export function getCheatBuffer() {
  return currentCheats.reduce(join);
}
