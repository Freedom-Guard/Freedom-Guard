// Start Code
// #region Libraries 
const ipc = require('electron').ipcRenderer;
const axios = require('axios');
const { execFile, spawn, exec } = require("child_process");
var fs = require("fs");
const path = require("path");
var sect = "browser";
const { trackEvent } = require('@aptabase/electron/renderer');
var { StatusGuard, connectVibe, connectWarp, settingWarp, settingVibe, AssetsPath, ResetArgsVibe, ResetArgsWarp, testProxy, KillProcess, disconnectVibe, saveSetting } = require('../components/connect.js');
// #endregion

// #region Define Variables
var tabs = [];
var tabContents = [];
var tabTitles = [];
var tabIcons = [];
var tabURLs = [];
var tabStatus = [];
var HistoryTabs = [];
var HistoryCount = -1;
var currentTab = 0;
var tabCount = -1;
var urlInput = "";
var BackTab = false;
var settingBrowser = {
    core: "warp",
    status: false,
    proxy: "127.0.0.1:8086",
    gool: false,
    scan: false,
    endpoint: "",
    configVibe: "auto",
};
var CurrentHistory = 0;
// #endregion

// #region Functions
function TabClose(idtab) {
    document.getElementById("tab-" + idtab).remove();
    tabCount--;
    TabSelect(tabCount);
};

function isValidURL(url) {
    const regex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(\/[^\s]*)?$/;
    return regex.test(url) || /^https?:\/\/[^\s]+$/.test(url);
};

function TabSelect(idtab) {
    if (idtab < 0 || idtab >= tabs.length) return; // Prevents selection of non-existing tabs
    document.getElementById("url-input").value = tabURLs[idtab];
    document.getElementById("search-btn-header").click();
    document.getElementById("tab-" + idtab).classList.add("active");
    if (currentTab !== idtab) {
        document.getElementById("tab-" + currentTab)?.classList.remove("active");
    }
    currentTab = idtab;
};

async function Back() {
    if (CurrentHistory > 0) {
        CurrentHistory--;
        tabURLs[currentTab] = HistoryTabs[currentTab][CurrentHistory];
        BackTab = true;
        TabSelect(currentTab);
    }
}

async function Forward() {
    if (CurrentHistory < HistoryTabs[currentTab].length - 1) {
        CurrentHistory++;
        tabURLs[currentTab] = HistoryTabs[currentTab][CurrentHistory];
        BackTab = true;
        TabSelect(currentTab);
    };
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

function ConnectVPN() {
    if (settingBrowser["core"] == "warp" && !document.getElementById("vpn-btn-header").classList.contains("active")) {
        connectWarp();
    } else if (settingBrowser["core"] == "vibe" && !document.getElementById("vpn-btn-header").classList.contains("active")) {
        connectVibe();
    } else {
        KillProcess();
        StatusGuard = false;
        disconnectVibe();
    }
    document.getElementById("vpn-btn-header").classList.toggle("active");
    document.getElementById("vpn-btn-header").style.animation = document.getElementById("vpn-btn-header").classList.contains("active") ? "Connect 1s infinite" : "";
};

function disconnectVPN() {
    document.getElementById("vpn-btn-header").classList.remove("active");
    document.getElementById("vpn-btn-header").style.animation = "";
}

function SetAnim(id, anim) {
    document.getElementById(id).style.animation = anim;
}

function SetAttr(id, attr, value) {
    document.getElementById(id).setAttribute(attr, value);
}

function SetHTML(id, value) {
    document.getElementById(id).innerHTML = value;
};

function SetValueInput(id, Value) {
    document.getElementById(id).value = Value;
}

function Showmess(time, mess) {
    // Implementation for showing messages
}
// #endregion

// #region Event Listeners
document.getElementById("menu-btn-header").addEventListener("click", function () {
    ipc.send("hide-browser");
    this.title = (this.title === "menushow") ? "menuhide" : "menushow";
    HideAllContentMenu();
});

document.getElementById("url-input").addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById("search-btn-header").click();
    }
});

