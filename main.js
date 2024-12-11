
// Start Code
// #region Libraries
;
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const { net, protocol, session, BrowserView } = require('electron')
const { dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require("child_process");
const { eventNames } = require('process');
const ipc = require('electron').ipcMain;
const { initialize } = require('@aptabase/electron/main');
const { setInterval } = require('timers/promises');
const { fileURLToPath } = require('url');
;
// #endregion
// #region Vars
initialize("A-EU-");
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
    icon: path.join(__dirname, 'ico.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true,
    titleBarOverlay: "Freedom Guard",
    title: "Freedom Guard",
  });
  mainWindow.loadFile("./index.html");
  mainWindow.on('resize', function () {
    try {
      ViewBrowser.setBounds({ x: 0, y: mainWindow.getBounds().height / 6, width: mainWindow.getBounds().width / 1.3, height: mainWindow.getBounds().height / 1.3 });
    }
    catch { };
  });
};
function CreateViewBrowser(url) {
  ViewBrowser = new BrowserView();
  mainWindow.setBrowserView(ViewBrowser);
  ViewBrowser.setBounds({ x: 0, y: mainWindow.getBounds().height / 6, width: mainWindow.getBounds().width / 1.3, height: mainWindow.getBounds().height / 1.3 });
  ViewBrowser.setAutoResize({ width: true, height: true });
  ViewBrowser.webContents.loadURL(url);
  setTimeout(() => {
    mainWindow.setSize(800, 600);
  }, 1000);
};

// #endregion
// #region Interval
setInterval(() => { // Resize View Browser 
  try {
    ViewBrowser.setBounds({ x: 0, y: mainWindow.getBounds().height / 6, width: mainWindow.getBounds().width / 1.3, height: mainWindow.getBounds().height / 1.3 });
  }
  catch { };
}, 5000)
setInterval(() => {
  try {
    if (currentURL != ViewBrowser.webContents.getURL()) {
      currentURL = ViewBrowser.webContents.getURL();
      pageTitle = ViewBrowser.webContents.getTitle();
      mainWindow.webContents.send('set-url', (currentURL));
      mainWindow.webContents.send('set-title', (pageTitle));
    }
  }
  catch { };
}, 5000);
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
  icon = nativeImage.createFromPath(path.join(__dirname, "assets", 'ico.png'))
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
    {
      label: 'Open Freedom Browser',
      type: 'normal',
      click: () => {
        CreateViewBrowser("https://fwldom.github.io/freedom-site-browser/index.html");
        mainWindow.loadFile("browser.html");
        ViewBrowser.webContents.on("did-finish-load", (event) => {
          currentURL = ViewBrowser.webContents.getURL();
          pageTitle = ViewBrowser.webContents.getTitle();
          mainWindow.webContents.send('set-url', (currentURL));
          pageTitle = ViewBrowser.webContents.getTitle();
          mainWindow.webContents.send('set-title', (pageTitle));
        });
        ViewBrowser.webContents.on("did-navigate", (event, url) => {
          currentURL = ViewBrowser.webContents.getURL();
          pageTitle = ViewBrowser.webContents.getTitle();
          mainWindow.webContents.send('set-url', (url));
        });
        mainWindow.maximize();
        ViewBrowser.setBounds({ x: 10, y: mainWindow.getBounds().height / 6, width: mainWindow.getBounds().width, height: mainWindow.getBounds().height / 1.3 });
      }
    },
    {
      label: 'Settings',
      submenu: [
        {
          label: 'Freedom Warp',
          submenu: [
            {
              label: 'Gool', type: 'normal', id: "Gool", click: () => {
                mainWindow.webContents.send('set-warp-true', 'gool'); mainWindow.focus()
              }
            },
            {
              label: 'Scan', type: 'normal', click: () => {
                mainWindow.webContents.send('set-warp-true', 'scan'); mainWindow.focus()
              }
            }

          ]
        }]
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
})
app.on('ready', createWindow);
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.setUserTasks([
  {
    program: process.execPath,
    arguments: '--new-window',
    iconPath: process.execPath,
    iconIndex: 0,
    title: 'New Window',
    description: 'Create a new window'
  }
]);
// #endregion
// #region IPC
ipc.on("load-main-app", (event) => {
  mainWindow.loadFile("index.html");
  mainWindow.removeBrowserView(ViewBrowser);
});
ipc.on('hide-browser', (event, url) => {
  mainWindow.removeBrowserView(ViewBrowser);
});
ipc.on('show-browser', (event, url) => {
  mainWindow.setBrowserView(ViewBrowser);
});
ipc.on('load-browser', (event) => {
  CreateViewBrowser("https://fwldom.github.io/freedom-site-browser/index.html");
  mainWindow.loadFile("browser.html");
  ViewBrowser.webContents.on("did-finish-load", (event) => {
    currentURL = ViewBrowser.webContents.getURL();
    pageTitle = ViewBrowser.webContents.getTitle();
    mainWindow.webContents.send('set-url', (currentURL));
    pageTitle = ViewBrowser.webContents.getTitle();
    mainWindow.webContents.send('set-title', (pageTitle));
  });
  ViewBrowser.webContents.on("did-navigate", (event, url) => {
    currentURL = ViewBrowser.webContents.getURL();
    pageTitle = ViewBrowser.webContents.getTitle();
    mainWindow.webContents.send('set-url', (url));
  });
  mainWindow.maximize();
  ViewBrowser.setBounds({ x: 10, y: mainWindow.getBounds().height / 6, width: mainWindow.getBounds().width, height: mainWindow.getBounds().height / 1.3 });
});
ipc.on('load-url-browser', (event, url) => {
  ViewBrowser.webContents.loadURL(url);
});
ipc.on('exit-app', (event) => {
  mainWindow.close();
  app.exit();
});
ipc.on('load-file', (event, Pathfile) => {
  mainWindow.loadFile(path.join(__dirname, Pathfile));
});
ipc.on('load-file-plus', (event, Pathfile) => {
  mainWindow.loadFile(path.join(Pathfile));
});
ipcMain.on('show-notification', (event, title = "Freedom Guard", body, icon = "./icon.png") => {
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
// #endregion
// #region Quit
app.on('before-quit', () => {
  exec("taskkill /IM " + "HiddifyCli.exe" + " /F");
  exec('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /F');
  exec("taskkill /IM " + "warp-plus.exe" + " /F");
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
