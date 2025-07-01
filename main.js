// Start Code
// #region Libraries
;
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, BrowserView } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require("child_process");
const ipc = require('electron').ipcMain;
const { initialize } = require('@aptabase/electron/main');
initialize("A-EU-5072151346");
__dirnameFile = __dirname;
// #endregion
// #region Vars
var currentURL = "";
var mainWindow = null
var ViewBrowser = null;
var pageTitle = "";
const gotTheLock = app.requestSingleInstanceLock()

// #endregion
// #region functions

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirnameFile, "src", "assets", "icon", process.platform == "linux" ? 'ico.png' : "ico.ico"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      allowFileAccess: true,
    },
    autoHideMenuBar: true,
    titleBarOverlay: "Freedom Guard",
    title: "Freedom Guard",
  });
  mainWindow.loadFile(path.join(__dirnameFile, "src", "/main/index.html"));
  mainWindow.on('resize', () => {
    try {
      const bounds = mainWindow.getBounds();
      ViewBrowser.setBounds({
        x: 0,
        y: bounds.height / 5.8,
        width: bounds.width,
        height: bounds.height / 1.3
      });
    } catch { }
  });
  mainWindow.on('close', (event) => {
    event.preventDefault();
    app.exit();
  });
};
function CreateViewBrowser(url) {
  ViewBrowser = new BrowserView();
  mainWindow.setBrowserView(ViewBrowser);
  ViewBrowser.setBounds({ x: 0, y: mainWindow.getBounds().height / 5.8, width: mainWindow.getBounds().width, height: mainWindow.getBounds().height / 1.3 });
  ViewBrowser.setAutoResize({ width: true, height: true });
  ViewBrowser.webContents.loadURL(url);
  ViewBrowser.webContents.setWindowOpenHandler(({ url }) => {
    mainWindow.webContents.send('open-new-tab', url);
    return { action: 'deny' };
  });
};

function isAdmin() {
  try {
    if (process.platform === "win32") {
      const output = execSync("net session", { stdio: "pipe" }).toString();
      return output.toLowerCase().includes("there are no entries");
    }
    return process.getuid && process.getuid() === 0;
  } catch (error) {
    return false;
  }
}
// #endregion
// #region Startup
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('freedom-guard', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('freedom-guard')
};
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
    mainWindow.webContents.send('start-link', commandLine.pop());
  })
}
let tray
function setSystemTray(status = "off") {
  if (tray) {
    tray.destroy();
    tray = null;
  }
  icon = nativeImage.createFromPath(path.join(__dirnameFile, "src", "assets", "icon", 'ico.png'))
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: (status == "off" ? 'Connect to Freedom Guard' : 'Disconnect Freedom Guard'),
      type: 'normal',
      click: () => {
        mainWindow.removeBrowserView(ViewBrowser);
        mainWindow.webContents.send('start-fg', '');
        mainWindow.focus()
      }
    },
    { type: 'separator' },
    {
      label: 'Show Application',
      type: 'normal',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Hide Application',
      type: 'normal',
      click: () => {
        mainWindow.hide();
      }
    },
    {
      label: 'Close Application',
      type: 'normal',
      click: () => {
        mainWindow.close();
        app.exit();
      }
    },
  ]);
  tray.setContextMenu(contextMenu);
  tray.setToolTip('Freedom Guard')
  tray.setTitle('VPN (Warp, Vibe , Psiphon)')
}
app.whenReady().then(() => {
  setSystemTray("off");
  ipcMain.handle("check-admin", () => isAdmin());
})
app.on('ready', createWindow);
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
if (process.platform === "win32") {
  app.setUserTasks([
    {
      program: process.execPath,
      arguments: "--new-window",
      iconPath: process.execPath,
      iconIndex: 0,
      title: "New Window",
      description: "Open a new window"
    }
  ]);
}
// #endregion
// #region IPC
ipcMain.handle("submit-dialog", async (message) => {
  const result = await dialog.showMessageBox({
    type: "question",
    buttons: ["بله", "خیر"],
    title: "تأیید",
    message: "آیا مطمئن هستید که می‌خواهید کانفیگ را حذف کنید؟"
  });

  return result.response === 0;
});
ipc.on("load-main-app", (event) => {
  mainWindow.loadFile(path.join("src", "main/index.html"));
  mainWindow.removeBrowserView(ViewBrowser);
  ViewBrowser.webContents.destroy();
});
ipc.on('hide-browser', (event, url) => {
  mainWindow.removeBrowserView(ViewBrowser);
});
ipc.on('go-back', () => {
  if (ViewBrowser.webContents.canGoBack()) {
    ViewBrowser.webContents.goBack();
    if (ViewBrowser.webContents.canGoBack()) {
      mainWindow.webContents.send("go-back-false", '');
    }
  }
});
ipc.on('go-forward', () => {
  if (ViewBrowser.webContents.canGoForward()) {
    ViewBrowser.webContents.goForward();
  }
});
ipc.on('reload', () => {
  ViewBrowser.webContents.reload();
});