document.getElementById("home-btn-header").addEventListener('click', () => {
    document.getElementById("url-input").value = "https://fwldom.github.io/freedom-site-browser/index.html";
    document.getElementById("search-btn-header").click();
});

document.getElementById("add-tab").addEventListener("click", function () {
    tabCount += 1;
    const idTab = tabCount;
    tabs.push(idTab);
    document.getElementById("tab-list").innerHTML += `
    <div class='tab' id='tab-${idTab}' onclick='TabSelect(${idTab})'>
    <div class='tab-title' id='tab-title-${idTab}'>New Tab</div>
    <div class='tab-icon' id='tab-icon-${idTab}'></div>
    <div class='tab-close' id='tab-close-${idTab}' onclick='TabClose(${idTab})'><i class="bi bi-x"></i></div>`;
    HistoryTabs.push([]);
    tabURLs[idTab] = "https://fwldom.github.io/freedom-site-browser/";
    TabSelect(idTab);
});

document.getElementById("search-btn-header").addEventListener("click", function () {
    const inputUrl = document.getElementById("url-input").value;
    urlInput = isValidURL(inputUrl) ? `https://${inputUrl.replace("https://", "").replace("http://", "")}` : `https://google.com/search?q=${inputUrl}`;
    document.getElementById("refresh-btn-header").style.animation = "spin 1s linear infinite";
    ipc.send("load-url-browser", urlInput);
});

document.getElementById("vpn-btn-header").addEventListener("click", function () {
    ConnectVPN();
});

document.getElementById("refresh-btn-header").addEventListener("click", function () {
    const inputUrl = document.getElementById("url-input").value;
    urlInput = `https://${inputUrl.replace("https://", "").replace("http://", "")}`;
    document.getElementById("refresh-btn-header").style.animation = "spin 1s linear infinite";
    ipc.send("load-url-browser", urlInput);
});

document.getElementById("close-browser").addEventListener("click", function () {
    settingWarp = JSON.parse(read_file("warp.json"));
    settingWarp["startup"] = "warp";
    write_file("warp.json", JSON.stringify(settingWarp));
    ipc.send("load-main-app");
});

function HideAllContentMenu() {
    document.getElementById("content-menu-settings").style.display = "none";
    document.getElementById("content-menu-vpn").style.display = "none";
    document.getElementById("content-menu-bookmark").style.display = "none";
}

// #endregion

// #region IPC Events
ipc.on("set-url", (event, url) => {
    HistoryCount++;
    document.getElementById("refresh-btn-header").style.animation = "spin 1s linear infinite";
    setTimeout(() => document.getElementById("refresh-btn-header").style.animation = "", 3000);
    document.getElementById("url-input").value = url;
    if (!BackTab) {
        tabURLs[currentTab] = url;
        HistoryTabs[currentTab].push(url);
    }
    BackTab = false;
});

ipc.on("set-title", (event, title) => {
    document.getElementById("refresh-btn-header").style.animation = "";
    document.getElementById("tab-" + currentTab).title = title;
    document.getElementById("tab-title-" + currentTab).textContent = title.length > 20 ? `${title.slice(0, 20)}...` : title;
});
// #endregion

// #region Browser Initialization
function loadBrowser() {
    if (tabCount === -1) document.getElementById("add-tab").click();
}
document.addEventListener("DOMContentLoaded", loadBrowser);
// #endregion

// #region File Operations
function read_file(path) {
    try {
        return fs.readFileSync(path, 'utf8');
    } catch (err) {
        console.error("Error reading file:", err);
        return null;
    }
}

function write_file(path, output) {
    try {
        fs.writeFileSync(path, output);
    } catch (err) {
        console.error("Error writing file:", err);
    }
}
// #endregion

setInterval(testProxy, 10000);
testProxy();
trackEvent("start-browser");
// End Code
