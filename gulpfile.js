var gulp = require("gulp");

var babel = require("gulp-babel");
var cache = require("gulp-cached");
var clean = require("gulp-clean");
var cleanCSS = require('gulp-clean-css');
var concat = require("gulp-concat");
//var imagemin = require('gulp-imagemin');
var order = require('gulp-order');
var preprocess = require('gulp-preprocess');
var rename = require("gulp-rename");
var replace = require('gulp-replace');
var sass = require("gulp-sass");
var uglify = require("gulp-uglify");
var zip = require('gulp-zip');

var exec = require('child_process').exec;
var fs = require("fs");
var runSequence = require("run-sequence");

var packageJson = JSON.parse(fs.readFileSync("./package.json"));

const JS = [
  "js/lib/js-spark-md5/spark-md5.js",
  "js/lib/ThreeOrbitControls.js",

  "js/boot.js",
  "js/utils/utils.js",
  "js/utils/compression.js",
  "js/utils/MIPS.js",
  "js/utils/CIC.js",

  "js/types.js",
  "js/settings.js",
  "js/images.js",
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
  "js/spaces.js",
  "js/renderer.js",
  "js/rightclick.js",
  "js/interaction.js",
  "js/romhandler.js",

  "js/patches.js",
  "js/patches/PatchBase.js",
  "js/patches/Antialias.js",
  "js/patches/SkipIntro.js",
  "js/patches/DebugMenu.js",

  "js/validation/validation.js",
  "js/validation/validation.MP1.js",
  "js/validation/validation.MP2.js",
  "js/validation/validation.MP3.js",

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
  "js/adapter/events.js",
  "js/adapter/events.common.js",
  "js/adapter/MP1.js",
  "js/adapter/boardinfo.MP1.js",
  "js/adapter/events.MP1.js",
  "js/adapter/MP2.js",
  "js/adapter/boardinfo.MP2.js",
  "js/adapter/events.MP2.js",
  "js/adapter/MP3.js",
  "js/adapter/boardinfo.MP3.js",
  "js/adapter/events.MP3.js",

  "js/utils/FORM.js",
  "js/utils/MTNX.js",
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

function GET_LIB_CDN(lib) {
  var name = GET_LIB_NAME(lib);
  var version = packageJson.dependencies[name];
  return "https://unpkg.com/" + name + "@" + version + GET_LIB_PATH(lib);
}

function GET_LIB_NAME(lib) {
  var path = lib.src.replace("node_modules/", "");
  return path.substring(0, path.indexOf("/"));
}

function GET_LIB_PATH(lib) {
  var path = lib.src.replace("node_modules/", "");
  return path.substr(path.indexOf("/"));
}

function GET_LIB_FILE(lib) {
  return lib.dst.substr(lib.dst.lastIndexOf("/") + 1);
}

function GET_LIB_DEST(lib) {
  return lib.dst.substring(0, lib.dst.lastIndexOf("/"));
}

const LIB_JS = [
  { src: "node_modules/es6-shim/es6-shim.min.js",
    dst: "js/lib/es6-shim.min.js",
  },
  { src: "node_modules/react/dist/react.min.js",
    dst: "js/lib/react.min.js",
  },
  { src: "node_modules/react-dom/dist/react-dom.min.js",
    dst: "js/lib/react-dom.min.js"
  },
  { src: "node_modules/immutable/dist/immutable.min.js",
    dst: "js/lib/immutable.min.js"
  },
  { src: "node_modules/draft-js/dist/Draft.min.js",
    dst: "js/lib/Draft.min.js"
  },
  { src: "node_modules/jszip/dist/jszip.min.js",
    dst: "js/lib/jszip.min.js"
  },
  { src: "node_modules/basiccontext/dist/basicContext.min.js",
    dst: "js/lib/basicContext.min.js"
  },
  { src: "node_modules/filesaver.js/FileSaver.min.js",
    dst: "js/lib/FileSaver.min.js"
  },
  { src: "node_modules/cookies-js/dist/cookies.min.js",
    dst: "js/lib/cookies.min.js"
  },
  { src: "node_modules/three/build/three.min.js",
    dst: "js/lib/three.min.js"
  },
];

const LIB_CSS = [
  { src: "node_modules/draft-js/dist/Draft.css",
    dst: "css/lib/Draft.css"
  },
  { src: "node_modules/basiccontext/dist/basicContext.min.css",
    dst: "css/lib/basicContext.min.css"
  },
  { src: "node_modules/basiccontext/dist/themes/default.min.css",
    dst: "css/lib/default.min.css"
  },
];

const SRC_HTML = "*.html";
const DST_HTML = "dist/*.html";

const SRC_IMG = ["img/**/*.png", "img/**/*.gif", "img/**/*.ico", "img/**/*.cur"];
const DST_IMG = "dist/img";

const SRC_FONT = ["css/fonts/*"];
const DST_FONT = "dist/css/fonts";

gulp.task("cleanhtml", function() {
  return gulp.src(DST_HTML, { read: false })
    .pipe(clean());
});
gulp.task("copyhtml", function() {
  var JSLIB = LIB_JS.map(function(lib) { return lib.dst });
  var CSSLIB = LIB_CSS.map(function(lib) { return lib.dst });

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
  var CSSLIB = LIB_CSS.map(function(lib) { return lib.dst });

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

gulp.task("cleanimg", function() {
  return gulp.src(DST_IMG, { read: false })
    .pipe(clean());
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

gulp.task("cleancss", function() {
  return gulp.src(DST_CSS, { read: false })
    .pipe(clean());
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
    return gulp.src(lib.src).pipe(gulp.dest(GET_LIB_DEST(lib), { cwd: "dist" }));
  })
  csslibtasks.push(name);
});
gulp.task("copycsslib", csslibtasks);

// No cleanfont, cleancss covers it
gulp.task("copyfont", function() {
  return gulp.src(SRC_FONT, { base: "./css/fonts" })
    .pipe(gulp.dest(DST_FONT));
});

gulp.task("cleanjs", function() {
  return gulp.src(DST_JS, { read: false })
    .pipe(clean());
});
gulp.task("copyjs", function() {
  return gulp.src(SRC_JS, { base: "./js" })
    .pipe(cache("js"))
    .pipe(babel({ presets: ["es2015", "react", "stage-0"], ignore: "*lib/*" }))
    .pipe(gulp.dest(DST_JS));
});
gulp.task("copyjs-prod", function() {
  return gulp.src(SRC_JS, { base: "./js" })
    .pipe(babel({ presets: ["es2015", "react", "stage-0"], ignore: "*lib/*" }))
    .pipe(uglify())
    .pipe(order(ORDER_PROD_JS))
    .pipe(concat("app.min.js"))
    .pipe(gulp.dest(DST_JS));
});

var jslibtasks = [];
LIB_JS.forEach(function(lib) {
  var name = "copyjslib-" + GET_LIB_FILE(lib);
  gulp.task(name, function() {
    return gulp.src(lib.src).pipe(gulp.dest(GET_LIB_DEST(lib), { cwd: "dist" }));
  })
  jslibtasks.push(name);
});
gulp.task("copyjslib", jslibtasks);

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
          + "<a href='https://github.com/PartyPlanner64/PartyPlanner64/commit/"
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
gulp.task("cleandistzip", function() {
  return gulp.src("dist/*.zip", { read: false })
    .pipe(clean());
});


gulp.task("clean", ["cleanhtml", "cleanimg", "cleancss", "cleanjs", "cleandistzip"]);

gulp.task("build", function(callback) {
  runSequence("clean", [
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
  runSequence("clean", [
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

gulp.task("build-prod-electron", function(callback) {
  runSequence("copy-electron-boot",
  //"pack-electron",
  callback);
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
});

gulp.task("default", ["clean", "build"]);
gulp.task("prod", ["clean", "build-prod"]);
