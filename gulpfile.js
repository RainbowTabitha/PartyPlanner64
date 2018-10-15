const gulp = require("gulp");

const babel = require("gulp-babel");
const cache = require("gulp-cached");
const clean = require("gulp-clean");
const cleanCSS = require('gulp-clean-css');
const concat = require("gulp-concat");
const del = require("del");
//const imagemin = require('gulp-imagemin');
const order = require('gulp-order');
const preprocess = require('gulp-preprocess');
const rename = require("gulp-rename");
const replace = require('gulp-replace');
const sass = require("gulp-sass");
const textTransformation = require("gulp-text-simple");
const typescript = require("gulp-typescript");
const uglify = require("gulp-uglify");
const zip = require('gulp-zip');

const exec = require('child_process').exec;
const fs = require("fs");
const runSequence = require("run-sequence");

require("dotenv").config();

const packageJson = JSON.parse(fs.readFileSync("./package.json"));

const JS = [
  "js/lib/js-spark-md5/spark-md5.js",
  "js/lib/ThreeJS-export-OBJ/three-js-export-obj.js",
  "js/lib/ThreeOrbitControls.js",

  "js/boot.js",
  "js/utils/utils.js",
  "js/utils/localstorage.js",
  "js/utils/compression.js",
  "js/utils/MIPS.js",
  "js/utils/CIC.js",
  "js/utils/lib/mp-mips-codemirror.js",
  "js/utils/lib/mp-mips-autocomplete.js",

  "js/types.js",
  "js/settings.js",
  "js/images.js",
  "js/controls.js",
  "js/boards.js",
  "js/boardmenu.js",
  "js/newboard.js",
  "js/screenshot.js",
  "js/header.js",
  "js/texteditor.js",
  "js/toolwindow.js",
  "js/toolbar.js",
  "js/boardproperties.js",
  "js/spaceproperties.js",
  "js/details.js",
  "js/about.js",
  "js/models.js",
  "js/eventsview.js",
  "js/createevent.js",
  "js/strings.js",
  "js/spaces.js",
  "js/renderer.js",
  "js/rightclick.js",
  "js/interaction.js",
  "js/romhandler.js",

  "js/components/codemirrorwrapper.js",

  "js/patches.js",
  "js/gameshark.js",
  "js/patches/gameshark/parser.js",
  "js/patches/gameshark/compiler.js",
  "js/patches/gameshark/hook.js",
  "js/patches/gameshark/hook.MP1.U.js",
  "js/patches/gameshark/hook.MP2.U.js",
  "js/patches/gameshark/hook.MP3.U.js",
  "js/patches/PatchBase.js",
  "js/patches/Antialias.js",
  "js/patches/SkipIntro.js",
  "js/patches/DebugMenu.js",
  "js/patches/NoGame.js",

  "js/symbols/symbols.js",
  "js/symbols/MarioParty1U.sym.js",
  "js/symbols/MarioParty2U.sym.js",
  "js/symbols/MarioParty3U.sym.js",

  "js/validation/validation.js",
  "js/validation/validation.MP1.js",
  "js/validation/validation.MP2.js",
  "js/validation/validation.MP3.js",

  "js/fs/scenes.js",
  "js/fs/mainfs.js",
  "js/fs/strings.js",
  "js/fs/strings3.js",
  "js/fs/hvqfs.js",
  "js/fs/audio.js",
  "js/fs/animationfs.js",

  "js/adapter/adapters.js",
  "js/adapter/boarddef.js",
  "js/adapter/boardinfo.js",
  "js/adapter/eventtable.js",
  "js/adapter/eventlist.js",
  "js/adapter/MP1.js",
  "js/adapter/boardinfo.MP1.js",
  "js/adapter/MP2.js",
  "js/adapter/boardinfo.MP2.js",
  "js/adapter/MP3.js",
  "js/adapter/boardinfo.MP3.js",

  "js/events/events.js",
  "js/events/events.common.js",
  "js/events/events.MP1.js",
  "js/events/events.MP2.js",
  "js/events/events.MP3.js",
  "js/events/customevents.js",

  "js/models/FORM.js",
  "js/models/MTNX.js",
  "js/models/FormToThreeJs.js",
  "js/models/MtnxToThreeJs.js",

  "js/utils/dump.js",
  "js/utils/img/tiler.js",
  "js/utils/img/RGBA5551.js",
  "js/utils/img/RGBA32.js",
  "js/utils/img/HVQ.js",
  "js/utils/img/Grayscale.js",
  "js/utils/img/BMP.js",
  "js/utils/img/ImgPack.js",

  "js/app.js",
];

