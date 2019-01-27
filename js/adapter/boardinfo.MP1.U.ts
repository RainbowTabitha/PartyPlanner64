import { createBoardInfo } from "./boardinfobase";
import { IBoard, addEventToSpace } from "../boards";
import { create as createEvent } from "../events/events";
import { hvqfs } from "../fs/hvqfs";
import { strings } from "../fs/strings";
import { arrayToArrayBuffer } from "../utils/arrays";
import { scenes } from "../fs/scenes";

// DK's Jungle Adventure - (U) ROM
const MP1_USA_DK = createBoardInfo("MP1_USA_DK");
MP1_USA_DK.name = "DK's Jungle Adventure";
MP1_USA_DK.boardDefFile = 69;
MP1_USA_DK.bgDir = 0;
MP1_USA_DK.str = {
  boardSelect: 652,
  koopaIntro: 571,
  starComments: [286, 287, 288, 289, 290, 291, 292],
};
MP1_USA_DK.img = {
  boardSelectImg: 17,

  //gamemasterplc: overwrite ROM offset 0x25FA08 with 0x006B0226 to hide the comic sans board logo far off the bottom of the screen
  pauseLogoImg: 276,
  introLogoImg: [356, 357],
  introLogoImgDimens: [272, 112],
  titleScreenImg: 385,
};

// scene 0x36 code 0x2418A0, 0x244B50
// dump.printAsm(0x2418A0, 0x244B50)
MP1_USA_DK.sceneIndex = 0x36; // 54
MP1_USA_DK.mainfsEventFile = [10, 422];
MP1_USA_DK.mainfsBoardFile = [10, 423];
// MP1_USA_DK.spaceEventTables = [
//   { upper: 0xBD0, lower: 0xBD8 }, // 0x800F71B0, 0x800F71B8
//   { upper: 0xBEC, lower: 0xBF4 }, // 0x800F71CC, 0x800F71D4
//   { upper: 0xC08, lower: 0xC10 }, // 0x800F71E8, 0x800F71F0
//   { upper: 0xC24, lower: 0xC2C }, // 0x800F7204, 0x800F720C
//   // tables: 0x800FA0CC
// ];
MP1_USA_DK.koopaSpaceInst = 0xD54; // 0x002425F4, 0x800F7330
MP1_USA_DK.bowserSpaceInst = 0xCB8; // 0x00242558;
MP1_USA_DK.boosLoopFnOffset = 0x11D8; // 0x00242A78;
MP1_USA_DK.boosReadbackFnOffset = 0x10D0; // 0x00242970;
MP1_USA_DK.starSpaceArrOffset = 0x3320; // 0x00244BC0
MP1_USA_DK.starSpaceCount = 7;
MP1_USA_DK.toadSpaceArrOffset = [0x3330, 0x3348]; // [0x00244BD0, 0x00244BE8];
MP1_USA_DK.audioIndexOffset = 0xBBE; // 0x0024245E
MP1_USA_DK.onLoad = function(board: IBoard) {
  board.otherbg.largescene = hvqfs.readBackground(MP1_USA_DK.bgDir + 1).src;
  board.otherbg.conversation = hvqfs.readBackground(MP1_USA_DK.bgDir + 2).src;
  board.otherbg.splashscreen = hvqfs.readBackground(MP1_USA_DK.bgDir + 6).src;
};
MP1_USA_DK.onWriteEvents = function(board: IBoard) {
  // Right now this board is always going to put Chance time spaces where Stars were,
  // so we will just automate adding the post-star chance event.
  let spaces = board.spaces;
  for (let i = 0; i < spaces.length; i++) {
    let space = board.spaces[i];
    if (!space || !space.star)
      continue;
    let events = space.events || [];
    let hasStarChance = events.some(e => e.id === "STARCHANCE"); // Pretty unlikely
    if (!hasStarChance)
      addEventToSpace(space, createEvent("STARCHANCE"));
  }
};
MP1_USA_DK.onAfterOverwrite = function() {
  // Remove the "box" from the game start scenery.
  const introSceneView = scenes.getDataView(98);
  introSceneView.setUint32(0x7098, 0xC57A0000); // 0x2A9598 // Some random float to get it away
  introSceneView.setUint32(0x709C, 0); // 0x2A959C
  introSceneView.setUint32(0x70A0, 0); // 0x2A95A0

  // Make Bowser's event text a bit more generic.
  let bytes: number[] = [];
  bytes = bytes.concat(strings._strToBytes("You're looking for Stars?\nHow about this instead..."));
  bytes.push(0xFF); // PAUSE
  bytes.push(0x00); // Null byte
  let strBuffer = arrayToArrayBuffer(bytes);
  strings.write(396, strBuffer);
  strings.write(399, strBuffer);
  strings.write(402, strBuffer);
};

