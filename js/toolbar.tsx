import * as React from "react";
import { makeKeyClick } from "./utils/react";
import { Action, BoardType } from "./types";
import { $setting, get } from "./settings";
import { currentBoardIsROM } from "./boards";
import { changeCurrentAction } from "./appControl";

// This used to be a toolbar... now it is the toolbox contents.

interface IToolbarItem {
  name: string;
  icon: string;
  type: Action;
  draggable?: boolean;
  advanced?: boolean;
}

interface IToolbarSpacer {
  spacer: true;
}

type ToolbarItem = IToolbarItem | IToolbarSpacer

const mp1_actions: ToolbarItem[] = [
  { "name": "Move spaces", "icon": "img/toolbar/move.png", "type": Action.MOVE },
  { "name": "Connect spaces", "icon": "img/toolbar/line.png", "type": Action.LINE },
  { "name": "Connect multiple spaces in one click", "icon": "img/toolbar/stickyline.png", "type": Action.LINE_STICKY },
  { "name": "Erase spaces and lines", "icon": "img/toolbar/eraser.png", "type": Action.ERASE },
  { "spacer": true},
  { "name": "Add blue space", "icon": "img/toolbar/blue.png", "type": Action.ADD_BLUE, draggable: true },
  { "name": "Add red space", "icon": "img/toolbar/red.png", "type": Action.ADD_RED, draggable: true },
  { "name": "Add happening space", "icon": "img/toolbar/happening.png", "type": Action.ADD_HAPPENING, draggable: true },
  { "name": "Add chance time space", "icon": "img/toolbar/chance.png", "type": Action.ADD_CHANCE, draggable: true },
  { "name": "Add Bowser space", "icon": "img/toolbar/bowser.png", "type": Action.ADD_BOWSER, draggable: true },
  { "name": "Add Mini-Game space", "icon": "img/toolbar/minigame.png", "type": Action.ADD_MINIGAME, draggable: true },
  { "name": "Add shroom space", "icon": "img/toolbar/shroom.png", "type": Action.ADD_SHROOM, draggable: true },
  { "name": "Add invisible space", "icon": "img/toolbar/other.png", "type": Action.ADD_OTHER, draggable: true },
  { "name": "Add star space (decoration)", "icon": "img/toolbar/star.png", "type": Action.ADD_STAR, draggable: true, advanced: true },
  { "name": "Add start space", "icon": "img/toolbar/start.png", "type": Action.ADD_START, draggable: true, advanced: true },
  { "spacer": true},
  // {
  //   "group": "Other spaces",
  //   "icon": "img/toolbar/other.png",
  //   "actions": [
      { "name": "Add Toad", "icon": "img/toolbar/toad.png", "type": Action.ADD_TOAD_CHARACTER, draggable: true },
      { "name": "Add Boo", "icon": "img/toolbar/boo.png", "type": Action.ADD_BOO_CHARACTER, draggable: true },
      { "name": "Add Bowser", "icon": "img/toolbar/bowsercharacter.png", "type": Action.ADD_BOWSER_CHARACTER, draggable: true },
      { "name": "Add Koopa Troopa", "icon": "img/toolbar/koopa.png", "type": Action.ADD_KOOPA_CHARACTER, draggable: true },
      { "name": "Mark space as hosting star", "icon": "img/toolbar/markstar.png", "type": Action.MARK_STAR },
  //   ]
  // }
];

