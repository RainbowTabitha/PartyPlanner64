import * as React from "react";
import * as Cookies from "cookies-js";
import { setDebug, isDebug } from "../debug";

import "../css/settings.scss";

export enum $setting {
  "uiAdvanced" = "ui.advanced",
  "uiDebug" = "ui.debug",
  "uiSkipValidation" = "ui.skipvalidation",
  "uiAllowAllRoms" = "ui.allowallroms",
  "uiShowRomBoards" = "ui.showromboards",
  "writeBranding" = "write.branding",
  "writeDecompressed" = "write.decompressed",
  "limitModelFPS" = "models.limitfps",
  "limitModelAnimations" = "models.limitAnimations",
  "modelUseGLB" = "models.useGLB",
};

interface ICheckboxSetting {
  name: string;
  type: "checkbox";
  id: string;
  default: boolean;
  desc: string;
  advanced?: boolean;
}

interface ISettingSection {
  name: string;
  type: "section";
  advanced?: boolean;
}

type ISetting = ISettingSection | ICheckboxSetting;

const _settings: ISetting[] = [
  { name: "UI", type: "section" },
  { id: "ui.advanced", type: "checkbox", "default": false, name: "Advanced features",
    desc: "Enables infrequently used, potentially complicated, and developer features." },
  { id: "ui.debug", type: "checkbox", "default": isDebug(), name: "Debug features", advanced: true,
    desc: "Enables debug output and UI that may aid development." },
  { id: "ui.skipvalidation", type: "checkbox", "default": false, name: "Skip Overwrite Validation", advanced: true,
    desc: "Allow boards to be written regardless of warnings." },
  { id: "ui.showromboards", type: "checkbox", "default": false, name: "Show ROM Boards", advanced: true,
    desc: "Show boards parsed from the ROM in the editor." },
  { id: "ui.allowallroms", type: "checkbox", "default": false, name: "Allow All ROMs", advanced: true,
    desc: "Allows more than just the officially supported ROMs to attempt to load." },
  { name: "ROM", type: "section" },
  { id: "write.branding", type: "checkbox", "default": true, name: "Include branding",
    desc: "Adds the PartyPlanner64 logo to the game boot splashscreens." },
  { id: "write.decompressed", type: "checkbox", "default": false, name: "Leave ROM decompressed", advanced: true,
    desc: "Leaves all files decompressed when saving a ROM, resulting in larger file size." },
  { name: "Model Viewer", type: "section" },
  { id: "models.limitfps", type: "checkbox", "default": true, name: "Limit FPS",
    desc: "Reduce the refresh rate for better performance." },
  { id: "models.limitAnimations", type: "checkbox", "default": true, name: "Limit animations",
    desc: "Limit animations to those in the same directory as the model." },
  { id: "models.useGLB", type: "checkbox", "default": false, name: "Use GLB container for glTF",
    desc: "Create a GLB container when exporting models to glTF." },
];
function _getSetting(id: string) {
  return _settings.find((setting) => {
    if (setting.type === "section")
      return false;
    return setting.id === id;
  });
}
function _getSettingDefault(id: string) {
  const setting = _getSetting(id);
  if (setting && setting.type !== "section")
    return setting.default;
}

class SettingsManager {
  private _tempSettings: { [settingName: string]: any };

  constructor() {
    (Cookies as any).defaults = {
      expires: Infinity
    };

    this._tempSettings = {};
  }
  getSetting(name: string) {
    if (!Cookies.enabled) {
      // Allow changing settings for at least the session without cookies.
      if (this._tempSettings.hasOwnProperty(name))
        return this._tempSettings[name];
      return this._tempSettings[name] = _getSettingDefault(name);
    }

    let val = Cookies.get(name);
    if (val === undefined) // Never set, use default.
      return _getSettingDefault(name);
    return JSON.parse(val);
  }

  setSetting(name: string, value: any) {
    if (!Cookies.enabled) {
      this._tempSettings[name] = value;
      return;
    }

    Cookies.set(name, JSON.stringify(value));
  }

  reset() {
    _settings.forEach((setting) => {
      if (setting.type === "section")
        return;
      if (setting.id)
        Cookies.expire(setting.id);
    });
  }
}
const _settingsManager = new SettingsManager();

setDebug(_settingsManager.getSetting($setting.uiDebug));

function _getValue(id?: string) {
  if (id)
    return _settingsManager.getSetting(id);
  return "";
}

function _setValue(id: string, value: any) {
  _settingsManager.setSetting(id, value);
  if (id === "ui.debug") {
    setDebug(value);
  }
}

function _getEffectiveSettings() {
  let settings = _settings;
  if (!_settingsManager.getSetting($setting.uiAdvanced)) {
    settings = settings.filter((setting) => {
      return !setting.advanced;
    });
  }
  return settings;
}

export const Settings = class Settings extends React.Component {
  state = {}

  render() {
    let formEls = _getEffectiveSettings().map(setting => {
      switch (setting.type) {
        case "checkbox":
          let value = _getValue(setting.id);
          return (
            <CheckboxSetting id={setting.id!} name={setting.name}
              desc={setting.desc!} key={setting.id} value={value}
              onCheckChanged={this.onCheckChanged} />
          );
        case "section":
          return (
            <h3 key={setting.name}>{setting.name}</h3>
          );
      }
      throw new Error("Unrecognized setting type");
    });
    return (
      <div id="settingsForm">
        <h2>Settings</h2>
        {formEls}
      </div>
    );
  }

  onCheckChanged = (id: string, value: any) => {
    _setValue(id, value);
    this.setState({ id: value }); // Trigger refresh
  }
};

interface CheckboxSettingProps {
  id: string;
  value: boolean;
  name: string;
  desc: string;
  onCheckChanged: (id: string, value: boolean) => any;
}

const CheckboxSetting = class CheckboxSetting extends React.Component<CheckboxSettingProps> {
  state = {}

  render() {
    const mainId = this.props.id + "-main";
    const descId = this.props.id + "-desc";
    return (
      <div className="checkboxSetting" onClick={this.onToggled}>
        <input type="checkbox" className="checkboxSettingChk"
          checked={this.props.value} onChange={this.onToggled}
          aria-labelledby={mainId} aria-describedby={descId}></input>
        <div className="checkboxSettingLines">
          <span id={mainId} className="checkboxSettingMain">{this.props.name}</span>
          <br />
          <span id={descId} className="checkboxSettingDesc">{this.props.desc}</span>
        </div>
      </div>
    );
  }

  onToggled = () => {
    this.props.onCheckChanged(this.props.id, !this.props.value);
  }
};

export function get(id: $setting) {
  return _settingsManager.getSetting(id);
}
export function set(id: $setting, value: any) {
  return _settingsManager.setSetting(id, value);
}