// Peach's Birthday Cake - (U) ROM
const MP1_USA_PEACH = createBoardInfo("MP1_USA_PEACH");
MP1_USA_PEACH.name = "Peach's Birthday Cake";
MP1_USA_PEACH.boardDefFile = 70;
MP1_USA_PEACH.bgDir = 7;
MP1_USA_PEACH.str = {
  boardSelect: 653,
  koopaIntro: 572,
};
MP1_USA_PEACH.img = {
  boardSelectImg: 20,
  pauseLogoImg: 277,
  introLogoImg: [359],
  titleScreenImg: 382,
};
MP1_USA_PEACH.sceneIndex = 0x37; // 55
MP1_USA_PEACH.mainfsEventFile = [10, 424];
MP1_USA_PEACH.mainfsBoardFile = [10, 425];
MP1_USA_PEACH.eventASMStart = 0x00;
// MP1_USA_PEACH.spaceEventsStartAddr = 0x000F7C70;
// MP1_USA_PEACH.spaceEventsStartOffset = 0x00246C50;
// MP1_USA_PEACH.spaceEventsEndOffset = 0x00246D10;
MP1_USA_PEACH.koopaSpaceInst = 0x7C0; // 0x00245D80;
MP1_USA_PEACH.bowserSpaceInst = 0x988; // // 0x00245F48
MP1_USA_PEACH.goombaSpaceInst = 0x900; // 0x00245EC0;

// Yoshi's Tropical Island - (U) ROM
const MP1_USA_YOSHI = createBoardInfo("MP1_USA_YOSHI");
MP1_USA_YOSHI.name = "Yoshi's Tropical Island";
MP1_USA_YOSHI.boardDefFile = 71;
MP1_USA_YOSHI.bgDir = 18;
MP1_USA_YOSHI.str = {
  boardSelect: 654,
  koopaIntro: 573,
};
MP1_USA_YOSHI.img = {
  boardSelectImg: 18,
  pauseLogoImg: 278,
  introLogoImg: [362],
  titleScreenImg: 383,
};
MP1_USA_YOSHI.sceneIndex = 0x38; // 56
MP1_USA_YOSHI.eventASMStart = 0x00;
// MP1_USA_YOSHI.spaceEventsStartAddr = 0x000F861C;
// MP1_USA_YOSHI.spaceEventsStartOffset = 0x00248E2C;
// MP1_USA_YOSHI.spaceEventsEndOffset = 0x00248EE4;

// Wario's Battle Canyon = (U) ROM
const MP1_USA_WARIO = createBoardInfo("MP1_USA_WARIO");
MP1_USA_WARIO.name = "Wario's Battle Canyon";
MP1_USA_WARIO.boardDefFile = 72;
MP1_USA_WARIO.bgDir = 27;
MP1_USA_WARIO.str = {
  boardSelect: 655,
  koopaIntro: 574,
};
MP1_USA_WARIO.img = {
  boardSelectImg: 19,
  pauseLogoImg: 279,
  introLogoImg: [365],
  titleScreenImg: 384,
};
MP1_USA_WARIO.sceneIndex = 0x39; // 57
MP1_USA_WARIO.eventASMStart = 0x00;
// MP1_USA_WARIO.spaceEventsStartAddr = 0x000F99C4;
// MP1_USA_WARIO.spaceEventsStartOffset = 0x0024C2E4;
// MP1_USA_WARIO.spaceEventsEndOffset = 0x0024C38C;
MP1_USA_WARIO.koopaSpaceInst = 0xED0; // 0x00249DD0;
MP1_USA_WARIO.bowserSpaceInst = 0xDA8; // 0x00249CA8;
MP1_USA_WARIO.boosLoopFnOffset = 0x119C; // 0x0024A09C;
MP1_USA_WARIO.boosReadbackFnOffset = 0x1094; // 0x00249F94;
MP1_USA_WARIO.starSpaceArrOffset = 0x3240; // 0x0024C140;
MP1_USA_WARIO.starSpaceCount = 7;
MP1_USA_WARIO.toadSpaceArrOffset = [0x3250, 0x3270]; // [0x0024C150, 0x0024C170];

