import cliArgs from "command-line-args";
import cliUsage from "command-line-usage";
import {
  setCreateCanvas,
  setCreateImage,
} from "../../packages/lib/utils/canvas";
import { createCanvasNode, createImageNode } from "./CanvasImpl";
import { version } from "./package.json";
import { overwrite, OverwriteOptions } from "./commands/overwrite";
import "../../packages/lib/events/builtin/events.include";

setCreateCanvas(createCanvasNode);
setCreateImage(createImageNode);

const mainDefinitions = [{ name: "command", defaultOption: true }];
const mainOptions = cliArgs(mainDefinitions, { stopAtFirstUnknown: true });
const argv = mainOptions._unknown || [];

const startBanner = "PartyPlanner64 v" + version;

const mainHelpSections: cliUsage.Section[] = [
  {
    header: startBanner,
    content: "Mario Party board editor CLI interface",
  },
  {
    header: "Synopsis",
    content: "$ app <command> <options>",
  },
  {
    header: "Command List",
    content: [
      {
        name: "overwrite",
        summary: "Overwrites a ROM board with a custom board file.",
      },
      {
        name: "help",
        summary: "Print this usage guide.",
      },
    ],
  },
];

(async () => {
  switch (mainOptions.command) {
    case "overwrite":
      {
        console.log(startBanner);
        const overwriteDefinitions = [
          { name: "rom-file", type: String },
          { name: "target-board-index", type: Number },
          { name: "board-file", type: String },
          { name: "output-file", type: String },
        ];
        const overwriteOptions = cliArgs(overwriteDefinitions, {
          argv,
          camelCase: true,
        }) as Partial<OverwriteOptions>;

        if (
          !overwriteOptions.romFile ||
          !overwriteOptions.boardFile ||
          !overwriteOptions.outputFile ||
          typeof overwriteOptions.targetBoardIndex !== "number"
        ) {
          console.error("Bad arguments");
          break;
        }
        console.log(
          `Overwriting board ${overwriteOptions.targetBoardIndex} in ${overwriteOptions.romFile} with ${overwriteOptions.boardFile}`
        );
        await overwrite(overwriteOptions as OverwriteOptions);
        console.log(`Wrote ${overwriteOptions.outputFile}`);
      }
      break;

    case "help":
      {
        outputMainUsage();
      }
      break;

    default:
      if (!mainOptions.command) {
        outputMainUsage();
      } else {
        console.error(`Unrecognized command: ${mainOptions.command}`);
      }
      break;
  }
})();

function outputMainUsage() {
  const usage = cliUsage(mainHelpSections);
  console.log(usage);
}
