const { ipcRenderer: ipc } = require('electron');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { trackEvent } = require('@aptabase/electron/renderer');
const $ = require('jquery');
const { Connect, ConnectAuto, Test, PublicSet, Tools } = require('../components/connect');


const ConnectST = new Connect();
const ConnectAutoST = new ConnectAuto();
const publicSetST = new PublicSet();
let tabs = []; // [{id, url, title, icon, history, historyIndex}]
let currentTabId = null;
let tabCount = -1;

function isValidURL(url) {
    const regex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(\/[^\s]*)?$/;
    return regex.test(url) || /^https?:\/\/[^\s]+$/.test(url) || /^file?:\/\/[^\s]+$/.test(url);
}

function addHttpsIfNecessary(url) {
    const tldRegex = /\.(com|org|net|edu|gov|mil|biz|info|name|museum|aero|asia|cat|coop|int|jobs|mobi|post|pro|tel|travel|xxx|ac|ad|ae|af|ag|ai|al|am|ao|ar|as|at|au|aw|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cx|cy|cz|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sk|sl|sm|sn|so|sr|ss|st|su|sv|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|za|zm|zw)$/;
    if (!/^https?:\/\//.test(url) && tldRegex.test(url)) {
        url = "https://" + url;
    }
    return url.replace(" ", "%20");
}

function updateNavigationButtons(tab) {
    const backBtn = document.getElementById("back-btn-header");
    const forwardBtn = document.getElementById("forward-btn-header");
    backBtn.classList.toggle("deactive", tab.historyIndex <= 0);
    forwardBtn.classList.toggle("deactive", tab.historyIndex >= tab.history.length - 1);
}

function TabClose(id) {
    const tabIndex = tabs.findIndex(t => t.id === id);
    if (tabIndex === -1) return;

    document.getElementById(`tab-${id}`).remove();
    tabs.splice(tabIndex, 1);
    tabCount--;

    if (tabs.length === 0) {
        currentTabId = null;
        document.getElementById("url-input").value = "";
        ipc.send("hide-browser");
        return;
    }

    // Select the previous tab or the last one
    const newTabIndex = tabIndex > 0 ? tabIndex - 1 : 0;
    TabSelect(tabs[newTabIndex].id);
}

function TabSelect(id) {
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;

    currentTabId = id;
    document.getElementById("url-input").value = tab.url;
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(`tab-${id}`).classList.add("active");
    updateNavigationButtons(tab);
    ipc.send("load-url-browser", tab.url);
}

async function Back() {
    const tab = tabs.find(t => t.id === currentTabId);
    if (!tab || tab.historyIndex <= 0) return;

    tab.historyIndex--;
    tab.url = tab.history[tab.historyIndex];
    document.getElementById("url-input").value = tab.url;
    updateNavigationButtons(tab);
    ipc.send("load-url-browser", tab.url);
}

async function Forward() {
    const tab = tabs.find(t => t.id === currentTabId);
    if (!tab || tab.historyIndex >= tab.history.length - 1) return;

    tab.historyIndex++;
    tab.url = tab.history[tab.historyIndex];
    document.getElementById("url-input").value = tab.url;
    updateNavigationButtons(tab);
    ipc.send("load-url-browser", tab.url);
}

function read_file(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error("Error reading file:", err);
        return null;
    }
}

function write_file(filePath, output) {
    try {
        fs.writeFileSync(filePath, output);
    } catch (err) {
        console.error("Error writing file:", err);
    }
}

function HideAllContentMenu() {
    ["content-menu-settings", "content-menu-vpn", "content-menu-bookmark"].forEach(id => {
        document.getElementById(id).style.display = "none";
    });
}

function loadBrowser() {
    if (tabCount === -1) document.getElementById("add-tab").click();
}

document.addEventListener("DOMContentLoaded", loadBrowser);

document.getElementById("menu-btn-header").addEventListener("click", function () {
    const menu = document.getElementById("menu");
    menu.style.display = menu.style.display === "none" ? "" : "none";
    this.title = menu.style.display === "" ? "menuhide" : "menushow";
    if (menu.style.display === "") {
        ipc.send("hide-browser");
        HideAllContentMenu();
    } else {
        ipc.send("show-browser");
    }
});

document.getElementById("url-input").addEventListener("keydown", (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById("search-btn-header").click();
    }
});

document.getElementById("back-btn-header").addEventListener("click", Back);
document.getElementById("forward-btn-header").addEventListener("click", Forward);

document.getElementById("home-btn-header").addEventListener("click", () => {
    const homePage = document.getElementById("default-home-page").value;
    document.getElementById("url-input").value = homePage;
    document.getElementById("search-btn-header").click();
});

document.getElementById("add-tab").addEventListener("click", function () {
    tabCount++;
    const id = tabCount;
    const newTab = {
        id,
        url: document.getElementById("default-home-page").value,
        title: "New Tab",
        icon: "",
        history: [],
        historyIndex: -1
    };
    tabs.push(newTab);

    const tabElement = document.createElement("div");
    tabElement.className = "tab";
    tabElement.id = `tab-${id}`;
    tabElement.innerHTML = `
        <div class='tab-title' id='tab-title-${id}'>${newTab.title}</div>
        <div class='tab-icon' id='tab-icon-${id}'></div>
        <div class='tab-close' id='tab-close-${id}'><i class="bi bi-x"></i></div>`;
    tabElement.addEventListener("click", () => TabSelect(id));
    tabElement.querySelector(".tab-close").addEventListener("click", (e) => {
        e.stopPropagation();
        TabClose(id);
    });

    document.getElementById("tab-list").appendChild(tabElement);
    TabSelect(id);
    ipc.send("show-browser");
});

