import { MP1Adapter } from "./MP1";
import { MP2Adapter } from "./MP2";
import { MP3Adapter } from "./MP3";
import { romhandler } from "../romhandler";
import { IAdapterOptions } from "./AdapterBase";

export function getROMAdapter(adapterOptions: IAdapterOptions) {
  const game = romhandler.getGameVersion();
  if (!game) return null;

  return getAdapter(game, adapterOptions);
}

export function getAdapter(game: number, adapterOptions: IAdapterOptions) {
  switch (game) {
    case 1:
      return new MP1Adapter(adapterOptions);
    case 2:
      return new MP2Adapter(adapterOptions);
    case 3:
      return new MP3Adapter(adapterOptions);
  }

  return null;
}
