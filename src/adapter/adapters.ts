import { MP1 } from "./MP1";
import { MP2 } from "./MP2";
import { MP3 } from "./MP3";
import { romhandler } from "../romhandler";

export function getROMAdapter() {
  let game = romhandler.getGameVersion();
  if (!game) return null;

  return getAdapter(game);
}

export function getAdapter(game: number) {
  switch (game) {
    case 1:
      return MP1;
    case 2:
      return MP2;
    case 3:
      return MP3;
  }

  return null;
}