// Luigi's Engine Room - (U) ROM
const MP1_USA_LUIGI = createBoardInfo("MP1_USA_LUIGI");
MP1_USA_LUIGI.name = "Luigi's Engine Room";
MP1_USA_LUIGI.boardDefFile = 73;
MP1_USA_LUIGI.bgDir = 39;
MP1_USA_LUIGI.str = {
  boardSelect: 656,
  koopaIntro: 575,
};
MP1_USA_LUIGI.img = {
  boardSelectImg: 21,
  pauseLogoImg: 280,
  introLogoImg: [368],
  titleScreenImg: 381,
};
MP1_USA_LUIGI.sceneIndex = 0x3A; // 58
MP1_USA_LUIGI.eventASMStart = 0x00;
// MP1_USA_LUIGI.spaceEventsStartAddr = 0x000F9B90;
// MP1_USA_LUIGI.spaceEventsStartOffset = 0x0024F940;
// MP1_USA_LUIGI.spaceEventsEndOffset = 0x0024FA70;
MP1_USA_LUIGI.starSpaceArrOffset = 0x2F60; // 0x0024F2F0;
MP1_USA_LUIGI.starSpaceCount = 7;
MP1_USA_LUIGI.toadSpaceArrOffset = [0x2F70, 0x2FF4]; // [0x0024F300, 0x0024F384];

// Mario's Rainbow Castle - (U) ROM
const MP1_USA_MARIO = createBoardInfo("MP1_USA_MARIO");
MP1_USA_MARIO.name = "Mario's Rainbow Castle";
MP1_USA_MARIO.boardDefFile = 74;
MP1_USA_MARIO.bgDir = 47;
MP1_USA_MARIO.str = {
  boardSelect: 657,
  koopaIntro: 576,
};
MP1_USA_MARIO.img = {
  boardSelectImg: 22,
  pauseLogoImg: 281,
  introLogoImg: [371],
  titleScreenImg: 380,
};
MP1_USA_MARIO.sceneIndex = 0x3B; // 59
MP1_USA_MARIO.eventASMStart = 0x00;
// MP1_USA_MARIO.spaceEventsStartAddr = 0x000F8390;
// MP1_USA_MARIO.spaceEventsStartOffset = 0x00251830;
// MP1_USA_MARIO.spaceEventsEndOffset = 0x002518D0;

// Bowser's Magma Mountain - (U) ROM
const MP1_USA_BOWSER = createBoardInfo("MP1_USA_BOWSER");
MP1_USA_BOWSER.name = "Bowser's Magma Mountain";
MP1_USA_BOWSER.boardDefFile = 75;
MP1_USA_BOWSER.bgDir = 56;
MP1_USA_BOWSER.str = {
  boardSelect: 658,
  koopaIntro: 577,
};
MP1_USA_BOWSER.img = {
  boardSelectImg: 23,
  pauseLogoImg: 282,
  introLogoImg: [374],
};
MP1_USA_BOWSER.sceneIndex = 0x3C; // 60
MP1_USA_BOWSER.eventASMStart = 0x00;
// MP1_USA_BOWSER.spaceEventsStartAddr = 0x000F9080;
// MP1_USA_BOWSER.spaceEventsStartOffset = 0x00254370;
// MP1_USA_BOWSER.spaceEventsEndOffset = 0x00254450;
MP1_USA_BOWSER.starSpaceArrOffset = 0x2298; // 0x00253B68;
MP1_USA_BOWSER.starSpaceCount = 7;
MP1_USA_BOWSER.toadSpaceArrOffset = [0x22A8, 0x22C8]; // [0x00253B78, 0x00253B98];