function MAKE_JS_ORDER(js) {
  var output = [];
  for (var i = 0; i < js.length; i++) {
    var pieces = js[i].split("/");
    output.push("**/" + pieces[pieces.length - 1]);
    output.push("**/" + pieces[pieces.length - 1] + "x");
  }
  return output;
}
const ORDER_PROD_JS = MAKE_JS_ORDER(JS);
const SRC_JS = ["!js/electron.js", "js/**/*.js", "js/**/*.jsx"];
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
const JS_LIB_DEST = "js/lib";

function GET_LIB_CDN(lib) {
  var name = GET_LIB_NAME(lib);
  var version = packageJson.dependencies[name];
  return "https://unpkg.com/" + name + "@" + version + GET_LIB_PATH(lib);
}

function GET_LIB_NAME(lib) {
  const prodLibSrc = lib.src_prod || lib.src;
  var path = prodLibSrc.replace("node_modules/", "");
  return path.substring(0, path.indexOf("/"));
}

function GET_LIB_PATH(lib) {
  const prodLibSrc = lib.src_prod || lib.src;
  var path = prodLibSrc.replace("node_modules/", "");
  return path.substr(path.indexOf("/"));
}

function GET_LIB_FILE(lib) {
  return lib.dst;
}

const LIB_JS = [
  { src: "node_modules/es6-shim/es6-shim.min.js",
    dst: "es6-shim.min.js",
  },
  { src_prod: "node_modules/react/umd/react.production.min.js",
    src_dev: "node_modules/react/umd/react.development.js",
    dst: "react.min.js",
  },
  { src_prod: "node_modules/react-dom/umd/react-dom.production.min.js",
    src_dev: "node_modules/react-dom/umd/react-dom.development.js",
    dst: "react-dom.min.js"
  },
  { src: "node_modules/immutable/dist/immutable.min.js",
    dst: "immutable.min.js"
  },
  { src: "node_modules/draft-js/dist/Draft.min.js",
    dst: "Draft.min.js"
  },
  { src: "node_modules/jszip/dist/jszip.min.js",
    dst: "jszip.min.js"
  },
  { src: "node_modules/basiccontext/dist/basicContext.min.js",
    dst: "basicContext.min.js"
  },
  { src: "node_modules/file-saver/FileSaver.min.js",
    dst: "FileSaver.min.js"
  },
  { src: "node_modules/cookies-js/dist/cookies.min.js",
    dst: "cookies.min.js"
  },
  { src: "node_modules/three/build/three.min.js",
    dst: "three.min.js"
  },
  { src: "node_modules/codemirror/lib/codemirror.js",
    dst: "codemirror.js"
  },
  { src: "node_modules/codemirror/addon/hint/show-hint.js",
    dst: "codemirror-show-hint.js"
  },
  { src: "node_modules/gltf-js-utils/dist/gltfutils.js",
    dst: "gltfjsutils.min.js"
  },
  { src: "node_modules/mips-inst/dist/mipsinst.js",
    dst: "mips-inst.min.js"
  },
  { src: "node_modules/mips-assembler/dist/mipsassem.js",
    dst: "mips-assembler.min.js"
  },
];

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
  return del(["dist", "electron/dist"]);
});

