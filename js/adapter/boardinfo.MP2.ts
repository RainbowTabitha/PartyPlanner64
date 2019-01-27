import { Game } from "../types";
import { createBoardInfo } from "./boardinfobase";
import { IBoard } from "../boards";
import { hvqfs } from "../fs/hvqfs";
import { strings } from "../fs/strings";
import { mainfs } from "../fs/mainfs";
import { arrayToArrayBuffer } from "../utils/arrays";
import { toPack } from "../utils/img/ImgPack";
import { scenes } from "../fs/scenes";

// Western Land - (U) ROM
const MP2_WESTERN = createBoardInfo("MP2_WESTERN");
MP2_WESTERN.name = "Western Land";
MP2_WESTERN.boardDefFile = 64;
MP2_WESTERN.bgDir = 2;
MP2_WESTERN.animBgSet = 0;
MP2_WESTERN.str = {
  boardSelect: 197,
  boardNames: [190, 210],
  boardGreeting: [1248, 1249],
  boardWinner: 707,
  boardPlayCount: 1327,
};
MP2_WESTERN.img = {
  introLogoImg: 406,
  pauseLogoImg: 380,
  boardSelectImg: 30,
  boardSelectIconCoords: [39, 20],
  boardSelectIconMask: 20,
};
MP2_WESTERN.mainfsEventFile = [10, 682];
MP2_WESTERN.sceneIndex = 0x3E; // 62
// First I tried 0x0029CF24 / 0x80107C54, but then I included the star event
// at 0x0029E91C / 0x80?. But then, using items NOP sledded, and I found a mystery
// table at 0x800DF720 that suggests I should use this actually:
MP2_WESTERN.eventASMStart = 0xD350; // 0x8010FB50, 0x002A4E20
MP2_WESTERN.eventASMEnd = 0xEAE4; // 0x801112E4, 0x002A65B4
// MP2_WESTERN.spaceEventsStartAddr = 0x0011280C;
// MP2_WESTERN.spaceEventsStartOffset = 0x002A7ADC;
// MP2_WESTERN.spaceEventsEndOffset = 0x002A7BE0;
MP2_WESTERN.spaceEventTables = [
  { upper: 0x33EC, lower: 0x33F4 }, // 0x80105BEC, 0x80105BF4, table 0x80112484
  { upper: 0x33F8, lower: 0x3400, primary: true }, // 0x80105BF8, 0x80105C00, table 0x8011280C
  { upper: 0x3404, lower: 0x340C }, // 0x80105C04, 0x80105C0C, table 0x801124EC
];
MP2_WESTERN.starSpaceArrOffset = [0xF184, 0xF1F4]; // [0x002A6C54, 0x002A6CC4]; // 0x80111984, 0x801119F4
MP2_WESTERN.starSpaceCount = 7;
MP2_WESTERN.toadSpaceArrOffset = [0xF194, 0xF244]; //  [0x002A6C64, 0x002A6D14];
MP2_WESTERN.bankArrOffset = [0xF388]; // [0x002A6E58]; // 0x80111B88
MP2_WESTERN.bankCoinArrOffset = [0xF26C]; // [0x002A6D3C]; // 0x80111A6C
MP2_WESTERN.bankCount = 2;
MP2_WESTERN.itemShopArrOffset = [0xF38C]; // [0x002A6E5C]; // 0x80111B8C
MP2_WESTERN.itemShopCount = 1;
MP2_WESTERN.booArrOffset = [0xF268]; // [0x002A6D38]; // 0x80111A68
MP2_WESTERN.booCount = 2;
MP2_WESTERN.audioIndexOffset = 0x33AA; // 0x0029AE7A; // 0x80105BA4
MP2_WESTERN.onLoad = function(board: IBoard) {
  board.otherbg.largescene = hvqfs.readBackground(MP2_WESTERN.bgDir + 2).src;
};
MP2_WESTERN.onAfterOverwrite = function(board: IBoard) {
  const sceneView = scenes.getDataView(62);
  //romView.setUint32(0x29AE18, 0); Baby Bowser
  //romView.setUint32(0x29AE20, 0); Toad
  //romView.setUint32(0x29AE28, 0); // Boo assets
  //romView.setUint32(0x29AE30, 0); // ... not the train
  sceneView.setUint32(0x3368, 0); // 0x29AE38 // Wipe out wood gates fn, which reads 2 space indices at 2A6DB8
  //romView.setUint32(0x29AE40, 0); // ... not the train
  //romView.setUint32(0x29AE48, 0); // ... not the train
  sceneView.setUint32(0x3380, 0); // 0x29AE50 // Train!

  // Prevent unused event table hydration
  // romView.setUint32(0x29AEBC, 0); // 0x80112484 table
  // romView.setUint32(0x29AEC0, 0);
  // romView.setUint32(0x29AEC4, 0);
  // romView.setUint32(0x29AED4, 0); // 0x801124EC table
  // romView.setUint32(0x29AED8, 0);
  // romView.setUint32(0x29AEDC, 0);

  // Skip Bowser the Brash fight scene
  // 0x004F is the Bowser scene, 0x0051 is the results scene.
  // To debug, end game early with 0x800F93AF (turn count)
  // Then watch scene change 0x800FA63C
  const sceneEndView = scenes.getDataView(82);
  sceneEndView.setUint16(0x2E0E, 0x0051); // 0x8010560C, 0x35BBEE

  // Then, make the scared Koopa's message at the endgame be more chill.
  let bytes: number[] = [];
  bytes.push(0x0B);
  bytes = bytes.concat(strings._strToBytes("Don't listen to Toad!"));
  bytes.push(0x0A); // \n
  bytes = bytes.concat(strings._strToBytes("I've got the results. Follow me!"));
  bytes.push(0x00); // Null byte
  strings.write(697, arrayToArrayBuffer(bytes));

  // Use the normal character models, not themed.
  for (let charIdx = 2; charIdx <= 7; charIdx++) {
    mainfs.write(charIdx, 212, mainfs.get(charIdx, 211)); // Western Land - small model
    mainfs.write(charIdx, 213, mainfs.get(charIdx, 209)); // Western Land - big model
  }

  // For each character (different than loop above)
  for (let c = 0; c < 6; c++) {
    // Replace the 2d model renders of themed characters
    mainfs.write(10, 612 + c, mainfs.get(10, 642 + c));

    // Replace the bowser suited 2d renders
    mainfs.write(10, 648 + c, mainfs.get(10, 666 + c));
  }

  // Hide some intro scene graphics
  // Bowser sign
  let oldPack = mainfs.get(10, 410);
  let imgInfoArr = [{ src: new ArrayBuffer(144 * 128 * 4), width: 144, height: 128, bpp: 32 }];
  let newPack = toPack(imgInfoArr, 16, 0, oldPack);
  mainfs.write(10, 410, newPack);

  // Hole in ground that Bowser sign sticks into
  oldPack = mainfs.get(10, 411);
  imgInfoArr = [{ src: new ArrayBuffer(32 * 16 * 4), width: 32, height: 16, bpp: 32 }];
  newPack = toPack(imgInfoArr, 16, 0, oldPack);
  mainfs.write(10, 411, newPack);

  // (unused) Dust in the wind or whatever it is called
  oldPack = mainfs.get(10, 412);
  imgInfoArr = [{ src: new ArrayBuffer(64 * 64 * 4), width: 64, height: 64, bpp: 32 }];
  newPack = toPack(imgInfoArr, 16, 0, oldPack);
  mainfs.write(10, 412, newPack);

  // Train that rides across, model files can be blanked out
  // Cannot just blank model, does not work on console.
  //mainfs.write(10, 394, new ArrayBuffer(0x200));
  let form = mainfs.get(10, 394);
  let formView = new DataView(form);
  formView.setUint16(0x1FC, 0);
  formView.setUint16(0x1106, 0);
  mainfs.write(10, 394, form);

  //mainfs.write(10, 395, new ArrayBuffer(0x200));
  form = mainfs.get(10, 395);
  formView = new DataView(form);
  formView.setUint16(0x204, 0);
  formView.setUint16(0x616, 0);
  mainfs.write(10, 395, form);
};

