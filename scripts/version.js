const exec = require("child_process").exec;

/** Utility function to get the PP64 version from git. */
exports.getVersion = function getVersion(callback) {
  exec("git describe --tags --long --always", function (err, stdout, stderr) {
    // process.stdout.write("describe done, " + err + ", " + stdout + ", " + stderr);
    if (err || stderr) {
      console.error("Failed to get version from git: " + err + ", " + stderr);
      process.exit(1);
    }

    const versionNum = stdout.trim();
    callback(versionNum);
  });
};
