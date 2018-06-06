// This used to be a toolbar... now it is the toolbox contents.
PP64.toolbar = (function() {
  const mp1_actions = [
    { "name": "Move spaces", "icon": "img/toolbar/move.png", "type": $actType.MOVE },
    { "name": "Connect spaces", "icon": "img/toolbar/line.png", "type": $actType.LINE },
    { "name": "Connect multiple spaces in one click", "icon": "img/toolbar/stickyline.png", "type": $actType.LINE_STICKY },
    { "name": "Erase spaces and lines", "icon": "img/toolbar/eraser.png", "type": $actType.ERASE },
    { "spacer": true},
    { "name": "Add blue space", "icon": "img/toolbar/blue.png", "type": $actType.ADD_BLUE, draggable: true },
    { "name": "Add red space", "icon": "img/toolbar/red.png", "type": $actType.ADD_RED, draggable: true },
    { "name": "Add happening space", "icon": "img/toolbar/happening.png", "type": $actType.ADD_HAPPENING, draggable: true },
    { "name": "Add chance time space", "icon": "img/toolbar/chance.png", "type": $actType.ADD_CHANCE, draggable: true },
    { "name": "Add Bowser space", "icon": "img/toolbar/bowser.png", "type": $actType.ADD_BOWSER, draggable: true },
    { "name": "Add Mini-Game space", "icon": "img/toolbar/minigame.png", "type": $actType.ADD_MINIGAME, draggable: true },
    { "name": "Add shroom space", "icon": "img/toolbar/shroom.png", "type": $actType.ADD_SHROOM, draggable: true },
    { "name": "Add invisible space", "icon": "img/toolbar/other.png", "type": $actType.ADD_OTHER, draggable: true },
    { "name": "Add star space (decoration)", "icon": "img/toolbar/star.png", "type": $actType.ADD_STAR, draggable: true, advanced: true },
    { "name": "Add start space", "icon": "img/toolbar/start.png", "type": $actType.ADD_START, draggable: true, advanced: true },
    { "spacer": true},
    // {
    //   "group": "Other spaces",
    //   "icon": "img/toolbar/other.png",
    //   "actions": [
        { "name": "Add Toad", "icon": "img/toolbar/toad.png", "type": $actType.ADD_TOAD_CHARACTER, draggable: true },
        { "name": "Add Boo", "icon": "img/toolbar/boo.png", "type": $actType.ADD_BOO_CHARACTER, draggable: true },
        { "name": "Add Bowser", "icon": "img/toolbar/bowsercharacter.png", "type": $actType.ADD_BOWSER_CHARACTER, draggable: true },
        { "name": "Add Koopa Troopa", "icon": "img/toolbar/koopa.png", "type": $actType.ADD_KOOPA_CHARACTER, draggable: true },
        { "name": "Mark space as hosting star", "icon": "img/toolbar/markstar.png", "type": $actType.MARK_STAR },
    //   ]
    // }
  ];

  const mp2_actions = [
    { "name": "Move spaces", "icon": "img/toolbar/move.png", "type": $actType.MOVE },
    { "name": "Connect spaces", "icon": "img/toolbar/line.png", "type": $actType.LINE },
    { "name": "Connect multiple spaces in one click", "icon": "img/toolbar/stickyline.png", "type": $actType.LINE_STICKY },
    { "name": "Erase spaces and lines", "icon": "img/toolbar/eraser.png", "type": $actType.ERASE },
    { "spacer": true},
    { "name": "Add blue space", "icon": "img/toolbar/blue.png", "type": $actType.ADD_BLUE, draggable: true },
    { "name": "Add red space", "icon": "img/toolbar/red.png", "type": $actType.ADD_RED, draggable: true },
    { "name": "Add happening space", "icon": "img/toolbar/happening.png", "type": $actType.ADD_HAPPENING, draggable: true },
    { "name": "Add chance time space", "icon": "img/toolbar/chance2.png", "type": $actType.ADD_CHANCE, draggable: true },
    { "name": "Add Bowser space", "icon": "img/toolbar/bowser.png", "type": $actType.ADD_BOWSER, draggable: true },
    { "name": "Add item space", "icon": "img/toolbar/item.png", "type": $actType.ADD_ITEM, draggable: true },
    { "name": "Add battle space", "icon": "img/toolbar/battle.png", "type": $actType.ADD_BATTLE, draggable: true },
    { "name": "Add bank space", "icon": "img/toolbar/bank.png", "type": $actType.ADD_BANK, draggable: true },
    { "name": "Add invisible space", "icon": "img/toolbar/other.png", "type": $actType.ADD_OTHER, draggable: true },
    { "name": "Add star space (decoration)", "icon": "img/toolbar/star.png", "type": $actType.ADD_STAR, draggable: true, advanced: true },
    { "name": "Add black star space (decoration)", "icon": "img/toolbar/blackstar.png", "type": $actType.ADD_BLACKSTAR, draggable: true, advanced: true },
    { "name": "Add start space", "icon": "img/toolbar/start.png", "type": $actType.ADD_START, draggable: true, advanced: true },
    { "name": "Add arrow space", "icon": "img/toolbar/arrow.png", "type": $actType.ADD_ARROW, draggable: true, advanced: true },
    { "spacer": true},
    { "name": "Add Toad", "icon": "img/toolbar/toad.png", "type": $actType.ADD_TOAD_CHARACTER, draggable: true },
    { "name": "Add Boo", "icon": "img/toolbar/boo.png", "type": $actType.ADD_BOO_CHARACTER, draggable: true },
    { "name": "Add bank", "icon": "img/toolbar/banksubtype2.png", "type": $actType.ADD_BANK_SUBTYPE, draggable: true },
    { "name": "Add bank coin stack", "icon": "img/toolbar/bankcoinsubtype.png", "type": $actType.ADD_BANKCOIN_SUBTYPE, draggable: true },
    { "name": "Add item shop", "icon": "img/toolbar/itemshopsubtype2.png", "type": $actType.ADD_ITEMSHOP_SUBTYPE, draggable: true },
    { "name": "Mark space as hosting star", "icon": "img/toolbar/markstar.png", "type": $actType.MARK_STAR },
  ];

  const mp3_actions = [
    { "name": "Move spaces", "icon": "img/toolbar/move.png", "type": $actType.MOVE },
    { "name": "Connect spaces", "icon": "img/toolbar/line.png", "type": $actType.LINE },
    { "name": "Connect multiple spaces in one click", "icon": "img/toolbar/stickyline.png", "type": $actType.LINE_STICKY },
    { "name": "Erase spaces and lines", "icon": "img/toolbar/eraser.png", "type": $actType.ERASE },
    { "spacer": true},
    { "name": "Add blue space", "icon": "img/toolbar/blue3.png", "type": $actType.ADD_BLUE, draggable: true },
    { "name": "Add red space", "icon": "img/toolbar/red3.png", "type": $actType.ADD_RED, draggable: true },
    { "name": "Add happening space", "icon": "img/toolbar/happening3.png", "type": $actType.ADD_HAPPENING, draggable: true },
    { "name": "Add chance time space", "icon": "img/toolbar/chance3.png", "type": $actType.ADD_CHANCE, draggable: true },
    { "name": "Add Bowser space", "icon": "img/toolbar/bowser3.png", "type": $actType.ADD_BOWSER, draggable: true },
    { "name": "Add item space", "icon": "img/toolbar/item3.png", "type": $actType.ADD_ITEM, draggable: true },
    { "name": "Add battle space", "icon": "img/toolbar/battle3.png", "type": $actType.ADD_BATTLE, draggable: true },
    { "name": "Add bank space", "icon": "img/toolbar/bank3.png", "type": $actType.ADD_BANK, draggable: true },
    { "name": "Add Game Guy space", "icon": "img/toolbar/gameguy.png", "type": $actType.ADD_GAMEGUY, draggable: true },
    { "name": "Add invisible space", "icon": "img/toolbar/other.png", "type": $actType.ADD_OTHER, draggable: true },
    { "name": "Add star space (decoration)", "icon": "img/toolbar/star.png", "type": $actType.ADD_STAR, draggable: true, advanced: true },
    { "name": "Add start space", "icon": "img/toolbar/start.png", "type": $actType.ADD_START, draggable: true, advanced: true },
    { "name": "Add arrow space", "icon": "img/toolbar/arrow.png", "type": $actType.ADD_ARROW, draggable: true, advanced: true },
    { "spacer": true},
    { "name": "Add Millennium Star", "icon": "img/toolbar/mstar.png", "type": $actType.ADD_TOAD_CHARACTER, draggable: true },
    { "name": "Add Boo", "icon": "img/toolbar/boo.png", "type": $actType.ADD_BOO_CHARACTER, draggable: true },
    { "name": "Add bank", "icon": "img/toolbar/banksubtype.png", "type": $actType.ADD_BANK_SUBTYPE, draggable: true },
    { "name": "Add bank coin stack", "icon": "img/toolbar/bankcoinsubtype.png", "type": $actType.ADD_BANKCOIN_SUBTYPE, draggable: true },
    { "name": "Add item shop", "icon": "img/toolbar/itemshopsubtype.png", "type": $actType.ADD_ITEMSHOP_SUBTYPE, draggable: true },
    { "name": "Mark space as hosting star", "icon": "img/toolbar/markstar.png", "type": $actType.MARK_STAR },
    { "name": "Mark space as Skeleton Key gate", "icon": "img/toolbar/markgate.png", "type": $actType.MARK_GATE },
  ];

  function _getActions(gameVersion) {
    let actions;
    switch (gameVersion) {
      case 1:
        actions = mp1_actions;
        break;
      case 2:
        actions = mp2_actions;
        break;
      case 3:
        actions = mp3_actions;
        break;
      default:
        throw `Unknown game version found by Toolbar (${gameVersion})`;
    }

    if (!PP64.settings.get($setting.uiAdvanced)) {
      actions = actions.filter(a => !a.advanced);
    }

    return actions;
  }

  function _buttonClicked(type) {
    PP64.app.changeCurrentAction(type);
  }

  const Toolbar = class Toolbar extends React.Component {
    state = {}

    render() {
      if (PP64.boards.currentBoardIsROM()) {
        return (
          <div className="toolbarReadonly">Board is readonly.</div>
        );
      }

      let i = 0;
      let actions = _getActions(this.props.gameVersion);
      actions = actions.map(item => {
        if (item.group) {
          return (
            <ToolbarGroup key={item.group} icon={item.icon} actions={item.actions} currentAction={this.props.currentAction} />
          )
        }

        if (item.spacer) {
          return (
            <ToolbarSpacer key={"spacer" + i} />
          );
        }

        let isCurrentAction = this.props.currentAction === item.type;
        return (
          <ToolbarButton key={item.type} current={isCurrentAction} action={item} index={i++} />
        );
      });
      return (
        <div className="toolbar" role="toolbar">
          {actions}
        </div>
      );
    }
  };

  const ToolbarGroup = class ToolbarGroup extends React.Component {
    render() {
      var btnClass = "toolbarGroup";
      var icon;
      var actions = this.props.actions.map(item => {
        if (item.type === this.props.currentAction)
          icon = item.icon;
        var isCurrentAction = this.props.currentAction === item.type;
        return (
          <ToolbarButton key={item.type} action={item} current={isCurrentAction} />
        );
      });
      if (icon)
        btnClass += " selected"; // Select the group if one of its actions is selected.
      else
        icon = this.props.icon;
      var left = actions.length * -50;
      var maxWidth = actions.length * 50;
      if (actions.length >= 5) {
        left /= 2;
        maxWidth /= 2;
      }
      var panelStyle = { left: left, maxWidth: maxWidth };
      return (
        <div className={btnClass} title={this.props.group} role="button" tabIndex="0">
          <img className="toolbarIcon" src={icon}></img>
          <div className="toolbarGroupPanel" style={panelStyle}>
            {actions}
          </div>
        </div>
      );
    }
  };

  const ToolbarButton = class ToolbarButton extends React.Component {
    handleClick = () => {
      _buttonClicked(this.props.action.type);
    }

    onDragStart = (event) => {
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
      let onKeyDown = PP64.utils.react.makeKeyClick(this.handleClick, this);
      return (
        <div className={btnClass} title={this.props.action.name} role="button" tabIndex="0"
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

  return {
    Toolbar
  };
})();