const mp2_actions: ToolbarItem[] = [
  { "name": "Move spaces", "icon": "img/toolbar/move.png", "type": Action.MOVE },
  { "name": "Connect spaces", "icon": "img/toolbar/line.png", "type": Action.LINE },
  { "name": "Connect multiple spaces in one click", "icon": "img/toolbar/stickyline.png", "type": Action.LINE_STICKY },
  { "name": "Erase spaces and lines", "icon": "img/toolbar/eraser.png", "type": Action.ERASE },
  { "spacer": true},
  { "name": "Add blue space", "icon": "img/toolbar/blue.png", "type": Action.ADD_BLUE, draggable: true },
  { "name": "Add red space", "icon": "img/toolbar/red.png", "type": Action.ADD_RED, draggable: true },
  { "name": "Add happening space", "icon": "img/toolbar/happening.png", "type": Action.ADD_HAPPENING, draggable: true },
  { "name": "Add chance time space", "icon": "img/toolbar/chance2.png", "type": Action.ADD_CHANCE, draggable: true },
  { "name": "Add Bowser space", "icon": "img/toolbar/bowser.png", "type": Action.ADD_BOWSER, draggable: true },
  { "name": "Add item space", "icon": "img/toolbar/item.png", "type": Action.ADD_ITEM, draggable: true },
  { "name": "Add battle space", "icon": "img/toolbar/battle.png", "type": Action.ADD_BATTLE, draggable: true },
  { "name": "Add bank space", "icon": "img/toolbar/bank.png", "type": Action.ADD_BANK, draggable: true },
  { "name": "Add invisible space", "icon": "img/toolbar/other.png", "type": Action.ADD_OTHER, draggable: true },
  { "name": "Add star space (decoration)", "icon": "img/toolbar/star.png", "type": Action.ADD_STAR, draggable: true, advanced: true },
  { "name": "Add black star space (decoration)", "icon": "img/toolbar/blackstar.png", "type": Action.ADD_BLACKSTAR, draggable: true, advanced: true },
  { "name": "Add start space", "icon": "img/toolbar/start.png", "type": Action.ADD_START, draggable: true, advanced: true },
  { "name": "Add arrow space", "icon": "img/toolbar/arrow.png", "type": Action.ADD_ARROW, draggable: true, advanced: true },
  { "spacer": true},
  { "name": "Add Toad", "icon": "img/toolbar/toad.png", "type": Action.ADD_TOAD_CHARACTER, draggable: true },
  { "name": "Add Boo", "icon": "img/toolbar/boo.png", "type": Action.ADD_BOO_CHARACTER, draggable: true },
  { "name": "Add bank", "icon": "img/toolbar/banksubtype2.png", "type": Action.ADD_BANK_SUBTYPE, draggable: true },
  { "name": "Add bank coin stack", "icon": "img/toolbar/bankcoinsubtype.png", "type": Action.ADD_BANKCOIN_SUBTYPE, draggable: true },
  { "name": "Add item shop", "icon": "img/toolbar/itemshopsubtype2.png", "type": Action.ADD_ITEMSHOP_SUBTYPE, draggable: true },
  { "name": "Mark space as hosting star", "icon": "img/toolbar/markstar.png", "type": Action.MARK_STAR },
];

