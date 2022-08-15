/**
 * @file Updates the symbols subrepository and regenerates the symbols used by
 * the editor.
 */

const exec = require("child_process").exec;
const fs = require("fs");
const path = require("path");

const SYMBOLS_DIR = "symbols";

exec("git submodule update --remote", (err, stdout, stderr) => {
  if (err || stderr) {
    process.stderr.write(
      "Error updating symbols repository! " + err + ", " + stderr
    );
  } else {
    console.log("Updating symbols repository...");
  }

  fs.readdir(SYMBOLS_DIR, (err, files) => {
    if (err) {
      console.error("Could not read the symbols directory");
      process.exit(1);
    }

    files.forEach((file) => {
      if (!file.toLowerCase().endsWith(".sym")) {
        return;
      }

      const inputfile = path.join(SYMBOLS_DIR, file);
      fs.readFile(inputfile, "utf8", (err, contents) => {
        if (err) {
          console.error("Could not read symbol file: " + file);
          process.exit(1);
        }

        const symModule = convertSymbols(contents);
        const filename = path.basename(file);
        console.log("Writing " + filename + "...");

        const outputfile = path.join("src/symbols/", filename + ".js");
        fs.writeFile(outputfile, symModule, (err) => {
          if (err) {
            console.error("Could not write symbol file: " + file + ": " + err);
            process.exit(1);
          }
        });
      });
    });
  });
});

/** Creates a .sym.js module from a .sym file. */
function convertSymbols(text) {
  // Create an AMD module by hand. (Not .ts file because it will slow .ts type checks)
  const lines = text.split(/\r?\n/);
  let output = `export default [`;

  const objs = [];
  lines.forEach(function (line) {
    line = line.trim();
    if (!line) return;

    const pieces = line.split(",");
    if (pieces.length < 3) return;

    // Exclude iffy symbols
    const symName = pieces[2];
    if (symName.endsWith("?") || symName.startsWith("?")) return;

    let obj = `{
      addr: ${parseInt(pieces[0], 16)}, // 0x${pieces[0]}
      type: "${pieces[1]}",
      name: "${symName}"`;

    if (pieces[3]) {
      obj += `,
      desc: ${JSON.stringify(pieces[3])}`;
    }

    obj += " }";

    objs.push(obj);
  });

  output += objs.join(",\n");
  output += "\n];\n";

  return output;
}