document.getElementById("vpn-btn-header").addEventListener("click", async function () {
    $("#vpn-btn-header").removeClass("active");
    $("#vpn-btn-header").addClass("active");
    await publicSetST.reloadSettings();
    if (publicSetST.status == false) {
        publicSetST.status = true;
        if (publicSetST.settingsALL["public"]["core"] == "auto") {
            await ConnectAutoST.connect();
        }
        else {
            await ConnectST.connect();
        }
        $("#vpn-btn-header").removeClass("active");
        $("#vpn-btn-header").addClass("connected");
    }
    else {
        $("#vpn-btn-header").removeClass("active");
        $("#vpn-btn-header").removeClass("connected");
        publicSetST.status = false;
        publicSetST.connected = false;
        ConnectST.killVPN(this.publicSet.settingsALL["public"]["core"]);
        ConnectAutoST.killVPN(this.publicSet.settingsALL["public"]["core"]);
    }
})
window.disconnectedUI = () => {
    $("#vpn-btn-header").removeClass("active");
    publicSetST.status = false;
    publicSetST.connected = false;
};
window.connectedUI = () => {
    $("#vpn-btn-header").removeClass("active");
    $("#vpn-btn-header").addClass("connected");
}
document.getElementById("search-btn-header").addEventListener("click", function () {
    let inputUrl = document.getElementById("url-input").value;
    inputUrl = isValidURL(inputUrl) ? inputUrl : `https://google.com/search?q=${encodeURIComponent(inputUrl)}`;
    inputUrl = addHttpsIfNecessary(inputUrl);

    const tab = tabs.find(t => t.id === currentTabId);
    if (!tab) return;

    tab.url = inputUrl;
    tab.history = tab.history.slice(0, tab.historyIndex + 1);
    tab.history.push(inputUrl);
    tab.historyIndex++;
    updateNavigationButtons(tab);

    document.getElementById("refresh-btn-header").style.animation = "spin 1s linear infinite";
    ipc.send("load-url-browser", inputUrl);
});

document.getElementById("refresh-btn-header").addEventListener("click", function () {
    const tab = tabs.find(t => t.id === currentTabId);
    if (!tab) return;

    document.getElementById("refresh-btn-header").style.animation = "spin 1s linear infinite";
    ipc.send("load-url-browser", tab.url);
});

document.getElementById("close-browser").addEventListener("click", function () {
    const settings = JSON.parse(read_file("freedom-guard.json") || "{}");
    settings["warp"] = settings["warp"] || {};
    settings["warp"]["startup"] = "warp";
    write_file("freedom-guard.json", JSON.stringify(settings));
    ipc.send("load-main-app");
});

ipc.on("go-back-false", () => {
    const tab = tabs.find(t => t.id === currentTabId);
    if (tab) updateNavigationButtons(tab);
});

ipc.on("go-back-true", () => {
    const tab = tabs.find(t => t.id === currentTabId);
    if (tab) updateNavigationButtons(tab);
});

ipc.on("go-forward-true", () => {
    const tab = tabs.find(t => t.id === currentTabId);
    if (tab) updateNavigationButtons(tab);
});

ipc.on("go-forward-false", () => {
    const tab = tabs.find(t => t.id === currentTabId);
    if (tab) updateNavigationButtons(tab);
});

ipc.on("set-url", (event, url) => {
    const tab = tabs.find(t => t.id === currentTabId);
    if (!tab) return;

    tab.url = url;
    tab.history = tab.history.slice(0, tab.historyIndex + 1);
    tab.history.push(url);
    tab.historyIndex++;
    document.getElementById("url-input").value = url;
    updateNavigationButtons(tab);
    document.getElementById("refresh-btn-header").style.animation = "";
});

ipc.on("set-title", (event, title) => {
    const tab = tabs.find(t => t.id === currentTabId);
    if (!tab) return;

    tab.title = title;
    document.getElementById(`tab-${tab.id}`).title = title;
    document.getElementById(`tab-title-${tab.id}`).textContent = title.length > 20 ? `${title.slice(0, 20)}...` : title;
    document.getElementById("refresh-btn-header").style.animation = "";
});

ipc.on("open-new-tab", (event, url) => {
    tabCount++;
    const id = tabCount;
    const newTab = {
        id,
        url,
        title: "New Tab",
        icon: "",
        history: [url],
        historyIndex: 0
    };
    tabs.push(newTab);

    const tabElement = document.createElement("div");
    tabElement.className = "tab";
    tabElement.id = `tab-${id}`;
    tabElement.innerHTML = `
        <div class='tab-title' id='tab-title-${id}'>${newTab.title}</div>
        <div class='tab-icon' id='tab-icon-${id}'></div>
        <div class='tab-close' id='tab-close-${id}'><i class="bi bi-x"></i></div>`;
    tabElement.addEventListener("click", () => TabSelect(id));
    tabElement.querySelector(".tab-close").addEventListener("click", (e) => {
        e.stopPropagation();
        TabClose(id);
    });

    document.getElementById("tab-list").appendChild(tabElement);
    TabSelect(id);
    ipc.send("show-browser");
});

trackEvent("start-browser");