const mp3_actions: ToolbarItem[] = [
  { "name": "Move spaces", "icon": "img/toolbar/move.png", "type": Action.MOVE },
  { "name": "Connect spaces", "icon": "img/toolbar/line.png", "type": Action.LINE },
  { "name": "Connect multiple spaces in one click", "icon": "img/toolbar/stickyline.png", "type": Action.LINE_STICKY },
  { "name": "Erase spaces and lines", "icon": "img/toolbar/eraser.png", "type": Action.ERASE },
  { "name": "Rotate arrow spaces", "icon": "img/toolbar/rotate.png", "type": Action.ROTATE, advanced: true },
  { "spacer": true},
  { "name": "Add blue space", "icon": "img/toolbar/blue3.png", "type": Action.ADD_BLUE, draggable: true },
  { "name": "Add red space", "icon": "img/toolbar/red3.png", "type": Action.ADD_RED, draggable: true },
  { "name": "Add happening space", "icon": "img/toolbar/happening3.png", "type": Action.ADD_HAPPENING, draggable: true },
  { "name": "Add chance time space", "icon": "img/toolbar/chance3.png", "type": Action.ADD_CHANCE, draggable: true },
  { "name": "Add Bowser space", "icon": "img/toolbar/bowser3.png", "type": Action.ADD_BOWSER, draggable: true },
  { "name": "Add item space", "icon": "img/toolbar/item3.png", "type": Action.ADD_ITEM, draggable: true },
  { "name": "Add battle space", "icon": "img/toolbar/battle3.png", "type": Action.ADD_BATTLE, draggable: true },
  { "name": "Add bank space", "icon": "img/toolbar/bank3.png", "type": Action.ADD_BANK, draggable: true },
  { "name": "Add Game Guy space", "icon": "img/toolbar/gameguy.png", "type": Action.ADD_GAMEGUY, draggable: true },
  { "name": "Add invisible space", "icon": "img/toolbar/other.png", "type": Action.ADD_OTHER, draggable: true },
  { "name": "Add star space (decoration)", "icon": "img/toolbar/star.png", "type": Action.ADD_STAR, draggable: true, advanced: true },
  { "name": "Add start space", "icon": "img/toolbar/start.png", "type": Action.ADD_START, draggable: true, advanced: true },
  { "name": "Add arrow space", "icon": "img/toolbar/arrow.png", "type": Action.ADD_ARROW, draggable: true, advanced: true },
  { "spacer": true},
  { "name": "Add Millennium Star", "icon": "img/toolbar/mstar.png", "type": Action.ADD_TOAD_CHARACTER, draggable: true },
  { "name": "Add Boo", "icon": "img/toolbar/boo.png", "type": Action.ADD_BOO_CHARACTER, draggable: true },
  { "name": "Add bank", "icon": "img/toolbar/banksubtype.png", "type": Action.ADD_BANK_SUBTYPE, draggable: true },
  { "name": "Add bank coin stack", "icon": "img/toolbar/bankcoinsubtype.png", "type": Action.ADD_BANKCOIN_SUBTYPE, draggable: true },
  { "name": "Add item shop", "icon": "img/toolbar/itemshopsubtype.png", "type": Action.ADD_ITEMSHOP_SUBTYPE, draggable: true },
  { "name": "Mark space as hosting star", "icon": "img/toolbar/markstar.png", "type": Action.MARK_STAR },
  { "name": "Mark space as Skeleton Key gate", "icon": "img/toolbar/markgate.png", "type": Action.MARK_GATE },
];

const mp3_duel_actions: ToolbarItem[] = [
  { "name": "Move spaces", "icon": "img/toolbar/move.png", "type": Action.MOVE },
  { "name": "Connect spaces", "icon": "img/toolbar/line.png", "type": Action.LINE },
  { "name": "Connect multiple spaces in one click", "icon": "img/toolbar/stickyline.png", "type": Action.LINE_STICKY },
  { "name": "Erase spaces and lines", "icon": "img/toolbar/eraser.png", "type": Action.ERASE },
  { "spacer": true},
  { "name": "Add basic space", "icon": "img/toolbar/basic3.png", "type": Action.ADD_DUEL_BASIC, draggable: true },
  { "name": "Add Mini-Game space", "icon": "img/toolbar/minigameduel3.png", "type": Action.ADD_MINIGAME, draggable: true },
  { "name": "Add reverse space", "icon": "img/toolbar/reverse3.png", "type": Action.ADD_DUEL_REVERSE, draggable: true },
  { "name": "Add happening space", "icon": "img/toolbar/happeningduel3.png", "type": Action.ADD_HAPPENING, draggable: true },
  { "name": "Add Game Guy space", "icon": "img/toolbar/gameguyduel.png", "type": Action.ADD_GAMEGUY, draggable: true },
  { "name": "Add power-up space", "icon": "img/toolbar/powerup.png", "type": Action.ADD_DUEL_POWERUP, draggable: true },
  { "name": "Add invisible space", "icon": "img/toolbar/other.png", "type": Action.ADD_OTHER, draggable: true },
  { "name": "Add blue start space", "icon": "img/toolbar/startblue.png", "type": Action.ADD_DUEL_START_BLUE, draggable: true, advanced: true },
  { "name": "Add red start space", "icon": "img/toolbar/startred.png", "type": Action.ADD_DUEL_START_RED, draggable: true, advanced: true },
];

function _itemIsSpacer(item: ToolbarItem): item is IToolbarSpacer {
  return "spacer" in item && item.spacer;
}

