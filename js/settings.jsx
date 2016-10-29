
var $setting = {
  "uiAdvanced": "ui.advanced",
  "uiDebug": "ui.debug",
  "uiSkipValidation": "ui.skipvalidation",
  "uiAllowAllRoms": "ui.allowallroms",
  "writeBranding": "write.branding",
  "writeDecompressed": "write.decompressed",
};

PP64.settings = (function() {
  const _settings = [
    { name: "UI", type: "section" },
    { id: "ui.advanced", type: "checkbox", "default": false, name: "Advanced features",
      desc: "Enables infrequently used, potentially complicated, and developer features." },
    { id: "ui.debug", type: "checkbox", "default": $$debug, name: "Debug features", advanced: true,
      desc: "Enables debug output and UI that may aid development." },
    { id: "ui.skipvalidation", type: "checkbox", "default": false, name: "Skip Overwrite Validation", advanced: true,
      desc: "Allow all boards to be written regardless of warnings." },
    { id: "ui.allowallroms", type: "checkbox", "default": false, name: "Allow All ROMs", advanced: true,
      desc: "Allows more than just the officially supported ROMs to attempt to load." },
    { name: "ROM", type: "section" },
    { id: "write.branding", type: "checkbox", "default": true, name: "Include branding",
      desc: "Adds the PartyPlanner64 logo to the game boot splashscreens." },
    { id: "write.decompressed", type: "checkbox", "default": false, name: "Leave ROM decompressed", advanced: true,
      desc: "Leaves all files decompressed when saving a ROM, resulting in larger file size." },
  ];
  function _getSetting(id) {
    return _settings.find((setting) => {
      return setting.id === id;
    });
  }
  function _getSettingDefault(id) {
    return _getSetting(id)["default"];
  }

  class SettingsManager {
    constructor() {
      Cookies.defaults = {
        expires: Infinity
      };

      this._tempSettings = {};
    }
    getSetting(name) {
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

    setSetting(name, value) {
      if (!Cookies.enabled) {
        this._tempSettings[name] = value;
        return;
      }

      Cookies.set(name, JSON.stringify(value));
    }

    reset() {
      _settings.forEach((setting) => {
        if (setting.id)
          Cookies.expire(setting.id);
      });
    }
  }
  const _settingsManager = new SettingsManager();

  $$debug = _settingsManager.getSetting($setting.uiDebug);

  function _getValue(id) {
    if (id)
      return _settingsManager.getSetting(id);
    return "";
  }

  function _setValue(id, value) {
    _settingsManager.setSetting(id, value);
    if (id === "ui.debug") {
      $$debug = value;
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

  let Settings = class Settings extends React.Component {
    state = {}

    render() {
      let formEls = _getEffectiveSettings().map(setting => {
        let i = 0;
        let value = _getValue(setting.id);
        switch (setting.type) {
          case "checkbox":
            return (
              <CheckboxSetting id={setting.id} name={setting.name}
                desc={setting.desc} key={setting.id} value={value}
                onCheckChanged={this.onCheckChanged} />
            );
            break;
          case "section":
            return (
              <h3 key={setting.name}>{setting.name}</h3>
            );
            break;
        }
      });
      return (
        <div id="settingsForm">
          <h2>Settings</h2>
          {formEls}
        </div>
      );
    }

    onCheckChanged = (id, value) => {
      _setValue(id, value);
      this.setState({ id: value }); // Trigger refresh
    }
  };

  let CheckboxSetting = class CheckboxSetting extends React.Component {
    state = {}

    render() {
      let mainId = this.props.id + "-main";
      let descId = this.props.id + "-desc";
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

  return {
    Settings,
    get: function(id) {
      return _settingsManager.getSetting(id);
    },
    set: function(id, value) {
      return _settingsManager.setSetting(id, value);
    }
  };
})();
