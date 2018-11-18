const gulp = require("gulp");

const cache = require("gulp-cached");
const cleanCSS = require('gulp-clean-css');
const concat = require("gulp-concat");
const del = require("del");
const order = require('gulp-order');
const preprocess = require('gulp-preprocess');
const rename = require("gulp-rename");
const replace = require('gulp-replace');
const sass = require("gulp-sass");
const textTransformation = require("gulp-text-simple");
const typescript = require("gulp-typescript");

const exec = require('child_process').exec;
const fs = require("fs");
const runSequence = require("run-sequence");

require("dotenv").config();

const packageJson = JSON.parse(fs.readFileSync("./package.json"));

const DST_JS = "dist/js";

const SRC_TS = ["js/**/*.ts", "js/**/*.tsx"];

const CSS = [
  "css/normalize.css",
  "css/index.css",
  "css/interaction.css",
  "css/boardmenu.css",
  "css/newboard.css",
  "css/screenshot.css",
  "css/header.css",
  "css/texteditor.css",
  "css/toolwindow.css",
  "css/toolbar.css",
  "css/properties.css",
  "css/notifications.css",
  "css/details.css",
  "css/settings.css",
  "css/about.css",
  "css/models.css",
  "css/events.css",
  "css/createevent.css",
  "css/strings.css",
  "css/patches.css",
  // css/fonts.css is not included in prod
];
function MAKE_CSS_ORDER(css) {
  var output = [];
  for (var i = 0; i < css.length; i++) {
    var pieces = css[i].split("/");
    output.push("**/" + pieces[pieces.length - 1]);
  }
  return output;
}
const ORDER_PROD_CSS = MAKE_CSS_ORDER(CSS);
const SRC_CSS = ["css/**/*.css", "css/*.scss"];
const SRC_PROD_CSS = ["!css/font.css", "css/**/*.css", "css/*.scss"];
const DST_CSS = "dist/css";

const CSS_LIB_DEST = "css/lib";

function GET_LIB_FILE(lib) {
  return lib.dst;
}

const LIB_CSS = [
  { src: "node_modules/draft-js/dist/Draft.css",
    dst: "Draft.css"
  },
  { src: "node_modules/basiccontext/dist/basicContext.min.css",
    dst: "basicContext.min.css"
  },
  { src: "node_modules/basiccontext/dist/themes/default.min.css",
    dst: "default.min.css"
  },
  { src: "node_modules/codemirror/lib/codemirror.css",
    dst: "codemirror.css"
  },
  { src: "node_modules/codemirror/addon/hint/show-hint.css",
    dst: "codemirror-show-hint.css"
  },
];

const SRC_HTML = "*.html";
const DST_HTML = "dist/*.html";

const SRC_IMG = ["img/**/*.png", "img/**/*.gif", "img/**/*.ico", "img/**/*.cur"];
const DST_IMG = "dist/img";

const SRC_FONT = ["css/fonts/*"];
const DST_FONT = "dist/css/fonts";

gulp.task("cleandist", function() {
  return del(["dist"]);
});

gulp.task("copyhtml", function() {
  var CSSLIB = LIB_CSS.map(function(lib) { return CSS_LIB_DEST + "/" + lib.dst });

  return gulp.src(SRC_HTML, { base: "." })
    .pipe(cache("html"))
    .pipe(preprocess({context: {
      NODE_ENV: "development",
      CSS: CSS.toString(),
      CSSLIB: CSSLIB.toString()
    }}))
    .pipe(gulp.dest("dist"));
});
gulp.task("copyhtml-prod", function() {
  var CSSLIB = LIB_CSS.map(function(lib) { return CSS_LIB_DEST + "/" + lib.dst });

  return gulp.src(SRC_HTML, { base: "." })
    .pipe(preprocess({context: {
      NODE_ENV: "production",
      CSS: "",
      CSSLIB: CSSLIB.toString()
    }}))
    .pipe(gulp.dest("dist"));
});

gulp.task("copyimg", function() {
  return gulp.src(SRC_IMG, { base: "./img" })
    .pipe(cache("img"))
    .pipe(gulp.dest(DST_IMG));
});
gulp.task("copyimg-prod", function() {
  return gulp.src(SRC_IMG, { base: "./img" })
    //.pipe(imagemin())
    .pipe(gulp.dest(DST_IMG));
});

