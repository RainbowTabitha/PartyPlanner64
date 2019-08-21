/**
 * @file Called to build/publish the electron app.
 */

const fs = require("fs");
const spawn = require("child_process").spawn;

const args = process.argv.slice(2);
const doPublish = args[0] === "--publish";

if (doPublish) {
  console.log("Starting electron build + publish");
}
else {
  console.log("Starting electron build (no publish)");
}

function copyFile(src, dest, callback) {
  fs.copyFile(src, dest, err => {
    if (err) {
      console.error("Could not copy " + src + " to " + dest);
      process.exit(1);
    }

    callback();
  });
}

// Copy the electron.js into build/
const ELECTRON_JS_SRC = "src/electron.js";
const ELECTRON_JS_DEST = "build/electron.js";
copyFile(ELECTRON_JS_SRC, ELECTRON_JS_DEST, () => {

  // Copy the package.json into build/
  const PACKAGE_JSON_SRC = "package.json";
  const PACKAGE_JSON_DEST = "build/package.json";
  copyFile(PACKAGE_JSON_SRC, PACKAGE_JSON_DEST, () => {

    // Spawn the build process.
    const task = doPublish ? "electron-builder-build-publish": "electron-builder-build";
    const electronBuild = spawn("npm", ["run", task]);
    electronBuild.stdout.on("data", function (data) {
      console.log(data.toString());
    });

    electronBuild.stderr.on("data", function (data) {
      console.log(data.toString());
    });

    electronBuild.on("exit", function (code) {
      console.log("child process exited with code " + code.toString());
    });
  });
});
