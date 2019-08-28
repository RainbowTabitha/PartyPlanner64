import * as React from "react";
import { useState } from "react";

import "../css/blocker.scss";

import pencilImage from "../img/pencil.png";
import logoloadingImage from "../img/logoloading.png";
import { makeKeyClick } from "../utils/react";

interface IBlockerProps {
  message: string;
  messageHTML: string;
  prompt: boolean;
  onAccept(value?: string): void;
  onCancel(): void;
  onForceClose(): void;
}

/** Covers the screen, to block the UI or show a message/prompt. */
export const Blocker: React.FC<IBlockerProps> = (props: IBlockerProps) => {
  const [promptValue, setPromptValue] = useState<string>("");

  let content;
  if (props.message || props.messageHTML) {
    let messageSpan;
    if (props.message) {
      messageSpan = (
        <span className="loadingMsgTxt selectable">
          {props.message}
        </span>
      );
    }
    else { // messageHTML
      messageSpan = (
        <span className="loadingMsgTxt selectable"
          dangerouslySetInnerHTML={{ __html: props.messageHTML }}></span>
      );
    }

    let prompt;
    if (props.prompt) {
      prompt = <input className="blockerPromptInput"
        autoFocus
        value={promptValue}
        onChange={e => setPromptValue(e.target.value)}
        onKeyDown={makeKeyClick(e =>
          props.onAccept(promptValue), { enter: true })}/>
    }

    content = (
      <div className="loadingMsg">
        {messageSpan}
        <br /><br />
        {props.prompt && <>
          {prompt}
          <br /><br />
        </>}
        <button autoFocus={!props.prompt}
          onClick={() => props.onAccept(promptValue)}>
          OK
        </button>
        {props.prompt
          && <button onClick={() => props.onCancel()}>
            Cancel
          </button>}
      </div>
    );
  }
  else {
    content = (
      <img className="loadingGif swing" src={pencilImage} alt="Loading" />
    );
  }

  return (
    <div className="loading">
      <div className="loadingEscapeBackDoor"
        onClick={props.onForceClose}></div>
      <img className="loadingLogo" src={logoloadingImage} alt="Loading" />
      <br />
      {content}
    </div>
  );
};
