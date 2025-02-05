
// Start code
// #region Libraries
;
const { open } = require("fs");
const { dirname } = require("path");
const child_process = require("child_process");
const path = require("path");
const shell = require("electron");
const shellEl = require('electron').shell;
const { execPath } = require("process");
const { execFile, spawn, exec } = require("child_process");
var fs = require("fs");
const { readFile } = require("fs/promises");
const axios = require('axios');
const geoip = require('geoip-lite');
const { trackEvent } = require('@aptabase/electron/renderer');
const { type, platform } = require("os");
const versionapp = "1.4.5";
const ipc = require('electron').ipcRenderer;
var sect = "main";
var { NotifApp, RefreshLinks, settingVibe, getWarpKey, links, Onloading, connectVibe, connectWarp, setProxy, offProxy, settingWarp, ConnectedVibe, FindBestEndpointWarp, settingVibe, changeISP, AssetsPath, ResetArgsVibe, ResetArgsWarp, testProxy, KillProcess, connectAuto, connect, isp, disconnectVPN, StatusGuard } = require('../components/connect.js');
// #endregion
// #region Global Var
__dirnameFile = path.join(__dirname.replace("app.asar", ""), "../../");
var Psicountry = ["IR", "AT", "BE", "BG", "BR", "CA", "CH", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GB", "HU", "HR", "IE", "IN", "IT", "JP", "LV", "NL", "NO", "PL", "PT", "RO", "RS", "SE", "SG", "SK", "UA", "US"];
var PsicountryFullname = ["Auto Server", "Austria", "Belgium", "Bulgaria", "Brazil", "Canada", "Switzerland", "Czech Republic", "Germany", "Denmark", "Estonia", "Spain", "Finland", "France", "United Kingdom", "Hungary", "Croatia", "Ireland", "India", "Italy", "Japan", "Latvia", "Netherlands", "Norway", "Poland", "Portugal", "Romania", "Serbia", "Sweden", "Singapore", "Slovakia", "Ukraine", "United States"];
var backgroundList = ["1.png", "2.png", "3.jpg", "4.jpg", "5.jpg", "6.jpg", "7.jpg", "8.jpg", "9.jpg", "10.jpg", "11.jpg", "12.jpg", "13.jpg", "14.jpg", "15.jpg", "16.jpg", "17.jpg"];
var WarpServer = [
    "core,auto;Auto Server",
    "gool,true|scan,true|core,warp;Gool + Scan",
    "gool,true|core,warp;Warp + Gool",
    "scan,true|core,warp;Warp + Scan",
    "reserved,true|core,warp;Warp + Reserved",
    "endpoint,188.114.97.159:942|core,warp;Warp + Endpoint 188.114.97.159:942",
    "endpoint,162.159.192.175:891|core,warp;Warp + Endpoint 162.159.192.175:891",
    "endpoint,162.159.192.36:908|core,warp;Warp + Endpoint 162.159.192.36:908"
];
let importedServers = [
]
// #endregion
// #region all Listener
document.addEventListener("DOMContentLoaded", () => {
    // Onclick Button and Onchange inputs
    ChangeStatusbtn = document.getElementById("ChangeStatus");
    ChangeStatusbtn.onclick = () => {
        saveSetting();
        Onloading();
        connect(core = document.getElementById("core-up-at").value);
    };
    document.getElementById("Gool").onclick = () => {
        if (document.getElementById("Gool").checked) { SetServiceWarp("gool", true); settingWarp["core"] = "warp" }
        else SetServiceWarp("gool", false);
        document.getElementById("core-up-at").value = "warp";
        settingWarp["core"] = "warp";
        saveSetting();
    };
    document.getElementById("Scan").onclick = () => {
        if (document.getElementById("Scan").checked) SetServiceWarp("scan", true);
        else SetServiceWarp("scan", false);
        SetCfon("IR");
        document.getElementById("core-up-at").value = "warp";
        settingWarp["core"] = "warp";
        saveSetting();
    };
    document.getElementById("box-select-country-mini").addEventListener("click", () => {
        if (document.getElementById("box-select-country").style.top != "100vh") {
            document.getElementById("box-select-country").style.height = "0%";
            document.getElementById("box-select-country").style.top = "100vh";
        } else {
            document.getElementById("box-select-country").style.height = "75%";
            document.getElementById("box-select-country").style.display = "grid";
            document.getElementById("box-select-country").style.top = "10vh";
        }
        saveSetting();
    });
    document.getElementById("close-setting").onclick = () => {
        document.getElementById("setting").style.position = "absolute"
        document.getElementById("setting").style.right = "-100vw";
    };
    document.getElementById("selector-ip-version").onchange = () => {
        SetServiceWarp("ipver", document.getElementById("selector-ip-version").value.match(/\d+/g)).toString();
        document.getElementById("core-up-at").value = "warp";
        settingWarp["core"] = "warp";
        saveSetting();

    };
    document.getElementById("end-point-address").onchange = () => {
        SetServiceWarp("endpoint", document.getElementById("end-point-address").value);
        document.getElementById("core-up-at").value = "warp";
        settingWarp["core"] = "warp"
        saveSetting();

    };
    document.getElementById("bind-address-text").onchange = () => {
        SetServiceWarp("proxy", document.getElementById("bind-address-text").value);
        document.getElementById("core-up-at").value = "warp";
        settingWarp["core"] = "warp"
        saveSetting();
    };
    document.getElementById("warp-key-text").onchange = () => {
        SetServiceWarp("warpkey", document.getElementById("warp-key-text").value);
        document.getElementById("core-up-at").value = "warp";
        settingWarp["core"] = "warp"
        saveSetting();

    };
    document.getElementById("dns-warp-text").onchange = () => {
        SetServiceWarp("dns", document.getElementById("dns-warp-text").value);
        document.getElementById("core-up-at").value = "warp";
        settingWarp["core"] = "warp"
        saveSetting();

    };
    document.getElementById("scan-rtt-text").onchange = () => {
        SetServiceWarp("scanrtt", document.getElementById("scan-rtt-text").value);
        document.getElementById("core-up-at").value = "warp";
        settingWarp["core"] = "warp"
        saveSetting();
    };
    document.getElementById("conn-test-text").onchange = () => {
        SetServiceWarp("testUrl", document.getElementById("conn-test-text").value);
        saveSetting();
    };
    document.getElementById("config-fg-text").onchange = () => {
        SetServiceWarp("configfg", document.getElementById("config-fg-text").value);
        settingWarp["core"] = "auto";
        saveSetting();

    };
    document.getElementById("reset-setting-warp-btn").onclick = () => {
        resetSettingWarp();
    };
    document.getElementById("reset-setting-vibe-btn").onclick = () => {
        resetSettingVibe();
    };
    document.getElementById("set-on").onclick = () => {
        StatusGuard = true;
        settingVibe["status"] = true;
        saveSetting();
        ConnectedVibe(settingWarp["core"]);
        testProxy();
    };
    document.getElementById("kill-all-cores").onclick = () => {
        offProxy();
        if (process.platform == "win32") {
            exec("taskkill /F /IM warp-plus.exe");
            exec("taskkill /F /IM HiddifyCli.exe");
        }
        else {
            exec("pkill -f warp-plus");
            exec("pkill -f Hiddify-Cli");
        }
        disconnectVPN();
        testProxy();
    };
    document.getElementById("turn-on-auto-mode").onclick = () => {
        resetSettingWarp(settingWarp["configfg"]);
    };
    document.getElementById("change-background-warp-btn").onclick = () => {
        const randomImage = getRandomImage();
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundImage = `url(../../${randomImage}), linear-gradient(180deg, #252C37 0%, rgba(35, 31, 88, 0.5) 35%, rgba(0, 212, 255, 0.4) 100%)`;
    }
    document.getElementById("refresh-link-btn").onclick = () => {
        RefreshLinks();
        Showmess(5000, "Refreshed links", "success");
    };
    document.getElementById("x-contact").onclick = () => openLink("https://x.com/Freedom_Guard_N")
    document.getElementById("telegram-contact").onclick = () => openLink("https://t.me/freedom_guard_net")
    document.getElementById("mail-contact").onclick = () => openLink("mailto:fwldom@duck.com?subject=Help me")
    document.getElementById("repo-contact").onclick = () => openLink("https://github.com/Freedom-Guard/Freedom-Guard")
    document.getElementById("set-setting-warp").onclick = () => { settingWarp[document.getElementById("set-setting-warp-key").value] = document.getElementById("set-setting-warp-value").value; saveSetting(); SetSettingWarp(); };
    document.getElementById("set-setting-vibe").onclick = () => { settingWarp[document.getElementById("set-setting-vibe-key").value] = document.getElementById("set-setting-vibe-value").value; saveSetting(); SetSettingWarp(); };
    document.getElementById("selector-file-config").addEventListener("change", async (event) => {
        const file = event.target.files[0];
        const arrayBuffer = await file.arrayBuffer();
        const content = new Uint8Array(arrayBuffer);
        write_file(path.join(__dirnameFile, "config.txt"), content);
        settingWarp["configfg"] = "file://" + path.join(__dirnameFile, "config.txt");
        saveSetting();
        SetSettingWarp();
    });
    document.getElementById("submit-config").addEventListener("click", () => importConfig(document.getElementById("config-text").value));
    document.getElementById("ip-ping-warp").onclick = () => testProxy();
    document.getElementById("ip-ping-vibe").onclick = () => testProxy();
});
// #endregion
// #region Functions For Load
function ReloadServers() {
    saveSetting();
    var container = document.getElementById("box-select-country");
    container.innerHTML = "";
    var configBox = document.createElement("div");
    configBox.innerHTML = "Imported Servers <b class='btn' style='max-width:fit-content;max-height:fit-content;display: flex;justify-content: center;'><i class='bx bx-plus' id='add-config-import' onclick='importConfigUSR()'></i></b>";
    configBox.style = "border:none;font-size:1em";
    container.appendChild(configBox);
    try {
        importedServers.forEach((config, index) => {
            config = importedServers[index];
            configBox = document.createElement("div");
            configBox.id = "config-box-imported-sel" + index;
            configBox.classList.add("config-box-imported-sel" + index);
            configBox.title = config;
            let img = document.createElement("img");
            img.src = path.join(__dirnameFile, "src", "svgs", "glob" + ".svg");
            let p = document.createElement("p");
            p.textContent = config.split("#")[1] ?? config.substring(1, 10);
            configBox.appendChild(img);
            configBox.appendChild(p);
            configBox.addEventListener("click", () => {
                importConfig(config);
                document.getElementById("box-select-country").style.display = "none";
            });
            configBox.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                if (confirm("Are you sure you want to delete this imported server?")) {
                    importedServers.splice(index, 1);
                    saveSetting();
                    ReloadServers();
                }
            });
            container.appendChild(configBox);
        })
    }
    catch { }
    configBox = document.createElement("div");
    configBox.innerHTML = "Freedom Warp Server";
    configBox.style = "border:none;font-size:1em";
    container.appendChild(configBox);
    WarpServer.forEach((config, index) => {
        configBox = document.createElement("div");
        configBox.id = "config-box-warp-sel" + index;
        configBox.classList.add("config-box-warp-sel" + index);
        configBox.title = config;
        let img = document.createElement("img");
        img.src = path.join(__dirnameFile, "src", "svgs", "glob" + ".svg");
        let p = document.createElement("p");
        p.textContent = WarpServer[index].split(";")[1];
        configBox.appendChild(img);
        configBox.appendChild(p);
        configBox.addEventListener("click", () => {
            (document.getElementById("Gool").checked) ? document.getElementById("Scan").click() : ("");
            (document.getElementById("Scan").checked) ? document.getElementById("Scan").click() : ("");
            document.getElementById("box-select-country").style.display = "none";
            document.getElementById("config-box-vibe-sel" + index).style.color = "#ff31d1f";
            WarpServer[index].split(";")[0].split("|").forEach(opt => {
                settingWarp[opt.split(",")[0]] = opt.split(",")[1];
            });
            if (settingWarp["core"] == "auto") {
                resetSettingWarp(settingWarp["configfg"]);
            };
            SetSettingWarp();
            document.getElementById("textOfCfon").innerHTML = WarpServer[index].split(";")[1];
            saveSetting();
            document.getElementById("imgOfCfonCustom").src = path.join(__dirnameFile, "src", "svgs", "glob" + ".svg");
        });
        document.getElementById("box-select-country").appendChild(configBox);
    });
    var configBox = document.createElement("div");
    configBox.innerHTML = "Freedom Vibe Server"
    configBox.style = "border:none;font-size:1em"
    container.appendChild(configBox);
    configsVibeName.forEach((config, index) => {
        var configBox = document.createElement("div");
        configBox.id = "config-box-vibe-sel" + index;
        configBox.classList.add("config-box-vibe-sel" + index);
        configBox.title = config;
        let img = document.createElement("img");
        img.src = path.join(__dirnameFile, "src", "svgs", "glob" + ".svg");
        img.id = "imgOfCfon";
        let p = document.createElement("p");
        p.id = "textOfCfonS";
        p.textContent = configsVibeName[index];
        configBox.appendChild(img);
        configBox.appendChild(p);
        configBox.addEventListener("click", () => {
            settingVibe["config"] = configsVibeLink[index];
            (document.getElementById("Scan").checked) ? document.getElementById("Scan").click() : ("");
            document.getElementById("box-select-country").style.display = "none";
            document.getElementById("config-box-vibe-sel" + index).style.color = "#ff31d1f";
            settingWarp["core"] = "vibe";
            document.getElementById("textOfCfon").innerHTML = configsVibeName[index];
            saveSetting();
            document.getElementById("imgOfCfonCustom").src = path.join(__dirnameFile, "src", "svgs", "glob" + ".svg");
            SetSettingWarp();
        });
        document.getElementById("box-select-country").appendChild(configBox);
    });
    var configBox = document.createElement("div");
    configBox.innerHTML = "Freedom Warp Psiphon"
    configBox.style = "border:none;font-size:1em"
    container.appendChild(configBox);
    Psicountry.forEach((country, index) => {
        country = country.toLowerCase()
        let countryDiv = document.createElement("div");
        countryDiv.className = "cfonCountry";
        countryDiv.id = `cfonCountry${country}`;
        countryDiv.title = country;
        let img = document.createElement("img");
        img.src = path.join(__dirnameFile, "src", "svgs", country + ".svg");
        img.id = "imgOfCfon";
        let p = document.createElement("p");
        p.id = "textOfCfonS";
        p.textContent = PsicountryFullname[index];
        countryDiv.appendChild(img);
        countryDiv.appendChild(p);
        container.appendChild(countryDiv);
        countryDiv.addEventListener("click", () => {
            SetCfon(country);
            (document.getElementById("Scan").checked) ? document.getElementById("Scan").click() : ("");
            document.getElementById("box-select-country").style.display = "none";
            settingWarp["core"] = country.toUpperCase() == "IR" ? "auto" : "warp";
            saveSetting();
            SetSettingWarp();
        });
    });
}
function Onload() {
    trackEvent("start-app");
    ResetArgsWarp();
    Loading(3500);
    process.platform == "win32" ? exec(path.join(__dirnameFile, "src", "scripts", "register-url-win.bat")) : ("");
    try {
        // Restore settings from json
        settingWarp = JSON.parse(read_file("freedom-guard.json"))["warp"];
        settingVibe = JSON.parse(read_file("freedom-guard.json"))["vibe"];
        importedServers = JSON.parse(read_file("freedom-guard.json"))["importedServers"];
        SetSettingWarp()
    }
    catch {
        saveSetting()
    }
    testProxy();
    try {
        keyUser = read_file("one.one");
    }
    catch {
        try {
            if (process.platform == "win32") {
                openLink("https://freedom-guard.github.io/Freedom");
            }
            document.getElementById("select-isp").style.display = "flex";
            write_file("one.one", "ok");
            trackEvent("new-user");
        }
        catch { };
        HelpStart();
    }
    if (settingWarp["startup"] !== "warp") {
        if (settingWarp["startup"] == "vibe") {
            LoadVibe();
        }
        else if (settingWarp["startup"] == "browser") {
            global.setTimeout(() => {
                ipc.send("load-browser", "");
            }, 1500);
        }
    };
    checkUpdate();
    ReloadServers();
};
function getRandomImage() {
    const randomIndex = Math.floor(Math.random() * backgroundList.length);
    return "assets/background/" + backgroundList[randomIndex];
};
function checkUpdate() {
    try {
        fetch(`https://raw.githubusercontent.com/Freedom-Guard/Freedom-Guard/refs/heads/main/config/latest.json`)
            .then(response => response.json())
            .then(data => {
                const latestVersion = data.version;
                const currentVersion = versionapp;
                if (latestVersion > currentVersion) {
                    console.log(latestVersion, versionapp)
                    boxNotif("نسخه جدیدی از نرم افزار موجود است. لطفا از لینک زیر دانلود کنید: <br>" + data.messText + " <br> ورژن فعلی: " + currentVersion + " <br> ورژن جدید: " + latestVersion + " <br> "
                        , "https://github.com/Freedom-Guard/Freedom-Guard/releases/latest");
                } else { } // used latest version
            })
            .catch(error => console.error("خطا در دریافت نسخه: ", error));
    }
    catch { }
}
// #endregion
// #region Functions other
function Loading(time = 5000, textloading = "") {
    let loaderImages = ["yalda.png", "mahsa.jpg", "nika.jpg", "sarina.jpg", "kian.jpg", "mehrshad.jpg", "hadis.jpg", "hananeh.jpg", "hamidreza.jpg", "AylarH.jpg"];
    let loaderText = ["به یاد یلدا آقافضلی", "به یاد مهسا امینی", "به یاد نیکا شاکرمی", "به یاد سارینا اسماعیل زاده", "به یاد کیان پیرفلک", "به یاد مهرشاد شهیدی", "به یاد حدیث نجفی", "به یاد حنانه کیا", "به یاد حمید رضا روحی", "به یاد آیلار حقی"];
    let random = Math.floor(Math.random() * loaderImages.length);
    let loaderImage = "../assets/" + loaderImages[random];
    let loaderTxt = loaderText[random];
    document.getElementById("loader-text").innerHTML = loaderTxt;
    document.getElementById('loader-image').src = loaderImage;
    document.getElementById("loading-text").innerHTML = textloading;
    document.getElementById("loading").style.display = "flex";
    process.nextTick(() => {
        global.setTimeout(() => {
            document.getElementById("loading").style.display = "none";
        }, time);
    });

};
function importConfigUSR() {
    document.getElementById('setting-show').click();
    document.getElementById("config").focus();
}
function importConfig(config = "") {
    let isImported = false;
    if (config.startsWith("vless") || config.startsWith("vmess") || config.startsWith("trojan") || config.startsWith("ss") || config.startsWith("hysteria") || config.startsWith("shadowtls") || config.startsWith("tuic") || config.startsWith("socks") || config.startsWith("http") || config.startsWith("https") || config.startsWith("wireguard") || config.startsWith("hy2")) {
        settingWarp["core"] = "vibe";
        settingVibe["config"] = config;
        isImported = true;
    }
    else if (config.startsWith("vibe")) {
        config.replace("vibe://", "").split("&").forEach((item) => {
            settingVibe[item.split("=")[0]] = (item.split("=")[1] == 'true' ? true : item.split("=")[1] == 'false' ? false : item.split("=")[1]);
        });
        isImported = true;
    }
    else if (config.startsWith("freedom-guard")) {
        settingWarp["core"] = config.replace("freedom-guard://", "").split("&")[0].split("=")[1];
        config.replace("freedom-guard://", "").split("&").forEach((item) => {
            if (settingWarp["core"] == "vibe") {
                settingVibe[item.split("=")[0]] = item.split("=")[1];
            }
            else if (settingWarp["core"] == "warp") {
                settingWarp[item.split("=")[0]] = item.split("=")[1];
            }
            else if (settingWarp["core"] == "auto") {
                settingWarp[item.split("=")[0]] = item.split("=")[1];
            }
        });
        isImported = true;
    }
    else if (config.startsWith("warp")) {
        config.replace("warp://", "").split("&").forEach((item) => {
            console.log(item);
            settingWarp[item.split("=")[0]] = (item.split("=")[1] == 'true' ? true : item.split("=")[1] == 'false' ? false : item.split("=")[1]);
        });
        isImported = true;
    }
    else {
        alert("Config not supported");
    }
    if (isImported) {
        isDuplicate = false;
        importedServers.forEach((item, index) => {
            if (item == config) {
                isDuplicate = true;
            }
        });
        if (!isDuplicate) { importedServers.push(config) };
        ReloadServers();
    }
    settingWarp["configAuto"] = config;
    saveSetting();
    ResetArgsVibe();
    ResetArgsWarp();
    SetSettingWarp();
}
function resetSettingVibe() {
    console.log("Reseting setting Vibe ....")
    var settingVibe = {
        "status": false,
        "config": "auto",
        "fragment": false,
        "fragment-size": "",
        "dns-direct": "",
        "dns-remote": "",
        "tun": false
    };
    saveSetting();
    SetSettingWarp();
}
function resetSettingWarp(configFG = "https://raw.githubusercontent.com/Freedom-Guard/Freedom-Guard/main/config/default.json") {
    console.log("Reseting setting Warp ....")
    settingWarp = {
        proxy: "127.0.0.1:8086",
        gool: false,
        scan: false,
        endpoint: "",
        cfon: false,
        cfonc: "IR",
        ipver: 4,
        warpver: "",
        warpkey: "",
        scanrtt: "",
        verbose: false,
        cache: "",
        wgconf: "",
        config: "",
        configAuto: "",
        reserved: "",
        dns: "",
        tun: false,
        startup: "warp",
        isp: "other",
        core: "auto",
        testUrl: "https://x.com",
        timeOutWarpAuto: 30000,
        timeOutVibeAuto: 45000,
        timeOutWarp: 60000,
        timeOutVibe: 60000,
        configfg: configFG
    };
    saveSetting();
    SetSettingWarp();
}
function openLink(url) {
    try {
        shellEl.openExternal(url);
    }
    catch { }
}
async function importConfigFile() {

    const result = await ipcRenderer.invoke("import-config");

    if (result.success) {
        settingWarp = result.data["warp"];
        settingVibe = result.data["vibe"];
        saveSetting();
        SetSettingWarp();
        alert("Configuration imported successfully:", config);
    } else {
        alert(`Error: ${result.error}`);
    }
}
function SetAnim(id, anim) {
    document.getElementById(id).style.animation = anim;
}
function SetAttr(id, attr, value) {
    document.getElementById(id).setAttribute(attr, value);
}
function toggleClass(id, className) {
    document.getElementById(id).classList.toggle(className);
}
function addClass(id, className) {
    document.getElementById(id).classList.add(className);
}
function removeClass(id, className) {
    document.getElementById(id).classList.remove(className);
}
function SetHTML(id, value) {
    document.getElementById(id).innerHTML = value;
};
function SetBorderColor(id, value) {
    document.getElementById(id).style.borderColor = value;
};
function HelpStart(step = 1) {
    var HelpStartElem = document.createElement("div");
    HelpStartElem.dir = "rtl";
    HelpStartElem.style.textAlign = "center";
    HelpStartElem.id = "HelpMess";
    if (step == 1) {
        if (confirm("نیاز به راهنمایی داری؟")) {
            HelpStartElem.innerHTML = `
            اگر روی نماد تنظیمات بزنی میتونی تنظیمات وارپ رو تغییر بدی.
            <br>
            برای بعدی کلیک کنید.`;
            HelpStartElem.style.top = "55px";
            HelpStartElem.style.right = "55px";
            HelpStartElem.style.borderTopRightRadius = "0px";
            HelpStartElem.onclick = () => {
                HelpStart(2);
            };
            document.body.appendChild(HelpStartElem);
        }
    }
    else if (step == 2) {
        HelpStartElem = document.getElementById("HelpMess");
        HelpStartElem.innerHTML = `
        از بخش منو میتونید به بخش های دیگر مثل Freedom Vibe و Freedom Browser و Dns Changer دسترسی داشته باشید.
        <br>
        برای بعدی کلیک کنید.`
        HelpStartElem.style.top = "55px";
        HelpStartElem.style.left = "55px";
        HelpStartElem.style.borderTopRightRadius = "15px";
        HelpStartElem.style.borderTopLeftRadius = "0px";
        HelpStartElem.onclick = () => {
            HelpStart(3);
        };
    }
    else if (step == 3) {
        HelpStartElem = document.getElementById("HelpMess");
        HelpStartElem.innerHTML = `
        بر روی نماد وسط صفحه ضربه بزنید تا گارد آزادی متصل شود
        <br>
        برای پایان کلیک کنید.`;
        HelpStartElem.style.top = "40vh";
        HelpStartElem.style.left = "10vh";
        HelpStartElem.style.borderTopRightRadius = "0px";
        HelpStartElem.style.borderTopLeftRadius = "15px";
        HelpStartElem.onclick = () => {
            HelpStart(4);
        };
    }
    else if (step == 4) {
        HelpStartElem = document.getElementById("HelpMess");
        HelpStartElem.style.display = "none";
    }
}