gulp.task("copycss", function() {
  return gulp.src(SRC_CSS, { base: "./css" })
    .pipe(cache("css"))
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(DST_CSS));
});
gulp.task("copycss-prod", function() {
  return gulp.src(SRC_PROD_CSS, { base: "./css" })
    .pipe(sass().on('error', sass.logError))
    .pipe(cleanCSS())
    .pipe(order(ORDER_PROD_CSS))
    .pipe(concat("app.min.css"))
    .pipe(gulp.dest(DST_CSS));
});

var csslibtasks = [];
LIB_CSS.forEach(function(lib) {
  var name = "copycsslib-" + GET_LIB_FILE(lib);
  gulp.task(name, function() {
    return gulp.src(lib.src)
      .pipe(rename(lib.dst))
      .pipe(gulp.dest(CSS_LIB_DEST, { cwd: "dist" }));
  });
  csslibtasks.push(name);
});
gulp.task("copycsslib", csslibtasks);

gulp.task("copyfont", function() {
  return gulp.src(SRC_FONT, { base: "./css/fonts" })
    .pipe(gulp.dest(DST_FONT));
});

gulp.task("webpack", function(callback) {
  exec("npm run webpack", function(err, stdout, stderr) {
    process.stdout.write("webpack finished" + err + ", " + stdout + ", " + stderr);
    callback();
  });
});

gulp.task("webpack-prod", function(callback) {
  exec("npm run webpackprod", function(err, stdout, stderr) {
    process.stdout.write("webpack finished" + err + ", " + stdout + ", " + stderr);
    callback();
  });
});

const tsProject = typescript.createProject("tsconfig.json");
gulp.task("buildts", function() {
  return gulp.src(SRC_TS, { base: "./js" })
    .pipe(tsProject())
      .on("error", function (err) { console.error(err.toString()); })
    .pipe(gulp.dest("./js"));
});

gulp.task("version", function(callback) {
  exec("git describe --tags --long --always", function(err, stdout, stderr) {
    // process.stdout.write("describe done, " + err + ", " + stdout + ", " + stderr);
    if (err || stderr) {
      callback();
    }
    else {
      var versionNum = stdout.trim();
      var verRegex = /^(.+)-(\d*)-g([a-z0-9]+)$/;
      var matchResult = verRegex.exec(versionNum);
      if (matchResult[0]) {
        versionNum = matchResult[1] + " (+" + matchResult[2] + " "
          + "<a target='_blank' href='https://github.com/PartyPlanner64/PartyPlanner64/commit/"
          + matchResult[3] + "'>" + matchResult[3] + "</a>)";
      }
      gulp.src(["./dist/js/about.js", "./dist/js/app.min.js"])
        .pipe(replace("####VERSION####", versionNum))
        .pipe(gulp.dest(DST_JS))
        .on("end", callback);
    }
  });
});

const convertSymbols = function (text, options) {
  const sourcePath = options.sourcePath;
  let sourceFile = sourcePath.replace(".sym", "");
  sourceFile = sourceFile.substring(sourceFile.lastIndexOf("/") + 1);
  sourceFile = sourceFile.substring(sourceFile.lastIndexOf("\\") + 1);

  // Create an AMD module by hand. (Not .ts file because it will slow .ts type checks)
  const lines = text.split(/\r?\n/);
  let output = `define(["require", "exports"], function (require, exports) {
exports["default"] = [
`;

  const objs = [];
  lines.forEach(function (line) {
    line = line.trim();
    if (!line)
      return;

    const pieces = line.split(",");
    if (pieces.length < 3)
      return;

    // Exclude iffy symbols
    const symName = pieces[2];
    if (symName.endsWith("?") || symName.startsWith("?"))
      return;

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
  output += "\n];";
  output += "\n});";

  return output;
};

const gulpConvertSymbols = textTransformation(convertSymbols);

// TODO: Need to run twice for some reason.
gulp.task("symbols", (callback) => {
  exec("git submodule update --remote", function(err, stdout, stderr) {
    // process.stdout.write("submodule update done, " + err + ", " + stdout + ", " + stderr);
    if (err || stderr) {
      callback();
    }
    else {
      gulp.src("symbols/*.sym")
      .pipe(gulpConvertSymbols())
      .pipe(rename(function (path) {
        path.extname += ".js"
      }))
      .pipe(gulp.dest("js/symbols"))
      .on("end", callback);
    }
  });
});

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

gulp.task("watch", function() {
  gulp.watch(SRC_HTML, ["copyhtml"]);
  gulp.watch(SRC_IMG, ["copyimg"]);
  gulp.watch(SRC_CSS, ["copycss"]);
  gulp.watch(SRC_TS, ["buildts"]);
});

gulp.task("default", ["build"]);
gulp.task("prod", ["build-prod"]);
