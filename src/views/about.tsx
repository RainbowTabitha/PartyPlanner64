import * as React from "react";
import { isElectron } from "../utils/electron";

import logoloadingImage from "../img/logoloading.png";
import mpllogoImage from "../img/mpllogo.png";
import btcImage from "../img/about/btc.png";

/* eslint-disable no-script-url, jsx-a11y/anchor-is-valid */

const verRegex = /^(.+)-(\d*)-g([a-z0-9]+)$/;

export const About = class About extends React.Component {
  state = {
    updateCheckInProgress: false,
    foundUpdate: null, // true/false means we already searched.
  }

  render() {
    let versionNum = process.env.REACT_APP_PP64_VERSION; // Provided by build system.
    if (versionNum) {
      const matchResult = verRegex.exec(versionNum);
      if (matchResult && matchResult[0]) {
        versionNum = matchResult[1] + " (+" + matchResult[2] + " "
          + "<a target='_blank' href='https://github.com/PartyPlanner64/PartyPlanner64/commit/"
          + matchResult[3] + "'>" + matchResult[3] + "</a>)";
      }
    }
    else {
      versionNum = "unknown";
    }

    let mplText;
    if (document.location!.href.indexOf("mariopartylegacy") >= 0)
      mplText = "Hosted by"
    else
      mplText = "Visit";

    let electronUpdate = null;
    if (isElectron) {
      if (this.state.foundUpdate === true) {
        electronUpdate = (
          <a className="aboutVersion" onClick={this.onStartUpdateClick} href="javascript:;">
            {" "}
            Update found! Click to install.
          </a>
        );
      }
      else {
        electronUpdate = (
          <a className="aboutVersion" onClick={this.onCheckForUpdatesClick} href="javascript:;">
            {" "}
            {this.state.updateCheckInProgress ? "Checking..." : "Check for Updates"}
          </a>
        );
      }
    }

    return (
      <div id="aboutForm">
        <div className="aboutHeader">
          <img src={logoloadingImage} alt="PartyPlanner64" />
          <br />
          <span className="aboutVersion selectable">Version <span dangerouslySetInnerHTML={{__html: versionNum}}></span></span>
          {isElectron && <br />}
          {electronUpdate}
        </div>
        <br />
        <div className="aboutText">
          <span className="aboutTextLabel">Want more PartyPlanner64?</span>
          <ul>
            <li>Follow <a href="https://twitter.com/PartyPlanner64" target="_blank" rel="noopener noreferrer">@PartyPlanner64</a> on Twitter.</li>
            <li><a href="https://github.com/PartyPlanner64/PartyPlanner64" target="_blank" rel="noopener noreferrer">Contribute</a> to development on Github.</li>
            <li>Write or view <a href="https://github.com/PartyPlanner64/PartyPlanner64/issues" target="_blank" rel="noopener noreferrer">bugs and enhancement requests</a>.</li>
            <li>Read the <a href="https://github.com/PartyPlanner64/PartyPlanner64/wiki/Creating-a-Board" target="_blank" rel="noopener noreferrer">usage tutorial</a>
             or <a href="https://github.com/PartyPlanner64/PartyPlanner64/wiki" rel="noopener noreferrer">documentation</a>.</li>
          </ul>
        </div>
        <br />
        <br />
        <div className="aboutHeader">
          <span>{mplText}</span>
          <br />
          <a href="http://mariopartylegacy.com/" target="_blank" rel="noopener noreferrer"><img src={mpllogoImage} alt="Mario Party Legacy" /></a>
        </div>
        <div className="aboutText">
          <ul>
            <li>Check out discussion in the <a href="https://discord.gg/BQMuUpM" target="_blank" rel="noopener noreferrer">discord chat</a>.</li>
            <li>Post your creations to the <a href="http://www.mariopartylegacy.com/forum/index.php?action=downloads" target="_blank" rel="noopener noreferrer">downloads page</a>.</li>
          </ul>
        </div>
        <br />
        <br />
        <div className="aboutBtcBanner" title="Donate via Bitcoin">
          <a href="bitcoin:1N6xiKibCqoRAWmrYt3DZ7u8KLTPXxAA4E" target="_blank" rel="noopener noreferrer">
            <img className="aboutBtcImg" src={btcImage} height="32" width="32" alt="Bitcoin"></img>
          </a>
          <br />
          <span className="aboutBtcText selectable">1N6xiKibCqoRAWmrYt3DZ7u8KLTPXxAA4E</span>
        </div>
        <br />
        <br />
        <span className="aboutDisclaimer">PartyPlanner64 is not affiliated with Nintendo or Hudson.</span>
        <br />
        <span className="aboutDisclaimer">Mario Party is a registered trademark of Nintendo.</span>
      </div>
    );

    //<div className="aboutText">
        //  <span className="aboutTextLabel">Special thanks to these contributors!</span>
        //  <ul>
        //    <li>Luke</li>
        //    <li>Dominic</li>
        //  </ul>
        //</div>
  }

  componentDidMount() {
    if (isElectron) {
      const ipcRenderer = (window as any).require("electron").ipcRenderer;
      ipcRenderer.on("update-check-checking", this._onUpdateCheckStarted);
      ipcRenderer.on("update-check-noupdate", this._onUpdateCheckNoUpdate);
      ipcRenderer.on("update-check-hasupdate", this._onUpdateCheckHasUpdate);
    }
  }

  componentWillUnmount() {
    if (isElectron) {
      const ipcRenderer = (window as any).require("electron").ipcRenderer;
      ipcRenderer.removeListener("update-check-checking", this._onUpdateCheckStarted);
      ipcRenderer.removeListener("update-check-noupdate", this._onUpdateCheckNoUpdate);
      ipcRenderer.removeListener("update-check-hasupdate", this._onUpdateCheckHasUpdate);
    }
  }

  onCheckForUpdatesClick = () => {
    if (this.state.updateCheckInProgress) {
      return;
    }

    const ipcRenderer = (window as any).require("electron").ipcRenderer;
    ipcRenderer.send("update-check-start");
  }

  onStartUpdateClick = () => {
    const ipcRenderer = (window as any).require("electron").ipcRenderer;
    ipcRenderer.send("update-check-doupdate");
  }

  _onUpdateCheckStarted = () => {
    this.setState({
      updateCheckInProgress: true,
      foundUpdate: null,
    });
  }

  _onUpdateCheckNoUpdate = () => {
    this.setState({
      updateCheckInProgress: false,
      foundUpdate: false,
    });
  }

  _onUpdateCheckHasUpdate = () => {
    this.setState({
      updateCheckInProgress: false,
      foundUpdate: true,
    });
  }
}
