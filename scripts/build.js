/**
 * @file Called to build an optimized production copy.
 */

const getVersion = require("./version").getVersion;
const spawn = require("child_process").spawn;

getVersion(version => {
  process.env.REACT_APP_PP64_VERSION = version;

  const reactAppBuild = spawn("npm", ["run", "react-build"]);
  reactAppBuild.stdout.on("data", function (data) {
    console.log(data.toString());
  });

  reactAppBuild.stderr.on("data", function (data) {
    console.log(data.toString());
  });

  reactAppBuild.on("exit", function (code) {
    console.log("child process exited with code " + code.toString());
  });
});
