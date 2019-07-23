import { $$log } from "../../utils/debug";
import { MP1UHook } from "./hook.MP1.U";
import { MP2UHook } from "./hook.MP2.U";
import { MP3UHook } from "./hook.MP3.U";
import { Game } from "../../types";
import { romhandler } from "../../romhandler";
import { currentCheats } from "../../views/gameshark";

export function applyHook(romBuffer: ArrayBuffer) {
  const cheatCount = currentCheats.length;
  if (!cheatCount) {
    // This would leave existing cheats if they were already present; doesn't clear them.
    return;
  }

  let gameID = romhandler.getROMGame();
  switch(gameID) {
    case Game.MP1_USA:
      MP1UHook.apply(romBuffer);
      break;

    case Game.MP2_USA:
      MP2UHook.apply(romBuffer);
      break;

    case Game.MP3_USA:
      MP3UHook.apply(romBuffer);
      break;

    case Game.MP1_JPN:
    default:
      console.warn("Cannot write cheats for this game");
      return;
  }

  $$log(`Applied ${cheatCount} Gameshark cheats`);
}

export function romSupportsCheats() {
  let gameID = romhandler.getROMGame();
  switch(gameID) {
    case Game.MP1_USA:
    case Game.MP2_USA:
    case Game.MP3_USA:
      return true;

    case Game.MP1_JPN:
    default:
      return false;
  }
}
