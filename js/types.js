// Defines commonly used types.

PP64.types = {
  View: {
    EDITOR: 0,
    DETAILS: 1,
    SETTINGS: 2,
    ABOUT: 3,
    MODELS: 4,
    PATCHES: 5,
    STRINGS: 6,
    EVENTS: 7,
    CREATEEVENT: 8,
  },

  Space: {
    OTHER: 0,
    BLUE: 1,
    RED: 2,
    MINIGAME: 3,
    HAPPENING: 4,
    STAR: 5,
    CHANCE: 6,
    START: 7,
    SHROOM: 8,
    BOWSER: 9,
    ITEM: 10,
    BATTLE: 11,
    BANK: 12,
    ARROW: 13,
    BLACKSTAR: 14,
    GAMEGUY: 15
  },

  isKnownSpaceType: function(type) {
    for (let typeName in $spaceType) {
      if ($spaceType[typeName] === type)
        return true;
    }
    return false;
  },

  SpaceSubtype: {
    TOAD: 0,
    BOWSER: 1,
    KOOPA: 2,
    BOO: 3,
    GOOMBA: 4,
    BANK: 5,
    BANKCOIN: 6,
    ITEMSHOP: 7,
    GATE: 8,
  },

  Action: {
    MOVE: 0,
    LINE: 1,
    LINE_STICKY: 2,
    ASSOCIATE: 3,
    DELETE: 4,
    ERASE: 4.1,
    ROM_LOAD: 5,
    ROM_UNLOAD: 6,
    BOARD_LOAD: 7,
    BOARD_SAVE: 8,
    BOARD_NEW: 9,
    BOARD_WRITE: 10,
    BOARD_DETAILS: 11,
    BOARD_EDITOR: 12,
    BOARD_COPY: 13,
    DUMP_LOAD: 13.1,
    DUMP_SAVE: 13.2,
    MODEL_VIEWER: 13.3,
    STRINGS_EDITOR: 13.4,
    EVENTS: 13.5,
    CREATEEVENT: 13.6,
    BACK_TO_EVENTS: 13.7,
    SAVE_EVENT: 13.8,
    EVENT_LOAD: 13.9,
    SET_BG: 14,
    SCREENSHOT: 14.1,
    ROM_SAVE: 15,
    SETTINGS: 15.1,
    ABOUT: 15.2,
    PATCHES: 15.3,

    ADD_OTHER: 16,
    ADD_BLUE: 17,
    ADD_RED: 18,
    ADD_MINIGAME: 19,
    ADD_HAPPENING: 20,
    ADD_STAR: 21,
    ADD_BLACKSTAR: 21.2,
    ADD_START: 21.3,
    ADD_CHANCE: 22,
    ADD_SHROOM: 23,
    ADD_BOWSER: 24,
    ADD_TOAD_CHARACTER: 25,
    ADD_BOWSER_CHARACTER: 26,
    ADD_KOOPA_CHARACTER: 27,
    ADD_BOO_CHARACTER: 28,
    ADD_ITEM: 29,
    ADD_BATTLE: 30,
    ADD_BANK: 31,
    ADD_GAMEGUY: 32,
    ADD_ARROW: 32.2,
    MARK_STAR: 33,
    MARK_GATE: 33.1,
    ADD_BANK_SUBTYPE: 34,
    ADD_BANKCOIN_SUBTYPE: 35,
    ADD_ITEMSHOP_SUBTYPE: 36,
  },

  Game: {
    MP1_USA: "CLBE",
    MP1_JPN: "CLBJ",
    MP1_PAL: "NLBP",

    MP2_USA: "NMWE",
    MP2_JPN: "NMWJ",
    MP2_PAL: "NMWP",

    MP3_USA: "NMVE",
    MP3_JPN: "NMVJ",
    MP3_PAL: "NMVP",
  },

  getGameName: function getGameName(id) {
    for (const [key, value] of Object.entries(PP64.types.Game)) {
      if (value === id)
        return key;
    }
    return null;
  },

  EventActivationType: {
    "WALKOVER": 1,
    //"MYSTERY": 2,
    "LANDON": 3,
    //"PERTURN": 7,
    "BEGINORWALKOVER": 8,
  },

  EventExecutionType: {
    "DIRECT": 1,
    "PROCESS": 2,
  },

  getExecutionTypeName: function getExecutionTypeName(executionType) {
    switch (executionType) {
      case 1:
        return "Direct";
      case 2:
        return "Process";
    }
    throw new Error(`Unknown execution type ${executionType}.`);
  },

  getExecutionTypeByName: function getExecutionTypeByName(name) {
    switch (name) {
      case "Direct":
        return 1;
      case "Process":
        return 2;
    }
  },

  ValidationLevel: {
    ERROR: 1,
    WARNING: 2,
  },
};

var $viewType = PP64.types.View;
var $actType = PP64.types.Action;
var $gameType = PP64.types.Game;
var $spaceType = PP64.types.Space;
var $spaceSubType = PP64.types.SpaceSubtype;
var $activationType = PP64.types.EventActivationType;
var $executionType = PP64.types.EventExecutionType;
var $validationLevel = PP64.types.ValidationLevel;