ipc.on('stop-loading', () => {
  ViewBrowser.webContents.stop();
});
ipcMain.on('zoom-in', () => {
  ViewBrowser.webContents.setZoomFactor(ViewBrowser.webContents.getZoomFactor() + 0.1);
});
ipcMain.on('zoom-out', () => {
  ViewBrowser.webContents.setZoomFactor(ViewBrowser.webContents.getZoomFactor() - 0.1);
});
ipcMain.on('toggle-fullscreen', () => {
  let isFullScreen = mainWindow.isFullScreen();
  mainWindow.setFullScreen(!isFullScreen);
});
ipc.on('show-browser', (event, url) => {
  mainWindow.setBrowserView(ViewBrowser);
});
ipc.on('load-browser', (event) => {
  CreateViewBrowser("https://fwldom.github.io/freedom-site-browser/index.html");
  mainWindow.loadFile(path.join("src", "browser/index.html"));
  ViewBrowser.webContents.on("did-finish-load", (event) => {
    currentURL = ViewBrowser.webContents.getURL();
    pageTitle = ViewBrowser.webContents.getTitle();
    mainWindow.webContents.send('set-url', (currentURL));
    pageTitle = ViewBrowser.webContents.getTitle();
    mainWindow.webContents.send('set-title', (pageTitle));
    if (!ViewBrowser.webContents.canGoForward()) {
      mainWindow.webContents.send("go-forward-false", '');
    }
    else {
      mainWindow.webContents.send("go-forward-true", '');
    }
    if (!ViewBrowser.webContents.canGoBack()) {
      mainWindow.webContents.send("go-back-false", '');
    }
    else {
      mainWindow.webContents.send("go-back-true", '');
    }
  });
  ViewBrowser.webContents.on("did-navigate", (event, url) => {
    currentURL = ViewBrowser.webContents.getURL();
    pageTitle = ViewBrowser.webContents.getTitle();
    mainWindow.webContents.send('set-url', currentURL);
    mainWindow.webContents.send('set-title', pageTitle);
  });
  mainWindow.maximize();
  ViewBrowser.setBounds({ x: 2, y: mainWindow.getBounds().height / 5.8, width: mainWindow.getBounds().width, height: mainWindow.getBounds().height / 1.3 });
});
ipc.on('load-url-browser', (event, url) => {
  ViewBrowser.webContents.loadURL(url);
});
ipc.on('exit-app', (event) => {
  mainWindow.close();
  app.exit();
});
ipc.on('load-file', (event, Pathfile) => {
  mainWindow.loadFile(path.join(__dirnameFile, Pathfile));
});
ipcMain.on('show-notification', (event, title = "Freedom Guard", body, icon = "./src/assets/icon/icon.png") => {
  const notification = new Notification({
    title: title,
    body: body,
    icon: icon
  });

  notification.show();
});
ipc.on("set-on-fg", (event) => {
  setSystemTray("on");
});
ipc.on("set-off-fg", (event) => {
  setSystemTray("off");
});
ipcMain.on("export-settings", async (event, settings) => {
  const options = {
    title: "Save Settings",
    defaultPath: "freedom-guard-config.json",
    filters: [{ name: "JSON Files", extensions: ["json"] }],
  };
  dialog.showSaveDialog(options).then((file) => {
    if (!file.canceled) {
      fs.writeFile(file.filePath, JSON.stringify(settings, null, 2), (err) => {
        if (err) {
          dialog.showMessageBox(mainWindow, ("Error saving settings:" + err));
          event.reply("save-status", "error");
        } else {
          dialog.showMessageBox(mainWindow, "Settings exported successfully!");
          event.reply("save-status", "success");
        }
      });
    } else {
      event.reply("save-status", "cancelled");
    }
  });
});
ipcMain.handle("import-config", async () => {
  const options = {
    title: "Select Configuration File",
    filters: [{ name: "JSON Files", extensions: ["json"] }],
    properties: ["openFile"],
  };

  const file = await dialog.showOpenDialog(options);

  if (!file.canceled && file.filePaths.length > 0) {
    const filePath = file.filePaths[0];
    try {
      const data = fs.readFileSync(filePath, "utf8");
      const jsonData = JSON.parse(data);
      return { success: true, data: jsonData, noJsonData: data };
    } catch (error) {
      console.error("Error reading configuration file:", error);
      return { success: false, error: "Failed to read the file." };
    }
  } else {
    return { success: false, error: "No file selected." };
  }
});
// #endregion
// #region Quit
app.on('before-quit', () => {
  exec("taskkill /IM " + "vibe-core.exe" + " /F");
  exec('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /F');
  exec("taskkill /IM " + "warp-core.exe" + " /F");
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
// #endregion Quit
// #region other
// Handle Write JSON file
ipcMain.handle('write-json', async (event, filePath, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
      if (err) reject(err);
      else resolve('File written successfully');
    });
  });
});

// Handle Read JSON file
ipcMain.handle('read-json', async (event, filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data));
    });
  });
});
// #endregion
// End Code