function SetCfon(country) {
    settingWarp["cfon"] = true;
    settingWarp["cfonc"] = country;
    document.getElementById("textOfCfon").innerHTML = PsicountryFullname[Psicountry.indexOf(country.toString().toUpperCase())];
    document.getElementById("imgOfCfonCustom").src = path.join(__dirnameFile, "src", "svgs", country.toString().toLowerCase() + ".svg");
    ResetArgsWarp();
    saveSetting();
    // Set Psiphon Country 
}
function CloseAllSections() {
    // For Close Sections (Setting & Menu & Psiphon)
    document.getElementById("box-select-country").style.display = "none";
    document.getElementById("menu").style.display = "none";
    document.getElementById("setting").style.display = "none";
    document.getElementById("setting-vibe").style.display = "none";
    document.getElementById("vibe-profile-manage").style.display = "none";
    document.getElementById("profile-add").style.display = "none";
}
function OnEvent(id, event) {
    var event = new Event(event, {
        bubbles: true,
        cancelable: false,
    });
    document.getElementById(id).dispatchEvent(event);
}
function SetSettingWarp() {
    // Restore value setting section
    SetValueInput("selector-ip-version", "IPV" + settingWarp['ipver'])
    SetValueInput("vpn-type-selected", settingWarp["tun"] ? "tun" : "system")
    SetValueInput("start-up-at", settingWarp["startup"])
    SetValueInput("end-point-address", settingWarp["endpoint"]);
    SetValueInput("bind-address-text", settingWarp["proxy"]);
    SetValueInput("warp-key-text", settingWarp["warpkey"]);
    SetValueInput("dns-warp-text", settingWarp["dns"]);
    SetValueInput("scan-rtt-text", settingWarp["scanrtt"]);
    SetValueInput("conn-test-text", settingWarp["testUrl"] ?? "https://fb.com");
    document.getElementById("verbose-status").checked = settingWarp["verbose"];
    SetValueInput("cache-dir", settingWarp["cache"]);
    SetValueInput("wgconfig-dir", settingWarp["wgconf"]);
    SetValueInput("config-dir", settingWarp["config"]);
    document.getElementById("reserved-status").checked = settingWarp["reserved"];
    document.getElementById("Gool").checked = settingWarp["gool"];
    document.getElementById("Scan").checked = settingWarp["scan"];
    SetValueInput("isp-text-guard", settingWarp["isp"])
    SetValueInput("core-up-at", settingWarp["core"])
    SetValueInput("config-fg-text", settingWarp["configfg"])
    SetValueInput("config-text", settingWarp["configAuto"])
    SetHTML("textOfCfon", settingWarp["core"] == "warp" ? PsicountryFullname[Psicountry.indexOf(settingWarp["cfonc"].toUpperCase())] : (configsVibeName[configsVibeLink.indexOf(settingVibe["config"])] == undefined ? (settingWarp["configAuto"].includes("#") ? settingWarp["configAuto"].split("#")[1] : "Vibe Server") : configsVibeName[configsVibeLink.indexOf(settingVibe["config"])]));
    settingWarp["core"] == "vibe" ? document.getElementById("imgOfCfonCustom").src = path.join(__dirnameFile, "src", "svgs", "glob" + ".svg") : SetCfon(Psicountry[Psicountry.indexOf(settingWarp["cfonc"].toUpperCase())]);
}
function SetValueInput(id, Value) {
    // Set Value In Input
    document.getElementById(id).value = Value;
}
function SetServiceWarp(para, status) {
    // Change warp settings
    settingWarp[para] = status;
    ResetArgsWarp();
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function Showmess(time = 2500, text = "message text", type = "info") {
    if (text = "message text") {
        return;
    }
    document.getElementById("message").style.display = "flex";
    document.getElementById("message").style.width = "";
    document.getElementById("message").style.transition = time / 5 + "ms";
    document.getElementById("message-border").style.width = "100%";
    document.getElementById("messageText").innerText = text;
    global.setTimeout(() => {
        document.getElementById("message-border").style.width = "0%";
        document.getElementById("message").style.width = "0%";
        global.setTimeout(() => {
            document.getElementById("message").style.display = "none";
        }, 1000);
    }, time);
}
setInterval(() => {
    document.getElementById("message").style.display = "none";
}, 20000);
// #endregion
// #region Section Setting Warp
document.getElementById("find-best-endpoint").addEventListener("click", () => {
    FindBestEndpointWarp();
});
document.getElementById("isp-text-guard").addEventListener("change", () => {
    changeISP(document.getElementById("isp-text-guard").value);
    settingWarp["isp"] = document.getElementById("isp-text-guard").value;
    saveSetting();
});
document.getElementById("select-isp-mci").addEventListener("click", () => {
    document.getElementById("isp-text-guard").value = "MCI"
    changeISP(document.getElementById("isp-text-guard").value);
    settingWarp["isp"] = document.getElementById("isp-text-guard").value;
    saveSetting();
    document.getElementById("select-isp").style.display = "none";
});
document.getElementById("select-isp-irancell").addEventListener("click", () => {
    document.getElementById("isp-text-guard").value = "IRANCELL"
    changeISP(document.getElementById("isp-text-guard").value);
    settingWarp["isp"] = document.getElementById("isp-text-guard").value;
    saveSetting();
    document.getElementById("select-isp").style.display = "none";
});
document.getElementById("select-isp-other").addEventListener("click", () => {
    document.getElementById("isp-text-guard").value = "other"
    changeISP(document.getElementById("isp-text-guard").value);
    settingWarp["isp"] = document.getElementById("isp-text-guard").value;
    saveSetting();
    document.getElementById("select-isp").style.display = "none";
});
document.getElementById("vpn-type-selected").addEventListener("change", () => {
    if (document.getElementById("vpn-type-selected").value == "tun") {
        SetServiceWarp("tun", true);
    } else SetServiceWarp("tun", false);
});
document.getElementById("start-up-at").addEventListener("change", () => {
    SetServiceWarp("startup", document.getElementById("start-up-at").value);
});
document.getElementById("verbose-status").addEventListener("change", () => {
    if (document.getElementById("verbose-status").checked) SetServiceWarp("verbose", true);
    else SetServiceWarp("verbose", false);
});
document.getElementById("reserved-status").addEventListener("change", () => {
    if (document.getElementById("reserved-status").checked) SetServiceWarp("reserved", true);
    else SetServiceWarp("reserved", false);
});
document.getElementById("setting-show").addEventListener("click", () => {
    document.getElementById("setting").style.display = "flex";
    document.getElementById("setting").style.position = "absolute";
    document.getElementById("setting").style.right = "0";
});
document.getElementById("setting-show-vibe").addEventListener("click", () => {
    if (document.getElementById("setting-vibe").style.display == "") {
        CloseAllSections();
        document.getElementById("setting-vibe").style.display = "flex";
    } else {
        document.getElementById("setting-vibe").style.display = "";
    }
});
document.getElementById("menu-about").addEventListener("click", () => { document.getElementById("about-app").style.display = "flex" })
document.getElementById("more-options").addEventListener("click", () => { document.getElementById("more-options-content").classList.toggle("active") })
document.getElementById("about").addEventListener("click", () => { document.getElementById("about-app").style.display = "flex" })
document.getElementById("get-key-warp").addEventListener("click", () => { getWarpKey(); })
document.getElementById("export-config").addEventListener("click", () => { ipcRenderer.send("export-settings", { "vibe": settingVibe, "warp": settingWarp }) })
document.getElementById("import-config-file").addEventListener("click", () => { importConfigFile() })
document.getElementById("close-about").addEventListener("click", () => { document.getElementById("about-app").style.display = "" })
//#endregion
// #region Section Menu
document.getElementById("menu-show").onclick = () => {
    document.getElementById("menu").classList.toggle("show")
};
document.getElementById("menu-freedom-vibe").onclick = () => {
    Loading();
    LoadVibe();
};
document.getElementById("menu-freedom-browser").onclick = () => {
    ipc.send("load-browser", "")
};
document.getElementById("menu-freedom-plus").onclick = () => {
    ipc.send("load-file", "./src/plus/index.html")
};
document.getElementById("menu-dns").onclick = () => { document.getElementById("dns-set").style.display = "flex" };
document.getElementById("menu-exit").onclick = () => {
    document.getElementById("menu").classList.toggle("show")
};
document.getElementById("menu-exit-app").onclick = () => {
    ipc.send("exit-app", "")
};
// #endregion
// #region Section Freedom-Vibe

var configsVibeName = [
    "Auto",
    "VPN | FAIL",
    "V2RAY | COLLECT",
    "TVC | MIX",
    "Free | Sub V2ray",
    "AzadNet | META IRAN",
    "WARP | IRCF",
    "TELEGRAM | V2RAY",
    "TVC | VLESS",
    "ALL | FREE",

];
var configsVibeLink = [
    "auto",
    "https://raw.githubusercontent.com/imyebekhe/vpn-fail/refs/heads/main/sub-link",
    "https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/Eternity",
    "https://raw.githubusercontent.com/yebekhe/TVC/main/subscriptions/xray/normal/mix",
    "https://raw.githubusercontent.com/ALIILAPRO/v2rayNG-Config/main/sub.txt",
    "https://raw.githubusercontent.com/AzadNetCH/Clash/main/AzadNet_META_IRAN-Direct.yml",
    "https://raw.githubusercontent.com/ircfspace/warpsub/main/export/warp",
    "https://raw.githubusercontent.com/yebekhe/TelegramV2rayCollector/main/sub/base64/mix",
    "https://raw.githubusercontent.com/yebekhe/TVC/main/subscriptions/xray/base64/vless",
    "https://raw.githubusercontent.com/saeidghodrati/V2ray-FREE-configs/main/All_Configs_base64_Sub.txt"
];
function LoadVibe() {
    document.getElementById("freedom-vibe").style.display = "flex";
    try {
        configsVibeName = JSON.parse(read_file("freedom-guard.json"))["configsVibeName"]; // Load Setting From File.json 
        configsVibeLink = JSON.parse(read_file("freedom-guard.json"))["configsVibeLink"]; // Load Setting From File.json 
    }
    catch {
        saveSetting();
        SaveConfigsVibe();
    }
    if (settingVibe["config"] == "") {
        settingVibe["config"] = "auto";
    }
    settingVibe["status"] = false;
    document.getElementById("vpn-type-selected-vibe").value = settingVibe["tun"] ? "tun" : "system";
    document.getElementById("config-vibe-text").value = settingVibe["config"];
    document.getElementById("dns-direct-address").value = settingVibe["dns-direct"];
    document.getElementById("dns-remote-address").value = settingVibe["dns-remote"];
    document.getElementById("fragment-status-vibe").checked = settingVibe["fragment"];
    document.getElementById("fragment-vibe-size-text").value = settingVibe["fragment-size"];
}
async function saveSetting() {
    // Save all settings and config in freedom-guard.json
    write_file("freedom-guard.json", JSON.stringify({
        "vibe": settingVibe,
        "warp": settingWarp,
        "links": links,
        "configsVibeLink": configsVibeLink,
        "configsVibeName": configsVibeName,
        "importedServers": importedServers
    }));
    ResetArgsVibe();
    ResetArgsWarp();
}
// function Read File and Write  
read_file = function (path) {
    return fs.readFileSync(path, 'utf8');
}
write_file = function (path, output) {
    fs.writeFileSync(path, output);
}
function LoadVibeProfileManager() {
    document.getElementById("vibe-profile-manage").style.display = "flex";
    document.getElementById("vibe-profile-list").innerHTML = "";
    configsVibeName.forEach((config, index) => {
        var configBox = document.createElement("div");
        configBox.id = "config-box-vibe-sel";
        configBox.title = config;
        configBox.innerHTML = config;
        configBox.addEventListener("click", () => {
            settingVibe["config"] = configsVibeLink[index];
            saveSetting();
            SaveConfigsVibe();
            document.getElementById("status-vibe").innerHTML = config;
            document.getElementById("status-vibe-sel").innerHTML = config;

            CloseAllSections();
        });
        configBox.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to delete this profile?")) {
                configsVibeName.splice(index, 1);
                configsVibeLink.splice(index, 1);
                SaveConfigsVibe();
                document.getElementById("vibe-profile-list").innerHTML = "";
                LoadVibeProfileManager();
            };
        });
        document.getElementById("vibe-profile-list").appendChild(configBox);
        console.log(index);
    });
}
function SaveConfigsVibe() {
    saveSetting();
}
document.getElementById("changeStatus-vibe").onclick = () => connectVibe();
document.getElementById("close-vibe").onclick = () => document.getElementById("freedom-vibe").style.display = "none";
document.getElementById("close-setting-vibe").onclick = () => {
    document.getElementById("setting-vibe").style.display = "none";
};
document.getElementById("fragment-status-vibe").addEventListener("click", () => {
    if (document.getElementById("fragment-status-vibe").checked) {
        settingVibe["fragment"] = true;
        document.getElementById("fragment-vibe-size-text").removeAttribute("disabled");
    }
    else {
        settingVibe["fragment"] = false;
        document.getElementById("fragment-vibe-size-text").setAttribute("disabled", "");
    }
    saveSetting();
    ResetArgsVibe();
});
document.getElementById("vibe-profile").addEventListener("click", () => {
    LoadVibeProfileManager();
});
document.getElementById("close-vibe-profile").addEventListener("click", () => {
    CloseAllSections();
});
document.getElementById("add-config-vibe").addEventListener("click", () => {
    document.getElementById("profile-add").style.display = "flex";
});
document.getElementById("add-config-vibe-submit").addEventListener("click", () => {
    if (document.getElementById("add-config-vibe-link").value.trim().length > 2) {
        configsVibeName.push(document.getElementById("add-config-vibe-name").value);
        configsVibeLink.push(document.getElementById("add-config-vibe-link").value);
        document.getElementById("profile-add").style.display = "none";
        SaveConfigsVibe();
        CloseAllSections();
        LoadVibeProfileManager();
    }
    else {
        alert("Invalid link");
    }
});
document.getElementById("fragment-vibe-size-text").addEventListener("change", () => {
    console.log(document.getElementById("fragment-vibe-size-text").value);
    settingVibe["fragment-size"] = document.getElementById("fragment-vibe-size-text").value;
    document.getElementById("fragment-status-vibe").checked ? settingVibe["fragment"] = true : settingVibe["fragment"] = false;
    saveSetting();
    ResetArgsVibe();
});
document.getElementById("dns-direct-address").addEventListener("change", () => {
    settingVibe["dns-direct"] = document.getElementById("dns-direct-address").value;
    saveSetting();
    ResetArgsVibe();
});
document.getElementById("dns-remote-address").addEventListener("change", () => {
    settingVibe["dns-remote"] = document.getElementById("dns-remote-address").value;
    saveSetting();
    ResetArgsVibe();
});
document.getElementById("config-vibe-text").addEventListener("change", () => {
    settingVibe["config"] = document.getElementById("config-vibe-text").value;
    saveSetting();
    ResetArgsVibe();
});
document.getElementById("vpn-type-selected-vibe").addEventListener("change", () => {
    document.getElementById("vpn-type-selected-vibe").value == "tun" ? settingVibe["tun"] = true : settingVibe["tun"] = false;
    saveSetting();
    ResetArgsVibe();
});
document.getElementById("close-vibe-profile-add").addEventListener("click", () => {
    document.getElementById("profile-add").style.display = "none";
});
//#endregion
// #region Section Set Dns
document.getElementById("close-dns").onclick = () => (document.getElementById("dns-set").style.display = "");
document.getElementById("submit-dns").onclick = () => SetDNS(document.getElementById("dns1-text").value, document.getElementById("dns2-text").value);
function SetDNS(dns1, dns2) {
    const { exec } = require("child_process");
    const path = require("path");


    if (!(dns1 !== "" && dns2 !== "")) {
        console.error("Please provide valid DNS addresses.");
        alert("Please enter valid Primary and Secondary DNS!");
        return;
    }

    // بررسی پلتفرم و اجرای فایل مناسب
    if (process.platform === "linux") {
        exec(
            `"${path.join(
                __dirnameFile,
                "src",
                "main",
                "cores",
                "dns",
                "set_dns-gn.sh"
            )}" ${dns1} ${dns2}`,
            (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error: ${error.message}`);
                    alert("Failed to change DNS: " + error.message);
                    return;
                }
                if (stderr) {
                    console.error(`Stderr: ${stderr}`);
                    alert("Failed to change DNS: " + stderr);
                    return;
                }
                console.log(stdout);
                alert("DNS successfully changed!");
            }
        );
    } else if (process.platform === "win32") {
        exec(
            `"${path.join(
                __dirnameFile,
                "src",
                "main",
                "cores",
                "dns",
                "set_dns-ms.bat"
            )}" ${dns1} ${dns2}`,
            (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error: ${error.message}`);
                    alert("Failed to change DNS: " + error.message);
                    return;
                }
                if (stderr) {
                    console.error(`Stderr: ${stderr}`);
                    alert("Failed to change DNS: " + stderr);
                    return;
                }
                console.log(stdout);
                alert("DNS successfully changed!");
            }
        );
    } else {
        console.error("Unsupported platform");
        alert("This platform is not supported.");
    }


}
//#endregion
// #region deep links 
const { ipcRenderer } = require('electron');
const { randomBytes } = require("crypto");
const { setTimeout } = require("timers/promises");
const { Console } = require("console");
ipcRenderer.on('start-vibe', (event, ev) => {
    ResetArgsVibe();
    LoadVibe();
    connectVibe();
});
ipcRenderer.on('start-warp', (event, ev) => {
    ResetArgsWarp();
    connectWarp();
});
ipcRenderer.on('start-fg', (event, key, value) => {
    saveSetting();
    Onloading();
    connect(core = document.getElementById("core-up-at").value);
});

ipcRenderer.on('set-warp-true', (event, key) => {
    settingWarp[`${key}`] = true;
    ResetArgsWarp();
    SetSettingWarp();
});
function getQueryParams(url) {
    const params = {};
    const arrayUrl = url.split("&")
    arrayUrl.forEach(para => {
        var divPara = para.split("=");
        params[divPara[0]] = divPara[1];
    });
    return params;
}
var queryParams = getQueryParams(window.location.href);
ipcRenderer.on('start-link', (event, link) => {
    link = link.replace("freedom-guard:", "").replace("?", "");
    importConfig(link);
});
// #endregion
// #region Interval Timers and Loads
Onload();
setInterval(() => {
    saveSetting();
}, 7500);

//#endregion
// End code
