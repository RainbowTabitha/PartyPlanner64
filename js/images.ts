// This is just kind of a goofy wrapper that makes sure we load all the images
// that are part of rendering, and then triggers a re-render when they load.
namespace PP64.images {
  const _images: { [name: string]: HTMLImageElement } = {};
  let _imageTemp: { [name: string]: string } | null = {};
  let _imagesToLoad: number = 0;

  addImage("toadImg", "img/editor/toad.png");
  addImage("mstarImg", "img/editor/mstar.png");
  addImage("bowserImg", "img/editor/bowser.png");
  addImage("koopaImg", "img/editor/koopa.png");
  addImage("booImg", "img/editor/boo.png");
  addImage("goombaImg", "img/editor/goomba.png");
  addImage("eventImg", "img/editor/event.png");
  addImage("eventErrorImg", "img/editor/eventerrors.png");
  addImage("starImg", "img/editor/star.png");
  addImage("bank2Img", "img/editor/bank2.png");
  addImage("bank3Img", "img/editor/bank.png");
  addImage("bankcoinImg", "img/editor/bankcoin.png");
  addImage("itemShop2Img", "img/editor/itemshop2.png");
  addImage("itemShop3Img", "img/editor/itemshop.png");
  addImage("gateImg", "img/editor/gate.png");

  addImage("spaceBowser", "img/editor/spaces/bowser.png");

  addImage("spaceItem2", "img/editor/spaces/item2.png");

  addImage("spaceBlue3", "img/editor/spaces/blue3.png");
  addImage("spaceRed3", "img/editor/spaces/red3.png");
  addImage("spaceHappening3", "img/editor/spaces/happening3.png");
  addImage("spaceChance3", "img/editor/spaces/chance3.png");
  addImage("spaceBowser3", "img/editor/spaces/bowser3.png");
  addImage("spaceItem3", "img/editor/spaces/item3.png");
  addImage("spaceBattle3", "img/editor/spaces/battle3.png");
  addImage("spaceBank3", "img/editor/spaces/bank3.png");
  addImage("spaceGameGuy3", "img/editor/spaces/gameguy.png");

  addImage("spaceDuelBasic3", "img/editor/spaces/basic3.png");
  addImage("spaceDuelPowerup3", "img/editor/spaces/powerup3.png");
  addImage("spaceDuelReverse3", "img/editor/spaces/reverse3.png");
  addImage("spaceGameGuyDuel3", "img/editor/spaces/gameguyduel.png");
  addImage("spaceMiniGameDuel3", "img/editor/spaces/minigameduel3.png");
  addImage("spaceHappeningDuel3", "img/editor/spaces/happeningduel3.png");

  addImage("targetImg", "img/events/target.png");

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
      PP64.renderer.render();
    }
  }

  for (let name in _imageTemp) {
    if (!_imageTemp.hasOwnProperty(name))
      continue;
    let url = _imageTemp[name];
    _images[name].src = url;
  }
  _imageTemp = null;

  export function get(name: string) {
    return _images[name];
  }
}
