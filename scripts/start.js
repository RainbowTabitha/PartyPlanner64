/**
 * @file Called to start the PartyPlanner64 development server.
 */

const getVersion = require("./version").getVersion;
const spawn = require("child_process").spawn;

getVersion(version => {
  process.env.REACT_APP_PP64_VERSION = version;

  const reactAppStart = spawn("npm", ["run", "react-start"]);
  reactAppStart.stdout.on("data", function (data) {
    console.log(data.toString());
  });

  reactAppStart.stderr.on("data", function (data) {
    console.log(data.toString());
  });

  reactAppStart.on("exit", function (code) {
    console.log("child process exited with code " + code.toString());
  });
});