// Pirate Land - (U) ROM
const MP2_PIRATE = createBoardInfo("MP2_PIRATE");
MP2_PIRATE.name = "Pirate Land";
MP2_PIRATE.boardDefFile = 65;
MP2_PIRATE.bgDir = 10;
MP2_PIRATE.animBgSet = 1;
MP2_PIRATE.str = {
  boardSelect: 198,
};
MP2_PIRATE.img = {
  introLogoImg: 422,
  pauseLogoImg: 381,
  boardSelectImg: 31,
  boardSelectIconCoords: [35, 61],
};
//MP2_PIRATE.sceneIndex = 0x3F; // 63
MP2_PIRATE.arrowRotStartOffset = 0x00; // 0x801059F0
MP2_PIRATE.arrowRotEndOffset = 0x00; // 0x80105A30

// Horror Land - (U) ROM
const MP2_HORROR = createBoardInfo("MP2_HORROR");
MP2_HORROR.name = "Horror Land";
MP2_HORROR.boardDefFile = 66;
MP2_HORROR.bgDir = 21;
MP2_HORROR.animBgSet = 2;
MP2_HORROR.str = {
  boardSelect: 201,
};
MP2_HORROR.img = {
  introLogoImg: 581,
  pauseLogoImg: 382,
  boardSelectImg: 32,
  boardSelectIconCoords: [133, 60],
};
MP2_HORROR.sceneIndex = 0x43; // 67
MP2_HORROR.eventASMStart = 0; // 0x80112248 ballpark for safe start
MP2_HORROR.eventASMEnd = 0; // 0x80112C2C same, c2c is big boo event b2w
// MP2_HORROR.spaceEventsStartAddr = 0x0011466C; // There's more...
// MP2_HORROR.spaceEventsStartOffset = 0x002D9B5C;
// MP2_HORROR.spaceEventsEndOffset = 0x002D9CD4;
MP2_HORROR.spaceEventTables = [ // Tables around 0x80114xxx
  { upper: 0x3854, lower: 0x385C }, // 0x80106054, 0x8010605C
  { upper: 0x3860, lower: 0x3868 }, // 0x80106060, 0x80106068
  { upper: 0x3898, lower: 0x38A0 }, // 0x80106098, 0x801060A0
  { upper: 0x38A4, lower: 0x38A8 }, // 0x801060A4, 0x801060A8 // Puts the JAL afterwards for some reason.
];

