import {
  BoardAudioType,
  IBoard,
  IEventInstance,
  ISpace,
} from "../../apps/partyplanner64/boards";
import { ICustomEvent } from "./events/customevents";
import { EventMap, getEvent, IEventParameter } from "./events/events";
import { BoardType, CostumeType, EventCodeLanguage } from "./types";
import { assert } from "./utils/debug";

/**
 * Applies "fixes" to a board which may be from an older editor version.
 * @param board Board from an arbitrary PP64 version.
 * @returns Given board.
 */
export function fixPotentiallyOldBoard(board: IBoard): IBoard {
  if (!("game" in (board as Partial<IBoard>))) {
    board.game = 1;
  }

  if (!("type" in (board as Partial<IBoard>))) {
    board.type = BoardType.NORMAL;
  }

  if (!("events" in (board as Partial<IBoard>))) {
    board.events = {};
  }

  for (const eventId in board.events) {
    const eventData = board.events[eventId];
    if (typeof eventData === "string") {
      board.events[eventId] = {
        code: eventData,
        language: EventCodeLanguage.MIPS,
      };
    }
  }

  if (typeof board.audioType === "undefined") {
    board.audioType = BoardAudioType.InGame;
  }

  if (board.audioData && !Array.isArray(board.audioData)) {
    board.audioData = [(board as any).audioData];
  }

  if (board.game === 2 && typeof board.costumeTypeIndex !== "number") {
    board.costumeTypeIndex = CostumeType.NORMAL;
  }

  _migrateOldCustomEvents(board);

  if (!("fov" in board.bg)) {
    switch (board.game) {
      case 3:
        if (board.type === BoardType.DUEL) {
          Object.assign(board.bg, {
            fov: 15,
            scaleFactor: 0.1,
            cameraEyePosX: 0,
            cameraEyePosY: 210,
            cameraEyePosZ: 210,
            lookatPointX: 0,
            lookatPointY: 0,
            lookatPointZ: 0,
          });
        } else {
          Object.assign(board.bg, {
            fov: 15,
            scaleFactor: 0.1,
            cameraEyePosX: 0,
            cameraEyePosY: 300,
            cameraEyePosZ: 300,
            lookatPointX: 0,
            lookatPointY: 0,
            lookatPointZ: 0,
          });
        }
        break;
      case 2:
        Object.assign(board.bg, {
          fov: 3,
          scaleFactor: 0.1,
          cameraEyePosX: 0,
          cameraEyePosY: 1570,
          cameraEyePosZ: 1577,
          lookatPointX: 0,
          lookatPointY: 0,
          lookatPointZ: 0,
        });
        break;
      case 1:
        Object.assign(board.bg, {
          fov: 17,
          scaleFactor: 1,
          cameraEyePosX: 0,
          cameraEyePosY: 1355,
          cameraEyePosZ: 1780,
          lookatPointX: 0,
          lookatPointY: 0,
          lookatPointZ: 0,
        });
        break;
    }
  }

  return board;
}

function _migrateOldCustomEvents(board: IBoard) {
  forEachEvent(board, (spaceEvent: IEventInstance) => {
    // Unnecessary properties of space events.
    if ("parameters" in spaceEvent) {
      delete (spaceEvent as any).parameters;
    }
    if ("supportedGames" in spaceEvent) {
      delete (spaceEvent as any).supportedGames;
    }

    // Move any asm into the single collection.
    if ((spaceEvent as ICustomEvent).asm) {
      spaceEvent.id = (spaceEvent as any).name;
      if (
        board.events[spaceEvent.id] &&
        board.events[spaceEvent.id] !== (spaceEvent as ICustomEvent).asm
      ) {
        console.warn(
          `When updating the format of ${board.name}, event ${spaceEvent.id} had multiple versions. Only one will be kept.`
        );
      }
      board.events[spaceEvent.id] = (spaceEvent as ICustomEvent).asm;
      delete (spaceEvent as any).asm;
    }
  });
}

interface ForEachEventCallback {
  (
    event: IEventInstance,
    eventIndex: number,
    space?: ISpace,
    spaceIndex?: number
  ): void;
}

export function forEachEvent(board: IBoard, fn: ForEachEventCallback) {
  if (board.boardevents) {
    // Reverse to allow deletion in callback.
    for (let i = board.boardevents.length - 1; i >= 0; i--) {
      const event = board.boardevents[i];
      fn(event, i);
    }
  }

  const spaces = board.spaces;
  if (spaces && spaces.length) {
    for (let s = 0; s < spaces.length; s++) {
      const space = spaces[s];
      if (space.events && space.events.length) {
        for (let i = space.events.length - 1; i >= 0; i--) {
          const event = space.events[i];
          fn(event, i, space, s);
        }
      }
    }
  }
}

interface ForEachEventParameterCallback {
  (
    param: IEventParameter,
    event: IEventInstance,
    eventIndex: number,
    space?: ISpace,
    spaceIndex?: number
  ): void;
}

export function forEachEventParameter(
  board: IBoard,
  eventLibrary: EventMap,
  fn: ForEachEventParameterCallback
) {
  forEachEvent(board, (eventInstance, eventIndex, space, spaceIndex) => {
    const event = getEvent(eventInstance.id, board, eventLibrary);
    assert(!!event);
    if (event.parameters) {
      for (let p = 0; p < event.parameters.length; p++) {
        const parameter = event.parameters[p];
        fn(parameter, eventInstance, eventIndex, space, spaceIndex);
      }
    }
  });
}
