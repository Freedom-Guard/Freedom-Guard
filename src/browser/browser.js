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
    return regex.test(url) || /^https?:\/\/[^\s]+$/.test(url) || /^file?:\/\/[^\s]+$/.test(url) || /^http?:\/\/[^\s]+$/.test(url);
};
function addHttpsIfNecessary(urlInput) {
    // 检查 URL 是否包含 .com 或其他 TLDs
    if (!/^https?:\/\//.test(urlInput) && /\.(com|org|net|edu|gov|mil|biz|info|name|museum|aero|asia|cat|coop|int|jobs|mobi|museum|post|pro|tel|travel|xxx|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cx|cy|cz|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|ss|st|su|sv|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|za|zm|zw)$/.test(urlInput)) {
        urlInput = "https://" + urlInput;
    }
    return urlInput.replace(" ", "%20");
}
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
    ipc.send("go-back");
}
ipc.on("go-back-false", () => {
    document.getElementById("back-btn-header").classList.add("deactive");
});
ipc.on("go-back-true", () => {
    document.getElementById("back-btn-header").classList.remove("deactive");
})
ipc.on("go-forward-true", () => {
    document.getElementById("forward-btn-header").classList.remove("deactive");
})
ipc.on("go-forward-false", () => {
    document.getElementById("forward-btn-header").classList.add("deactive");
})
async function Forward() {
    ipc.send("go-forward");
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
    document.getElementById("menu").style.display = "";
    this.title = (this.title === "menushow") ? "menuhide" : "menushow";
    HideAllContentMenu();
});

document.getElementById("url-input").addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById("search-btn-header").click();
    }
});
document.getElementById("back-btn-header").addEventListener("click", Back);
document.getElementById("forward-btn-header").addEventListener("click", Forward);
document.getElementById("home-btn-header").addEventListener('click', () => {
    document.getElementById("url-input").value = document.getElementById("default-home-page").value;
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
    tabURLs[idTab] = document.getElementById("default-home-page").value;
    TabSelect(idTab);
    ipc.send("show-browser");
});

document.getElementById("search-btn-header").addEventListener("click", function () {
    const inputUrl = document.getElementById("url-input").value;
    urlInput = isValidURL(inputUrl) ? `${inputUrl}` : `https://google.com/search?q=${inputUrl}`;
    urlInput = addHttpsIfNecessary(urlInput);
    document.getElementById("refresh-btn-header").style.animation = "spin 1s linear infinite";
    ipc.send("load-url-browser", urlInput);
});

document.getElementById("vpn-btn-header").addEventListener("click", function () {
    ConnectVPN();
});

document.getElementById("refresh-btn-header").addEventListener("click", function () {
    const inputUrl = document.getElementById("url-input").value;
    urlInput = `${inputUrl}`;
    document.getElementById("refresh-btn-header").style.animation = "spin 1s linear infinite";
    ipc.send("load-url-browser", urlInput);
});

document.getElementById("close-browser").addEventListener("click", function () {
    settingWarp = JSON.parse(read_file("freedom-guard.json"))["warp"];
    settingVibe = JSON.parse(read_file("freedom-guard.json"))["vibe"];
    links = JSON.parse(read_file("freedom-guard.json"))["links"];
    configsVibeName = JSON.parse(read_file("freedom-guard.json"))["configsVibeName"];
    configsVibeLink = JSON.parse(read_file("freedom-guard.json"))["configsVibeLink"];
    settingWarp["startup"] = "warp";
    write_file("freedom-guard.json", JSON.stringify({
        "vibe": settingVibe,
        "warp": settingWarp,
        "links": links,
        "configsVibeLink": configsVibeLink,
        "configsVibeName": configsVibeName
    }));
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
ipc.on('open-new-tab', (event, url) => {
    tabCount += 1;
    const idTab = tabCount;
    tabs.push(idTab);
    document.getElementById("tab-list").innerHTML += `
    <div class='tab' id='tab-${idTab}' onclick='TabSelect(${idTab})'>
    <div class='tab-title' id='tab-title-${idTab}'>New Tab</div>
    <div class='tab-icon' id='tab-icon-${idTab}'></div>
    <div class='tab-close' id='tab-close-${idTab}' onclick='TabClose(${idTab})'><i class="bi bi-x"></i></div>`;
    HistoryTabs.push([]);
    tabURLs[idTab] = url;
    TabSelect(idTab);
    ipc.send("show-browser");
});
setInterval(testProxy, 10000);
testProxy();
trackEvent("start-browser");
// End Code