// Space Land - (U) ROM
const MP2_SPACE = createBoardInfo("MP2_SPACE");
MP2_SPACE.name = "Space Land";
MP2_SPACE.boardDefFile = 67;
MP2_SPACE.bgDir = 24;
MP2_SPACE.animBgSet = 3;
MP2_SPACE.str = {
  boardSelect: 199,
  boardNames: [193, 212],
};
MP2_SPACE.img = {
  introLogoImg: 500,
  pauseLogoImg: 383,
  boardSelectImg: 33,
  boardSelectIconCoords: [93, 10],
};

// Mystery Land - (U) ROM
const MP2_MYSTERY = createBoardInfo("MP2_MYSTERY");
MP2_MYSTERY.name = "Mystery Land";
MP2_MYSTERY.boardDefFile = 68;
MP2_MYSTERY.bgDir = 16;
MP2_MYSTERY.str = {
  boardSelect: 200,
};
MP2_MYSTERY.img = {
  introLogoImg: 502,
  pauseLogoImg: 384,
  boardSelectImg: 34,
  boardSelectIconCoords: [139, 19],
};

// Bowser Land - (U) ROM
const MP2_BOWSER = createBoardInfo("MP2_BOWSER");
MP2_BOWSER.name = "Bowser Land";
MP2_BOWSER.boardDefFile = 69
MP2_BOWSER.bgDir = 37;
MP2_BOWSER.animBgSet = 4;
MP2_BOWSER.str = {
  boardSelect: 202,
};
MP2_BOWSER.img = {
  introLogoImg: 547,
  pauseLogoImg: 385,
  boardSelectImg: 35,
};

/*
{
  "name": "Mini-Game Stadium",
  "fileNum": 70,
  "bgNum": 37,
  "titleImg": 386,
},
{
  "name": "mystery",
  "fileNum": 71,
  "bgNum": 59,
  "titleImg": 387,
},
{
  "name": "mystery",
  "fileNum": 72,
  "bgNum": 59,
  "titleImg": 387,
},
{
  "name": "mystery",
  "fileNum": 73,
  "bgNum": 59,
  "titleImg": 387,
},
{
  "name": "mystery",
  "fileNum": 74,
  "bgNum": 59,
  "titleImg": 387,
},
{
  "name": "mystery",
  "fileNum": 75,
  "bgNum": 59,
  "titleImg": 387,
},
{
  "name": "mystery",
  "fileNum": 76,
  "bgNum": 59,
  "titleImg": 387,
},
{
  "name": "mystery",
  "fileNum": 77,
  "bgNum": 59,
  "titleImg": 387,
},
{
  "name": "mystery",
  "fileNum": 78,
  "bgNum": 59,
  "titleImg": 387,
},
{
  "name": "mystery",
  "fileNum": 79,
  "bgNum": 59,
  "titleImg": 387,
},
{
  "name": "Rules Land",
  "fileNum": 80,
  "bgNum": 43,
  //"titleImg": ,
},
*/
/*
  const _boardLocData = [
    {
      "name": "Mini-Game Stadium",
      "fileNum": 70,
      "bgNum": 37,
      "titleImg": 386,
    },
    {
      "name": "mystery",
      "fileNum": 71,
      "bgNum": 59,
      "titleImg": 387,
    },
    {
      "name": "mystery",
      "fileNum": 72,
      "bgNum": 59,
      "titleImg": 387,
    },
    {
      "name": "mystery",
      "fileNum": 73,
      "bgNum": 59,
      "titleImg": 387,
    },
    {
      "name": "mystery",
      "fileNum": 74,
      "bgNum": 59,
      "titleImg": 387,
    },
    {
      "name": "mystery",
      "fileNum": 75,
      "bgNum": 59,
      "titleImg": 387,
    },
    {
      "name": "mystery",
      "fileNum": 76,
      "bgNum": 59,
      "titleImg": 387,
    },
    {
      "name": "mystery",
      "fileNum": 77,
      "bgNum": 59,
      "titleImg": 387,
    },
    {
      "name": "mystery",
      "fileNum": 78,
      "bgNum": 59,
      "titleImg": 387,
    },
    {
      "name": "mystery",
      "fileNum": 79,
      "bgNum": 59,
      "titleImg": 387,
    },
    {
      "name": "Rules Land",
      "fileNum": 80,
      "bgNum": 43,
      //"titleImg": ,
    },
  ];*/

export function getBoardInfos(gameID: Game) {
  switch(gameID) {
    case Game.MP2_USA:
      return [
        MP2_WESTERN,
        MP2_PIRATE,
        MP2_HORROR,
        MP2_SPACE,
        MP2_MYSTERY,
        MP2_BOWSER,
      ];
  }
}
