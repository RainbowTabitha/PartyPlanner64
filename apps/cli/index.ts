import cliArgs from "command-line-args";
import { overwrite, OverwriteOptions } from "./commands/overwrite";

const mainDefinitions = [{ name: "command", defaultOption: true }];
const mainOptions = cliArgs(mainDefinitions, { stopAtFirstUnknown: true });
const argv = mainOptions._unknown || [];

switch (mainOptions.command) {
  case "overwrite":
    {
      const overwriteDefinitions = [
        { name: "rom-file", type: String },
        { name: "target-board-index", type: Number },
        { name: "board-file", type: String },
        { name: "output-file", type: String },
      ];
      const overwriteOptions = cliArgs(overwriteDefinitions, {
        argv,
        camelCase: true,
      });
      overwrite(overwriteOptions as OverwriteOptions);
    }
    break;

  default:
    console.error(`Unrecognized command: ${mainOptions.command}`);
    break;
}
