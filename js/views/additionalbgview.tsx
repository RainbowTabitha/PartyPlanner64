import * as React from "react";
import { CodeMirrorWrapper } from "../components/codemirrorwrapper";
import { showMessage } from "../appControl";
import { IBoard } from "../boards";
import { prepAdditionalBgAsm } from "../events/prepAdditionalBgAsm";
import { prepGenericAsm } from "../events/prepAsm";
import { Game, getGameName } from "../types";
import { assemble } from "mips-assembler";
import { $$log } from "../utils/debug";
import { defaultAdditionalBgAsm } from "../events/additionalbg";

let _viewInstance: AdditionalBgView | null = null;

interface IAdditionalBgViewProps {
  board: IBoard;
}

interface IAdditionalBgViewState {
  asm: string;
}

export class AdditionalBgView extends React.Component<IAdditionalBgViewProps, IAdditionalBgViewState> {
  constructor(props: IAdditionalBgViewProps) {
    super(props);

    const currentCode = this.props.board.additionalbgcode;
    if (currentCode) {
      this.state = {
        asm: currentCode,
      };
    }
    else {
      this.state = {
        asm: defaultAdditionalBgAsm,
      };
    }
  }

  render() {
    return (
      <div className="additionalBgViewContainer">
        <h2>Additional Background Configuration</h2>
        <CodeMirrorWrapper
          className="eventcodemirror additionalbgcodemirror"
          value={this.state.asm}
          onChange={this.onAsmChange} />
      </div>
    );
  }

  componentDidMount() {
    _viewInstance = this;
  }

  componentWillUnmount() {
    _viewInstance = null;
  }

  onAsmChange = (asm: string) => {
    this.setState({ asm });
  }

  getAsm = () => {
    return this.state.asm;
  }

  getBoard = () => {
    return this.props.board;
  }

  promptExit = () => {
    const asm = this.state.asm;
    const oldAsm = this.props.board.additionalbgcode;
    if (oldAsm !== asm || (!oldAsm && asm === defaultAdditionalBgAsm)) {
      return !!window.confirm("Are you sure you want to exit without saving your code?");
    }
    return true;
  }
}

export function saveAdditionalBgCode() {
  const asm = _viewInstance!.getAsm();
  const board =  _viewInstance!.getBoard();

  if (!asm) {
    showMessage("Assembly code must be provided.");
    return;
  }

  const asmWithBgSyms = prepAdditionalBgAsm(asm, 0, makeFakeBgSyms(board));

  let failures: string[] = [];
  const possibleGameVersions = getGameVersionsToTestCompile(board);
  possibleGameVersions.forEach(game => {
    try {
      const preppedAsm = prepGenericAsm(asmWithBgSyms, 0x80000000, game);
      $$log(preppedAsm);
      assemble(preppedAsm);
    }
    catch (e) {
      failures.push(`Failed test assembly for ${getGameName(game)}:
${e.toString()}
`);
    }
  });

  if (failures.length === possibleGameVersions.length) {
    showMessage(`All possible target game versions failed to assemble.\n${failures.join("\n")}`);
    return;
  }

  if (asm === defaultAdditionalBgAsm) {
    delete board.additionalbgcode;
  }
  else {
    board.additionalbgcode = asm;
  }
}

export function additionalBgViewPromptExit() {
  if (_viewInstance) {
    return _viewInstance.promptExit();
  }
}

function makeFakeBgSyms(board: IBoard): number[] {
  if (!board.additionalbg)
    return [];

  let i = 0;
  return board.additionalbg.map(bg => ++i);
}

function getGameVersionsToTestCompile(board: IBoard): Game[] {
  switch (board.game) {
    case 1:
      return [Game.MP1_USA, Game.MP1_PAL, Game.MP1_JPN];
    case 2:
      return [Game.MP2_USA, Game.MP2_PAL, Game.MP2_JPN];
    case 3:
      return [Game.MP3_USA, Game.MP3_PAL, Game.MP3_JPN];
  }
}