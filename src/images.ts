import { render } from "./renderer";

import toadImg from "./img/editor/toad.png";
import mstarImg from "./img/editor/mstar.png";
import bowserImg from "./img/editor/bowser.png";
import koopaImg from "./img/editor/koopa.png";
import booImg from "./img/editor/boo.png";
import goombaImg from "./img/editor/goomba.png";
import eventImg from "./img/editor/event.png";
import eventErrorImg from "./img/editor/eventerrors.png";
import starImg from "./img/editor/star.png";
import bank2Img from "./img/editor/bank2.png";
import bank3Img from "./img/editor/bank.png";
import bankcoinImg from "./img/editor/bankcoin.png";
import itemShop2Img from "./img/editor/itemshop2.png";
import itemShop3Img from "./img/editor/itemshop.png";
import gateImg from "./img/editor/gate.png";

import spaceBowser from "./img/editor/spaces/bowser.png";

import spaceItem2 from "./img/editor/spaces/item2.png";

import spaceBlue3 from "./img/editor/spaces/blue3.png";
import spaceRed3 from "./img/editor/spaces/red3.png";
import spaceHappening3 from "./img/editor/spaces/happening3.png";
import spaceChance3 from "./img/editor/spaces/chance3.png";
import spaceBowser3 from "./img/editor/spaces/bowser3.png";
import spaceItem3 from "./img/editor/spaces/item3.png";
import spaceBattle3 from "./img/editor/spaces/battle3.png";
import spaceBank3 from "./img/editor/spaces/bank3.png";
import spaceGameGuy3 from "./img/editor/spaces/gameguy.png";

import spaceDuelBasic3 from "./img/editor/spaces/basic3.png";
import spaceDuelPowerup3 from "./img/editor/spaces/powerup3.png";
import spaceDuelReverse3 from "./img/editor/spaces/reverse3.png";
import spaceGameGuyDuel3 from "./img/editor/spaces/gameguyduel.png";
import spaceMiniGameDuel3 from "./img/editor/spaces/minigameduel3.png";
import spaceHappeningDuel3 from "./img/editor/spaces/happeningduel3.png";

import targetImg from "./img/events/target.png";

// This is just kind of a goofy thing that makes sure we load all the images
// that are part of rendering, and then triggers a re-render when they load.

const _images: { [name: string]: HTMLImageElement } = {};
let _imageTemp: { [name: string]: string } | null = {};
let _imagesToLoad: number = 0;

addImage("toadImg", toadImg);
addImage("mstarImg", mstarImg);
addImage("bowserImg", bowserImg);
addImage("koopaImg", koopaImg);
addImage("booImg", booImg);
addImage("goombaImg", goombaImg);
addImage("eventImg", eventImg);
addImage("eventErrorImg", eventErrorImg);
addImage("starImg", starImg);
addImage("bank2Img", bank2Img);
addImage("bank3Img", bank3Img);
addImage("bankcoinImg", bankcoinImg);
addImage("itemShop2Img", itemShop2Img);
addImage("itemShop3Img", itemShop3Img);
addImage("gateImg", gateImg);

addImage("spaceBowser", spaceBowser);

addImage("spaceItem2", spaceItem2);

addImage("spaceBlue3", spaceBlue3);
addImage("spaceRed3", spaceRed3);
addImage("spaceHappening3", spaceHappening3);
addImage("spaceChance3", spaceChance3);
addImage("spaceBowser3", spaceBowser3);
addImage("spaceItem3", spaceItem3);
addImage("spaceBattle3", spaceBattle3);
addImage("spaceBank3", spaceBank3);
addImage("spaceGameGuy3", spaceGameGuy3);

addImage("spaceDuelBasic3", spaceDuelBasic3);
addImage("spaceDuelPowerup3", spaceDuelPowerup3);
addImage("spaceDuelReverse3", spaceDuelReverse3);
addImage("spaceGameGuyDuel3", spaceGameGuyDuel3);
addImage("spaceMiniGameDuel3", spaceMiniGameDuel3);
addImage("spaceHappeningDuel3", spaceHappeningDuel3);

addImage("targetImg", targetImg);

function addImage(name: string, url: string) {
  _imageTemp![name] = url;
  _images[name] = new Image();
  _imagesToLoad = _imagesToLoad + 1;
  _images[name].onload = _onImageLoaded;
}

// Trigger a re-render when all the external image assets load.
function _onImageLoaded() {
  _imagesToLoad = _imagesToLoad - 1;
  if (!_imagesToLoad) {
    //$$log("All images loaded, rendering again.");
    render();
  }
}

for (let name in _imageTemp) {
  if (!_imageTemp.hasOwnProperty(name))
    continue;
  let url = _imageTemp[name];
  _images[name].src = url;
}
_imageTemp = null;

export function getImage(name: string) {
  return _images[name];
}
