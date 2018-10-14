// PP64 Electron bootstrap

const {app, BrowserWindow} = require("electron");

require("electron-debug")({ enabled: true, showDevTools: false });

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1024,
    height: 864
  });
  win.setMenu(null);
  win.maximize();

  win.loadURL(`file://${__dirname}/../index.html`);

  win.on("closed", () => {
    win = null;
  });
}

app.on("ready", createWindow);

app.on('browser-window-created', (e, window) => {
  window.setMenu(null);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin")
    app.quit();
});

app.on("activate", () => {
  if (win === null) {
    createWindow();
  }
});

