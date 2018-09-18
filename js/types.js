"use strict";
// Defines commonly used types.
var PP64;
(function (PP64) {
    var types;
    (function (types) {
        let View;
        (function (View) {
            View[View["EDITOR"] = 0] = "EDITOR";
            View[View["DETAILS"] = 1] = "DETAILS";
            View[View["SETTINGS"] = 2] = "SETTINGS";
            View[View["ABOUT"] = 3] = "ABOUT";
            View[View["MODELS"] = 4] = "MODELS";
            View[View["PATCHES"] = 5] = "PATCHES";
            View[View["STRINGS"] = 6] = "STRINGS";
            View[View["EVENTS"] = 7] = "EVENTS";
            View[View["CREATEEVENT"] = 8] = "CREATEEVENT";
        })(View = types.View || (types.View = {}));
        let Space;
        (function (Space) {
            Space[Space["OTHER"] = 0] = "OTHER";
            Space[Space["BLUE"] = 1] = "BLUE";
            Space[Space["RED"] = 2] = "RED";
            Space[Space["MINIGAME"] = 3] = "MINIGAME";
            Space[Space["HAPPENING"] = 4] = "HAPPENING";
            Space[Space["STAR"] = 5] = "STAR";
            Space[Space["CHANCE"] = 6] = "CHANCE";
            Space[Space["START"] = 7] = "START";
            Space[Space["SHROOM"] = 8] = "SHROOM";
            Space[Space["BOWSER"] = 9] = "BOWSER";
            Space[Space["ITEM"] = 10] = "ITEM";
            Space[Space["BATTLE"] = 11] = "BATTLE";
            Space[Space["BANK"] = 12] = "BANK";
            Space[Space["ARROW"] = 13] = "ARROW";
            Space[Space["BLACKSTAR"] = 14] = "BLACKSTAR";
            Space[Space["GAMEGUY"] = 15] = "GAMEGUY";
            Space[Space["DUEL_BASIC"] = 16] = "DUEL_BASIC";
            Space[Space["DUEL_START_BLUE"] = 17] = "DUEL_START_BLUE";
            Space[Space["DUEL_START_RED"] = 18] = "DUEL_START_RED";
            Space[Space["DUEL_POWERUP"] = 19] = "DUEL_POWERUP";
            Space[Space["DUEL_REVERSE"] = 20] = "DUEL_REVERSE";
        })(Space = types.Space || (types.Space = {}));
        let SpaceSubtype;
        (function (SpaceSubtype) {
            SpaceSubtype[SpaceSubtype["TOAD"] = 0] = "TOAD";
            SpaceSubtype[SpaceSubtype["BOWSER"] = 1] = "BOWSER";
            SpaceSubtype[SpaceSubtype["KOOPA"] = 2] = "KOOPA";
            SpaceSubtype[SpaceSubtype["BOO"] = 3] = "BOO";
            SpaceSubtype[SpaceSubtype["GOOMBA"] = 4] = "GOOMBA";
            SpaceSubtype[SpaceSubtype["BANK"] = 5] = "BANK";
            SpaceSubtype[SpaceSubtype["BANKCOIN"] = 6] = "BANKCOIN";
            SpaceSubtype[SpaceSubtype["ITEMSHOP"] = 7] = "ITEMSHOP";
            SpaceSubtype[SpaceSubtype["GATE"] = 8] = "GATE";
        })(SpaceSubtype = types.SpaceSubtype || (types.SpaceSubtype = {}));
        let BoardType;
        (function (BoardType) {
            BoardType["NORMAL"] = "NORMAL";
            BoardType["DUEL"] = "DUEL";
        })(BoardType = types.BoardType || (types.BoardType = {}));
        let Action;
        (function (Action) {
            Action[Action["MOVE"] = 0] = "MOVE";
            Action[Action["LINE"] = 1] = "LINE";
            Action[Action["LINE_STICKY"] = 2] = "LINE_STICKY";
            Action[Action["ROTATE"] = 3] = "ROTATE";
            Action[Action["ERASE"] = 4] = "ERASE";
            Action[Action["ROM_LOAD"] = 5] = "ROM_LOAD";
            Action[Action["ROM_UNLOAD"] = 6] = "ROM_UNLOAD";
            Action[Action["BOARD_LOAD"] = 7] = "BOARD_LOAD";
            Action[Action["BOARD_SAVE"] = 8] = "BOARD_SAVE";
            Action[Action["BOARD_NEW"] = 9] = "BOARD_NEW";
            Action[Action["BOARD_WRITE"] = 10] = "BOARD_WRITE";
            Action[Action["BOARD_DETAILS"] = 11] = "BOARD_DETAILS";
            Action[Action["BOARD_EDITOR"] = 12] = "BOARD_EDITOR";
            Action[Action["BOARD_COPY"] = 13] = "BOARD_COPY";
            Action[Action["DUMP_LOAD"] = 13.1] = "DUMP_LOAD";
            Action[Action["DUMP_SAVE"] = 13.2] = "DUMP_SAVE";
            Action[Action["MODEL_VIEWER"] = 13.3] = "MODEL_VIEWER";
            Action[Action["STRINGS_EDITOR"] = 13.4] = "STRINGS_EDITOR";
            Action[Action["EVENTS"] = 13.5] = "EVENTS";
            Action[Action["CREATEEVENT"] = 13.6] = "CREATEEVENT";
            Action[Action["BACK_TO_EVENTS"] = 13.7] = "BACK_TO_EVENTS";
            Action[Action["SAVE_EVENT"] = 13.8] = "SAVE_EVENT";
            Action[Action["EVENT_LOAD"] = 13.9] = "EVENT_LOAD";
            Action[Action["SET_BG"] = 14] = "SET_BG";
            Action[Action["SCREENSHOT"] = 14.1] = "SCREENSHOT";
            Action[Action["ROM_SAVE"] = 15] = "ROM_SAVE";
            Action[Action["SETTINGS"] = 15.1] = "SETTINGS";
            Action[Action["ABOUT"] = 15.2] = "ABOUT";
            Action[Action["PATCHES"] = 15.3] = "PATCHES";
            Action[Action["ADD_OTHER"] = 16] = "ADD_OTHER";
            Action[Action["ADD_BLUE"] = 17] = "ADD_BLUE";
            Action[Action["ADD_RED"] = 18] = "ADD_RED";
            Action[Action["ADD_MINIGAME"] = 19] = "ADD_MINIGAME";
            Action[Action["ADD_HAPPENING"] = 20] = "ADD_HAPPENING";
            Action[Action["ADD_STAR"] = 21] = "ADD_STAR";
            Action[Action["ADD_BLACKSTAR"] = 21.2] = "ADD_BLACKSTAR";
            Action[Action["ADD_START"] = 21.3] = "ADD_START";
            Action[Action["ADD_CHANCE"] = 22] = "ADD_CHANCE";
            Action[Action["ADD_SHROOM"] = 23] = "ADD_SHROOM";
            Action[Action["ADD_BOWSER"] = 24] = "ADD_BOWSER";
            Action[Action["ADD_TOAD_CHARACTER"] = 25] = "ADD_TOAD_CHARACTER";
            Action[Action["ADD_BOWSER_CHARACTER"] = 26] = "ADD_BOWSER_CHARACTER";
            Action[Action["ADD_KOOPA_CHARACTER"] = 27] = "ADD_KOOPA_CHARACTER";
            Action[Action["ADD_BOO_CHARACTER"] = 28] = "ADD_BOO_CHARACTER";
            Action[Action["ADD_ITEM"] = 29] = "ADD_ITEM";
            Action[Action["ADD_BATTLE"] = 30] = "ADD_BATTLE";
            Action[Action["ADD_BANK"] = 31] = "ADD_BANK";
            Action[Action["ADD_GAMEGUY"] = 32] = "ADD_GAMEGUY";
            Action[Action["ADD_ARROW"] = 32.2] = "ADD_ARROW";
            Action[Action["MARK_STAR"] = 33] = "MARK_STAR";
            Action[Action["MARK_GATE"] = 33.1] = "MARK_GATE";
            Action[Action["ADD_BANK_SUBTYPE"] = 34] = "ADD_BANK_SUBTYPE";
            Action[Action["ADD_BANKCOIN_SUBTYPE"] = 35] = "ADD_BANKCOIN_SUBTYPE";
            Action[Action["ADD_ITEMSHOP_SUBTYPE"] = 36] = "ADD_ITEMSHOP_SUBTYPE";
            Action[Action["ADD_DUEL_BASIC"] = 37] = "ADD_DUEL_BASIC";
            Action[Action["ADD_DUEL_REVERSE"] = 38] = "ADD_DUEL_REVERSE";
            Action[Action["ADD_DUEL_POWERUP"] = 39] = "ADD_DUEL_POWERUP";
            Action[Action["ADD_DUEL_START_BLUE"] = 40] = "ADD_DUEL_START_BLUE";
            Action[Action["ADD_DUEL_START_RED"] = 41] = "ADD_DUEL_START_RED";
        })(Action = types.Action || (types.Action = {}));
        let Game;
        (function (Game) {
            Game["MP1_USA"] = "CLBE";
            Game["MP1_JPN"] = "CLBJ";
            Game["MP1_PAL"] = "NLBP";
            Game["MP2_USA"] = "NMWE";
            Game["MP2_JPN"] = "NMWJ";
            Game["MP2_PAL"] = "NMWP";
            Game["MP3_USA"] = "NMVE";
            Game["MP3_JPN"] = "NMVJ";
            Game["MP3_PAL"] = "NMVP";
        })(Game = types.Game || (types.Game = {}));
        function getGameName(id) {
            for (const [key, value] of Object.entries(PP64.types.Game)) {
                if (value === id)
                    return key;
            }
            return null;
        }
        types.getGameName = getGameName;
        let EventActivationType;
        (function (EventActivationType) {
            EventActivationType[EventActivationType["WALKOVER"] = 1] = "WALKOVER";
            //"MYSTERY" = 2,
            EventActivationType[EventActivationType["LANDON"] = 3] = "LANDON";
            //"PERTURN" = 7,
            EventActivationType[EventActivationType["BEGINORWALKOVER"] = 8] = "BEGINORWALKOVER";
        })(EventActivationType = types.EventActivationType || (types.EventActivationType = {}));
        let EventExecutionType;
        (function (EventExecutionType) {
            EventExecutionType[EventExecutionType["DIRECT"] = 1] = "DIRECT";
            EventExecutionType[EventExecutionType["PROCESS"] = 2] = "PROCESS";
        })(EventExecutionType = types.EventExecutionType || (types.EventExecutionType = {}));
        function getExecutionTypeName(executionType) {
            switch (executionType) {
                case 1:
                    return "Direct";
                case 2:
                    return "Process";
            }
            throw new Error(`Unknown execution type ${executionType}.`);
        }
        types.getExecutionTypeName = getExecutionTypeName;
        function getExecutionTypeByName(name) {
            switch (name) {
                case "Direct":
                    return 1;
                case "Process":
                    return 2;
            }
        }
        types.getExecutionTypeByName = getExecutionTypeByName;
        let ValidationLevel;
        (function (ValidationLevel) {
            ValidationLevel[ValidationLevel["ERROR"] = 1] = "ERROR";
            ValidationLevel[ValidationLevel["WARNING"] = 2] = "WARNING";
        })(ValidationLevel = types.ValidationLevel || (types.ValidationLevel = {}));
        types.EventParameterTypes = [
            "Boolean",
            "Number",
            "+Number",
            "Space",
        ];
    })(types = PP64.types || (PP64.types = {}));
})(PP64 || (PP64 = {}));
var $viewType = PP64.types.View;
var $actType = PP64.types.Action;
var $gameType = PP64.types.Game;
var $spaceType = PP64.types.Space;
var $spaceSubType = PP64.types.SpaceSubtype;
var $activationType = PP64.types.EventActivationType;
var $executionType = PP64.types.EventExecutionType;
var $validationLevel = PP64.types.ValidationLevel;