function _getActions(gameVersion: number, boardType: BoardType) {
  let actions;
  switch (gameVersion) {
    case 1:
      actions = mp1_actions;
      break;
    case 2:
      actions = mp2_actions;
      break;
    case 3:
      if (boardType === BoardType.DUEL)
        actions = mp3_duel_actions;
      else
        actions = mp3_actions;
      break;
    default:
      throw `Unknown game version found by Toolbar (${gameVersion})`;
  }

  if (!get($setting.uiAdvanced)) {
    actions = actions.filter(a => !(a as IToolbarItem).advanced);
  }

  return actions;
}

function _buttonClicked(type: Action) {
  changeCurrentAction(type);
}

interface IToolbarProps {
  currentAction: Action;
  gameVersion: number;
  boardType: BoardType;
}

export class Toolbar extends React.Component<IToolbarProps> {
  state = {}

  render() {
    if (currentBoardIsROM()) {
      return (
        <div className="toolbarReadonly">Board is readonly.</div>
      );
    }

    let i = 0;
    let actions = _getActions(this.props.gameVersion, this.props.boardType);
    let actionElements = actions.map(item => {
      // if (item.group) {
      //   return (
      //     <ToolbarGroup key={item.group} icon={item.icon} actions={item.actions} currentAction={this.props.currentAction} />
      //   )
      // }

      if (_itemIsSpacer(item)) {
        return (
          <ToolbarSpacer key={"spacer" + i++} />
        );
      }

      let isCurrentAction = this.props.currentAction === item.type;
      return (
        <ToolbarButton key={item.type} current={isCurrentAction} action={item} />
      );
    });
    return (
      <div className="toolbar" role="toolbar">
        {actionElements}
      </div>
    );
  }
};

// const ToolbarGroup = class ToolbarGroup extends React.Component {
//   render() {
//     var btnClass = "toolbarGroup";
//     var icon;
//     var actions = this.props.actions.map(item => {
//       if (item.type === this.props.currentAction)
//         icon = item.icon;
//       var isCurrentAction = this.props.currentAction === item.type;
//       return (
//         <ToolbarButton key={item.type} action={item} current={isCurrentAction} />
//       );
//     });
//     if (icon)
//       btnClass += " selected"; // Select the group if one of its actions is selected.
//     else
//       icon = this.props.icon;
//     var left = actions.length * -50;
//     var maxWidth = actions.length * 50;
//     if (actions.length >= 5) {
//       left /= 2;
//       maxWidth /= 2;
//     }
//     var panelStyle = { left: left, maxWidth: maxWidth };
//     return (
//       <div className={btnClass} title={this.props.group} role="button" tabIndex="0">
//         <img className="toolbarIcon" src={icon}></img>
//         <div className="toolbarGroupPanel" style={panelStyle}>
//           {actions}
//         </div>
//       </div>
//     );
//   }
// };

interface IToolbarButtonProps {
  action: IToolbarItem;
  current: boolean;
}

class ToolbarButton extends React.Component<IToolbarButtonProps> {
  handleClick = () => {
    _buttonClicked(this.props.action.type);
  }

  onDragStart = (event: any) => {
    if (!this.props.action.draggable)
      return; // Disobeying draggable? Its more likely than you think!

    // Drag-drop is not really recommended, but user testing found it intuitive.
    event.dataTransfer.setData("text", JSON.stringify({
      action: this.props.action
    }));
  }

  render() {
    let btnClass = "toolbarButton";
    if (this.props.current)
      btnClass += " selected";
    let onKeyDown = makeKeyClick(this.handleClick, this);
    return (
      <div className={btnClass} title={this.props.action.name}
        role="button" tabIndex={0}
        onClick={this.handleClick} onKeyDown={onKeyDown}
        draggable={this.props.action.draggable} onDragStart={this.onDragStart}>
        <img className="toolbarIcon" src={this.props.action.icon}></img>
      </div>
    );
  }
};

const ToolbarSpacer = class ToolbarSpacer extends React.Component {
  render() {
    return (
      <div className="toolbarSpacer" role="separator"></div>
    );
  }
};
