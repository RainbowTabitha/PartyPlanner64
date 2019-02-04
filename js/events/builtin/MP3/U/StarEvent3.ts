import { IEvent, IEventParseInfo, IEventWriteInfo } from "../../../events";
import { hashEqual } from "../../../../utils/arrays";
import { ISpaceEvent } from "../../../../boards";

export const StarEvent3: Partial<IEvent> = {
  parse(dataView: DataView, info: IEventParseInfo) {
    let hashes = {
      CHILLY: "E9B6C28983AAE724AC187EA8E0CBC79D" // 0x8010A4B4 - 0x8010A860 (0x00320024 - 0x003203d0)
    };

    if (hashEqual([dataView.buffer, info.offset, 0x3BC], hashes.CHILLY)) {
      return true;
    }

    return false;
  },
  write(dataView: DataView, event: ISpaceEvent, info: IEventWriteInfo, temp: any) {
    // Just point to the event because we left it alone.
    return [0x00320024, 0];
  },
};
