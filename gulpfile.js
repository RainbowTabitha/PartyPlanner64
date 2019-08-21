const gulp = require("gulp");

const exec = require('child_process').exec;
const runSequence = require("run-sequence");

require("dotenv").config();

gulp.task("clean", ["cleandist"]);

gulp.task("build", function(callback) {
  runSequence("clean", [
    "copyhtml",
    "copyimg",
    "copycss",
    "copycsslib",
    "copyfont",
    "webpack",
  ],
  "version",
  callback);
});
gulp.task("build-prod", function(callback) {
  runSequence("clean", [
    "copyhtml-prod",
    "copyimg-prod",
    "copycss-prod",
    "copycsslib",
    "webpack-prod",
  ],
  "version",
  callback);
});

gulp.task("copy-electron-boot", function() {
  return gulp.src("js/electron.js", { base: "./js" })
    .pipe(gulp.dest(DST_JS));
});

gulp.task("copy-electron-packagejson", function() {
  return gulp.src("package.json")
    .pipe(gulp.dest("dist"));
});

gulp.task("electron-package", function(callback) {
  runSequence("build", [
      "copy-electron-boot",
      "copy-electron-packagejson"
    ],
    "electron-build",
    callback
  );
});

gulp.task("electron-package-publish", function(callback) {
  runSequence("build", [
      "copy-electron-boot",
      "copy-electron-packagejson"
    ],
    "electron-build-publish",
    callback
  );
});

gulp.task("electron-build", function(callback) {
  exec("npm run electron", function(err, stdout, stderr) {
    process.stdout.write("electron-build done, " + err + ", " + stdout + ", " + stderr);
    callback();
  });
});

gulp.task("electron-build-publish", function(callback) {
  exec("npm run electron-publish", function(err, stdout, stderr) {
    process.stdout.write("electron-build + publish done, " + err + ", " + stdout + ", " + stderr);
    callback();
  });
});

gulp.task("publish", function(callback) {
  exec("git subtree push --prefix dist origin gh-pages", function(err, stdout, stderr) {
    // process.stdout.write("describe done, " + err + ", " + stdout + ", " + stderr);
    callback();
  });
});