gulp.task("copyhtml", function() {
  var JSLIB = LIB_JS.map(function(lib) { return JS_LIB_DEST + "/" + lib.dst });
  var CSSLIB = LIB_CSS.map(function(lib) { return CSS_LIB_DEST + "/" + lib.dst });

  return gulp.src(SRC_HTML, { base: "." })
    .pipe(cache("html"))
    .pipe(preprocess({context: {
      NODE_ENV: "development",
      JS: JS.toString(),
      JSLIB: JSLIB.toString(),
      CSS: CSS.toString(),
      CSSLIB: CSSLIB.toString()
    }}))
    .pipe(gulp.dest("dist"));
});
gulp.task("copyhtml-prod", function() {
  var JSLIB = LIB_JS.map(function(lib) { return GET_LIB_CDN(lib) });
  var CSSLIB = LIB_CSS.map(function(lib) { return CSS_LIB_DEST + "/" + lib.dst });

  return gulp.src(SRC_HTML, { base: "." })
    .pipe(preprocess({context: {
      NODE_ENV: "production",
      JS: "",
      JSLIB: JSLIB.toString(),
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

gulp.task("copyjs", function() {
  return gulp.src(SRC_JS, { base: "./js" })
    .pipe(cache("js"))
    .pipe(babel())
      .on("error", function (err) { console.error(err.toString()); })
    .pipe(gulp.dest(DST_JS));
});
gulp.task("copyjs-prod", function() {
  return gulp.src(SRC_JS, { base: "./js" })
    .pipe(babel())
      .on("error", function (err) { console.error(err.toString()); })
    .pipe(uglify())
      .on("error", function (err) { console.error(err.toString()); })
    .pipe(order(ORDER_PROD_JS))
    .pipe(concat("app.min.js"))
    .pipe(gulp.dest(DST_JS));
});

var jslibtasks = [];
LIB_JS.forEach(function(lib) {
  var name = "copyjslib-" + GET_LIB_FILE(lib);
  gulp.task(name, function() {
    // Speculatively try to find the map file.
    const devLibSrc = lib.src_dev || lib.src;
    var mapfile = devLibSrc.replace(".min.js", ".map");
    if (mapfile !== devLibSrc) {
      gulp.src(mapfile).pipe(gulp.dest(JS_LIB_DEST, { cwd: "dist" }));

      // OK, then might need the original src too.
      var srcjs = devLibSrc.replace(".min.js", ".js");
      if (srcjs !== devLibSrc)
        gulp.src(srcjs).pipe(gulp.dest(JS_LIB_DEST, { cwd: "dist" }));
    }

    // Copy from node_modules into js/lib
    return gulp.src(devLibSrc)
      .pipe(rename(lib.dst))
      .pipe(gulp.dest(JS_LIB_DEST, { cwd: "dist" }));
  })
  jslibtasks.push(name);
});
gulp.task("copyjslib", jslibtasks);

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

gulp.task("createdistzip", () => {
  var today = new Date();
  return gulp.src("dist/**")
    .pipe(zip("PP64-" + (today.getMonth()+1) + "-" + today.getDate() + "-" + today.getFullYear() + ".zip"))
    .pipe(gulp.dest("dist"));
});

const convertSymbols = function (text, options) {
  const sourcePath = options.sourcePath;
  let sourceFile = sourcePath.replace(".sym", "");
  sourceFile = sourceFile.substring(sourceFile.lastIndexOf("/") + 1);
  sourceFile = sourceFile.substring(sourceFile.lastIndexOf("\\") + 1);

  const lines = text.split(/\r?\n/);
  let output = `PP64.ns("symbols");

PP64.symbols["${sourceFile}"] = [
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
    if (pieces[2][pieces[2].length - 1] === "?")
      return;

    let obj = `{
      addr: ${parseInt(pieces[0], 16)}, // 0x${pieces[0]}
      type: "${pieces[1]}",
      name: "${pieces[2]}"`;

    if (pieces[3]) {
      obj += `,
      desc: ${JSON.stringify(pieces[3])}`;
    }

    obj += " }";

    objs.push(obj);
  });

  output += objs.join(",\n");
  output += "\n];";

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
  runSequence("clean", "buildts", [
    "copyhtml",
    "copyimg",
    "copycss",
    "copycsslib",
    "copyfont",
    "copyjslib",
    "copyjs",
  ],
  "version",
  callback);
});
gulp.task("build-prod", function(callback) {
  runSequence("clean", "buildts", [
    "copyhtml-prod",
    "copyimg-prod",
    "copycss-prod",
    "copycsslib",
    "copyjs-prod",
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
  gulp.watch(SRC_JS, ["copyjs"]);
  gulp.watch(SRC_TS, ["buildts"]);
});

gulp.task("default", ["build"]);
gulp.task("prod", ["build-prod"]);
