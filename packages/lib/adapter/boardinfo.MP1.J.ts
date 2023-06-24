import { createBoardInfo } from "./boardinfobase";

// DK's Jungle Adventure - (J) ROM
const MP1_JPN_DK = createBoardInfo("MP1_JPN_DK");
MP1_JPN_DK.name = "DK's Jungle Adventure";
MP1_JPN_DK.boardDefFile = 69;
MP1_JPN_DK.bgDir = 0;
MP1_JPN_DK.str = {
  boardSelect: 652,
  koopaIntro: 571,
  starComments: [286, 287, 288, 289, 290, 291, 292],
};
MP1_JPN_DK.img = {
  boardSelectImg: 17,
  pauseLogoImg: 276,
  introLogoImg: [356, 357],
  titleScreenImg: 385,
};
MP1_JPN_DK.eventASMStart = 0x00;
MP1_JPN_DK.eventASMEnd = 0x00;
// MP1_JPN_DK.spaceEventsStartAddr = 0x000F951C;
// MP1_JPN_DK.spaceEventsStartOffset = 0x002448BC;
// MP1_JPN_DK.spaceEventsEndOffset = 0x00244A20;

export function getBoardInfos() {
  return [
    MP1_JPN_DK,
    // MP1_J_PEACH,
    // MP1_J_YOSHI,
    // MP1_J_WARIO,
    // MP1_J_LUIGI,
    // MP1_J_MARIO,
    // MP1_J_BOWSER,
    // MP1_J_ETERNALSTAR,
    // MP1_J_TRAINING,
    // MP1_J_ISLAND,
    // MP1_J_STADIUM,
  ];
}
