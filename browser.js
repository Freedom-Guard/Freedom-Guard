// Start Code
// #region Libraries 
const ipc = require('electron').ipcRenderer;
const axios = require('axios');
const { execFile, spawn, exec } = require("child_process");
var fs = require("fs");
const path = require("path");
var sect = "browser";
const { trackEvent } = require('@aptabase/electron/renderer');
var { StatusGuard, connectVibe, connectWarp, settingWarp, settingVibe, AssetsPath, ResetArgsVibe, ResetArgsWarp, testProxy, KillProcess, disconnectVibe, saveSetting } = require('./connect.js');
// #endregion
// #region functions for public 
function TabClose(idtab) {
    document.getElementById("tab-" + idtab).remove();
    tabCount--;
    TabSelect(tabCount);
};
function isValidURL(url) {
    const regex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(\/[^\s]*)?$/;
    return regex.test(url);
};
function TabSelect(idtab) {
    document.getElementById("url-input").value = tabURLs[idtab];
    document.getElementById("search-btn-header").click();
    document.getElementById("tab-" + idtab).classList.add("active");
    try {
        document.getElementById("tab-" + currentTab).classList.remove("active");
    }
    catch (e) { };
    currentTab = idtab;
};
var CurrentHistory = 0;
var BackTab = false;
async function Back() {
    if (CurrentHistory == 0) {
        CurrentHistory = HistoryTabs[currentTab].length - 2;
        tabURLs[currentTab] = HistoryTabs[currentTab][HistoryTabs[currentTab].length - 2];
        TabSelect(currentTab);
    }
    else {
        tabURLs[currentTab] = HistoryTabs[currentTab][CurrentHistory - 1];
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
// #endregion function public
// #region functions 
function ConnectVPN() {
    if (settingBrowser["core"] == "warp" && !document.getElementById("vpn-btn-header").classList.contains("active")) {
        connectWarp();
    }
    else if (settingBrowser["core"] == "vibe" && !document.getElementById("vpn-btn-header").classList.contains("active")) {
        connectVibe();
    }
    else {
        KillProcess();
        StatusGuard = false;
        disconnectVibe();
    }
    document.getElementById("vpn-btn-header").classList.contains("active") ? disconnectVPN() : ("");
    document.getElementById("vpn-btn-header").style.animation = "Connect 1s infinite";
};
function ConnectedVPN() {
    document.getElementById("vpn-btn-header").classList.add("active");
    document.getElementById("vpn-btn-header").style.animation = "C";
}
function disconnectVPN() {
    document.getElementById("vpn-btn-header").classList.remove("active");
    document.getElementById("vpn-btn-header").style.animation = "C";
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
    // Set Value In Input
    document.getElementById(id).value = Value;
}
function Showmess(time, mess) {

}
// #endregion
// #region define events 
document.getElementById("menu-btn-header").addEventListener("click", function () {
    ipc.send("hide-browser");
    this.title == "menushow" ? (this.title = "menuhide" && ipc.send("show-browser")) : (this.title = "menushow");
    HideAllContentMenu();
});
document.getElementById("url-input").addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById("search-btn-header").click();
    };
});
document.getElementById("home-btn-header").addEventListener('click', (event) => {
    document.getElementById("url-input").value = "https://fwldom.github.io/freedom-site-browser/index.html";
    document.getElementById("search-btn-header").click();
});
document.getElementById("add-tab").addEventListener("click", function () {
    tabCount += 1;
    var idTab = tabCount;
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
function isValidURL(url) {
    const regex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(\/[^\s]*)?$/;
    return regex.test(url) || /^https?:\/\/[^\s]+$/.test(url);
}
document.getElementById('url-input').addEventListener('focus', function () {
    this.select();
    setTimeout(() => {  
        this.select();
    }, 300);
});
document.getElementById("search-btn-header").addEventListener("click", function () {
    if (isValidURL(document.getElementById("url-input").value)) {
        urlInput = "https://" + document.getElementById("url-input").value.replace("https://", "").replace("http://", "");
    }
    else {
        urlInput = "https://google.com/search?q=" + document.getElementById("url-input").value;
    }
    document.getElementById("refresh-btn-header").style.animation = "spin 1s linear infinite";
    ipc.send("load-url-browser", urlInput);
});
document.getElementById("vpn-btn-header").addEventListener("click", function () {
    ConnectVPN();
});
document.getElementById("refresh-btn-header").addEventListener("click", function () {
    urlInput = "https://" + document.getElementById("url-input").value.replace("https://", "").replace("http://", "");
    document.getElementById("refresh-btn-header").style.animation = "spin 1s linear infinite";
    ipc.send("load-url-browser", urlInput)
});
document.getElementById("close-browser").addEventListener("click", function () {
    settingWarp = JSON.parse(read_file("warp.json"));
    settingWarp["startup"] = "warp";
    write_file("warp.json", JSON.stringify(settingWarp));
    ipc.send("load-main-app");
});
read_file = function (path) {
    return fs.readFileSync(path, 'utf8');
}
write_file = function (path, output) {
    fs.writeFileSync(path, output);
}
document.getElementById("back-btn-header").addEventListener("click", function () {
    Back();
});
document.getElementById("forward-btn-header").addEventListener("click", function () {
    Forward();
});
function HideAllContentMenu() {
    document.getElementById("content-menu-settings").style.display = "none";
    document.getElementById("content-menu-vpn").style.display = "none";
    document.getElementById("content-menu-bookmark").style.display = "none";
}
document.getElementById('menu-item-vpn').addEventListener('click', function () {
    HideAllContentMenu();
    document.getElementById("content-menu-vpn").style.display = "";
});
document.getElementById('menu-item-bookmark').addEventListener('click', function () {
    HideAllContentMenu();
    document.getElementById("content-menu-bookmark").style.display = "";
});
document.getElementById('menu-item-settings').addEventListener('click', function () {
    HideAllContentMenu();
    document.getElementById("content-menu-bookmark").style.display = "";
});
document.getElementById("close-menu").addEventListener("click", function () {
    document.getElementById("menu-btn-header").click();
})
document.getElementById("core-vpn-selector").addEventListener("change", function () {
    settingBrowser["core"] = document.getElementById("core-vpn-selector").value;
    this.value == "vibe" ? document.getElementById("config-vibe").removeAttribute("disabled") : document.getElementById("config-vibe").setAttribute("disabled", "disabled");
});
document.getElementById("config-vibe").addEventListener("change", function () {
    settingBrowser["configVibe"] = document.getElementById("config-vibe").value;
    settingVibe["config"] = document.getElementById("config-vibe").value;
    saveSetting();
});
document.getElementById("config-vibe").addEventListener("change", function () {
    settingWarp["endpoint"] = document.getElementById("endpoint-warp").value;
    saveSetting();
});
// #endregion
// #region define variables
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
var settingBrowser = {
    core: "warp",
    status: false,
    proxy: "127.0.0.1:8086",
    gool: false,
    scan: false,
    endpoint: "",
    configVibe: "auto",
};
// #endregion
// #region Load Browser
function loadBrowser() {
    document.getElementById("add-tab").click();
}
document.addEventListener("DOMContentLoaded", function () {
    loadBrowser();
});
// #endregion
// #region IPC

ipc.on("set-url", (event, url) => {
    HistoryCount++;
    document.getElementById("refresh-btn-header").style.animation = "spin 1s linear infinite";
    setTimeout(() => {
        document.getElementById("refresh-btn-header").style.animation = "s";
    }, 3000);
    document.getElementById("url-input").value = url;
    console.log(url);
    if (BackTab != true) {
        tabURLs[currentTab] = url;
        HistoryTabs[currentTab].push(url);
    };
    BackTab = false;
});
ipc.on("set-title", (event, title) => {
    document.getElementById("refresh-btn-header").style.animation = "s";
    document.getElementById("tab-" + currentTab).title = title.toString();
    document.getElementById("tab-title-" + currentTab).innerHTML = title.toString().length >= 15 ? title.slice(0, 20) : title;
});
// #endregion
setInterval(() => {
    testProxy();
}, 10000);
testProxy();
trackEvent("start-browser");
// End Code