// Eternal Star - (U) ROM
const MP1_USA_ETERNALSTAR = createBoardInfo("MP1_USA_ETERNALSTAR");
MP1_USA_ETERNALSTAR.name = "Eternal Star";
MP1_USA_ETERNALSTAR.boardDefFile = 76;
MP1_USA_ETERNALSTAR.bgDir = 68;
MP1_USA_ETERNALSTAR.str = {
  boardSelect: [659, 660],
  koopaIntro: 578,
};
MP1_USA_ETERNALSTAR.img = {
  boardSelectImg: 24,
  pauseLogoImg: 283,
  introLogoImg: [378],
};
MP1_USA_ETERNALSTAR.sceneIndex = 0x3D; // 61
MP1_USA_ETERNALSTAR.eventASMStart = 0x00;
// MP1_USA_ETERNALSTAR.spaceEventsStartAddr = 0x000F905C;
// MP1_USA_ETERNALSTAR.spaceEventsStartOffset = 0x00256ECC;
// MP1_USA_ETERNALSTAR.spaceEventsEndOffset = 0x00256FF0;
MP1_USA_ETERNALSTAR.bowserSpaceInst = 0xDDC; // 0x0025522C;
MP1_USA_ETERNALSTAR.starSpaceArrOffset = 0x25F0; // 0x00256A40;
MP1_USA_ETERNALSTAR.starSpaceCount = 7;
MP1_USA_ETERNALSTAR.toadSpaceArrOffset = 0x2600; // 0x00256A50;

// Training - (U) ROM
const MP1_USA_TRAINING = createBoardInfo("MP1_USA_TRAINING");
MP1_USA_TRAINING.name = "Training";
MP1_USA_TRAINING.boardDefFile = 77;
MP1_USA_TRAINING.bgDir = 77;
MP1_USA_TRAINING.str = {};
MP1_USA_TRAINING.img = {};
MP1_USA_TRAINING.sceneIndex = 0x3E; // 62
MP1_USA_TRAINING.eventASMStart = 0x00;
// MP1_USA_TRAINING.spaceEventsStartAddr = 0x000F87A8;
// MP1_USA_TRAINING.spaceEventsStartOffset = 0x002591B8;
// MP1_USA_TRAINING.spaceEventsEndOffset = 0x002591E8;
MP1_USA_TRAINING.bowserSpaceInst = 0x32C; // 0x0025731C;
MP1_USA_TRAINING.toadSpaceInst = 0x16C; // 0x0025715C;
MP1_USA_TRAINING.koopaSpaceInst = 0x1F4; // 0x002571E4;
MP1_USA_TRAINING.booSpaceInst = 0x2A4; // 0x00257294;

// Mini-Game Stadium - (U) ROM
const MP1_USA_STADIUM = createBoardInfo("MP1_USA_STADIUM");
MP1_USA_STADIUM.name = "Mini-Game Stadium";
MP1_USA_STADIUM.boardDefFile = 83;
MP1_USA_STADIUM.bgDir = 99;
MP1_USA_STADIUM.str = {};
MP1_USA_STADIUM.img = {};
//MP1_USA_STADIUM.sceneIndex = 0x3F; // 63

// Mini-Game Island - (U) ROM
const MP1_USA_ISLAND = createBoardInfo("MP1_USA_ISLAND");
MP1_USA_ISLAND.name = "Mini-Game Island";
MP1_USA_ISLAND.boardDefFile = 78;
MP1_USA_ISLAND.bgDir = 79;
MP1_USA_ISLAND.str = {};
MP1_USA_ISLAND.img = {};
MP1_USA_ISLAND.sceneIndex = 0x72; // 114
MP1_USA_ISLAND.eventASMStart = 0x00;
// MP1_USA_ISLAND.spaceEventsStartAddr = 0x000F8448;
// MP1_USA_ISLAND.spaceEventsStartOffset = 0x002F8EE8;
// MP1_USA_ISLAND.spaceEventsEndOffset = 0x002F9040;

export function getBoardInfos() {
  return [
    MP1_USA_DK,
    MP1_USA_PEACH,
    MP1_USA_YOSHI,
    MP1_USA_WARIO,
    MP1_USA_LUIGI,
    MP1_USA_MARIO,
    MP1_USA_BOWSER,
    MP1_USA_ETERNALSTAR,
    MP1_USA_TRAINING,
    MP1_USA_ISLAND,
    MP1_USA_STADIUM,
  ];
}
