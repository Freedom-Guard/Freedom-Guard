
// Start code
// #region Libraries
;
const { open } = require("fs");
const { dirname } = require("path");
const child_process = require("child_process");
const path = require("path");
const shell = require("electron");
const { execPath } = require("process");
const { execFile, spawn, exec } = require("child_process");
const { remote } = require('electron');
var fs = require("fs");
const { readFile } = require("fs/promises");
const axios = require('axios'); // Import axios
const { type, platform } = require("os");
const geoip = require('geoip-lite');
const versionapp = "1.3.1";
const ipc = require('electron').ipcRenderer;
const { trackEvent } = require('@aptabase/electron/renderer');
var sect = "main";
var { Onloading, connectVibe, connectWarp, setProxy, offProxy, settingWarp, ConnectedVibe, FindBestEndpointWarp, settingVibe, changeISP, AssetsPath, ResetArgsVibe, ResetArgsWarp, testProxy, KillProcess, connectAuto, connect, isp } = require('./connect.js');
// #endregion
// #region Global Var
__dirname = __dirname.replace("app.asar", "")
var Psicountry = ["IR", "AT", "BE", "BG", "BR", "CA", "CH", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GB", "HU", "HR", "IE", "IN", "IT", "JP", "LV", "NL", "NO", "PL", "PT", "RO", "RS", "SE", "SG", "SK", "UA", "US"];
var PsicountryFullname = ["Auto Server", "Austria", "Belgium", "Bulgaria", "Brazil", "Canada", "Switzerland", "Czech Republic", "Germany", "Denmark", "Estonia", "Spain", "Finland", "France", "United Kingdom", "Hungary", "Croatia", "Ireland", "India", "Italy", "Japan", "Latvia", "Netherlands", "Norway", "Poland", "Portugal", "Romania", "Serbia", "Sweden", "Singapore", "Slovakia", "Ukraine", "United States"];
var backgroundList = ["1.png", "2.png", "3.jpg", "4.jpg", "5.jpg", "6.jpg", "7.jpg", "8.jpg", "9.jpg", "10.jpg", "11.jpg", "12.jpg","13.jpg","14.jpg","15.jpg","16.jpg"];
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
        document.getElementById("setting").style.right = "-150vw";
        document.getElementById("setting").style.visibility = "0.3";
        setTimeout(() => {
            document.getElementById("setting").style.display = "";
        }, 1300);
    };
    document.getElementById("selector-ip-version").onchange = () => {
        SetServiceWarp("ipver", document.getElementById("selector-ip-version").value.match(/\d+/g)).toString();
        document.getElementById("core-up-at").value = "warp";
        settingWarp["core"] = "warp";
    };
    document.getElementById("end-point-address").onchange = () => {
        SetServiceWarp("endpoint", document.getElementById("end-point-address").value);
        document.getElementById("core-up-at").value = "warp";
        settingWarp["core"] = "warp"
    };
    document.getElementById("bind-address-text").onchange = () => {
        SetServiceWarp("proxy", document.getElementById("bind-address-text").value);
        document.getElementById("core-up-at").value = "warp";
        settingWarp["core"] = "warp"
    };
    document.getElementById("warp-key-text").onchange = () => {
        SetServiceWarp("warpkey", document.getElementById("warp-key-text").value);
        document.getElementById("core-up-at").value = "warp";
        settingWarp["core"] = "warp"
    };
    document.getElementById("dns-warp-text").onchange = () => {
        SetServiceWarp("dns", document.getElementById("dns-warp-text").value);
        document.getElementById("core-up-at").value = "warp";
        settingWarp["core"] = "warp"
    };
    document.getElementById("scan-rtt-text").onchange = () => {
        SetServiceWarp("scanrtt", document.getElementById("scan-rtt-text").value);
        document.getElementById("core-up-at").value = "warp";
        settingWarp["core"] = "warp"
    };
    document.getElementById("config-fg-text").onchange = () => {
        SetServiceWarp("configfg", document.getElementById("config-fg-text").value);
        settingWarp["core"] = "auto";
    };
    document.getElementById("reset-setting-warp-btn").onclick = () => {
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
            reserved: "",
            dns: "",
            tun: false,
            startup: "warp",
            isp: "other",
            core: "auto",
            "configfg": "https://raw.githubusercontent.com/fwldom/Freedom-Guard/main/config/links.json"
        };
        saveSetting();
        SetSettingWarp();
    };
    document.getElementById("change-background-warp-btn").onclick = () => {
        const randomImage = getRandomImage();
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundImage = `url(${randomImage}), linear-gradient(180deg, #252C37 0%, rgba(35, 31, 88, 0.5) 35%, rgba(0, 212, 255, 0.4) 100%)`;
    }
});
// #endregion
// #region For Connections Warp

// #endregion
// #region Functions For Load
function Onload() {
    trackEvent("start-app");
    ResetArgsWarp();
    process.platform == "win32" ? exec(path.join(__dirname, "register-url-win.bat")) : ("");
    // Start Add Element Countries to box select country psiphon
    var container = document.getElementById("box-select-country");
    var configBox = document.createElement("div");
    configBox.innerHTML = "Freedom Warp Psiphon"
    configBox.style = "border:none;font-size:1em"
    container.innerHTML = ""
    container.appendChild(configBox);
    Psicountry.forEach((country, index) => {
        country = country.toLowerCase()
        let countryDiv = document.createElement("div");
        countryDiv.className = "cfonCountry";
        countryDiv.id = `cfonCountry${country}`;
        countryDiv.title = country;
        let img = document.createElement("img");
        img.src = path.join(__dirname, "svgs", country + ".svg");
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
        img.src = path.join(__dirname, "svgs", "glob" + ".svg");
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
            document.getElementById("imgOfCfonCustom").src = path.join(__dirname, "svgs", "glob" + ".svg");
            SetSettingWarp();
        });
        document.getElementById("box-select-country").appendChild(configBox);
    });
    // End Added All Elements
    try {
        // Restore var settingWarp  from json
        settingWarp = JSON.parse(read_file("warp.json"));
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
                exec("start https://fwldom.github.io/Freedom");
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
            setTimeout(() => {
                ipc.send("load-browser", "");
            }, 1500);
        }
    };
  
};
function getRandomImage() {
    const randomIndex = Math.floor(Math.random() * backgroundList.length);
    return "assets/background/" + backgroundList[randomIndex];
};
// #endregion
// #region Functions other
function SetAnim(id, anim) {
    document.getElementById(id).style.animation = anim;
}
function SetAttr(id, attr, value) {
    document.getElementById(id).setAttribute(attr, value);
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
        از بخش منو میتونید به بخش های دیگر مثل Freedom Vibe و Freedom Get و Dns Changer دسترسی داشته باشید.
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
        بر روی نماد وسط صفحه ضربه بزنید تا Freedom Warp متصل شود
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
    document.getElementById("imgOfCfonCustom").src = path.join(__dirname, "svgs", country.toString().toLowerCase() + ".svg");
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
    SetHTML("textOfCfon", settingWarp["core"] == "warp" ? PsicountryFullname[Psicountry.indexOf(settingWarp["cfonc"].toUpperCase())] : configsVibeName[configsVibeLink.indexOf(settingVibe["config"])]);
    settingWarp["core"] == "vibe" ? document.getElementById("imgOfCfonCustom").src = path.join(__dirname, "svgs", "glob" + ".svg") : SetCfon(Psicountry[Psicountry.indexOf(settingWarp["cfonc"].toUpperCase())]);
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
    document.getElementById("message").style.display = "flex";
    document.getElementById("message").style.width = "";
    document.getElementById("message").style.transition = time / 5 + "ms";
    document.getElementById("message-border").style.width = "100%";
    document.getElementById("messageText").innerText = text;
    setTimeout(() => {
        document.getElementById("message-border").style.width = "0%";
        document.getElementById("message").style.width = "0%";
        setTimeout(() => {
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
    document.getElementById("setting").style.right = "";
    document.getElementById("setting").style.visibility = "1";
});
document.getElementById("setting-show-vibe").addEventListener("click", () => {
    if (document.getElementById("setting-vibe").style.display == "") {
        CloseAllSections();
        document.getElementById("setting-vibe").style.display = "flex";
    } else {
        document.getElementById("setting-vibe").style.display = "";
    }
});
document.getElementById("menu-website").addEventListener("click", () => {
    if (process.platform == "win32") {
        exec("start https://fwldom.github.io/Freedom")
    }
    else if (process.platform == "linux") {
        exec("xdg-open https://fwldom.github.io/Freedom");
    }
    else if (process.platform == "darwin") {
        exec("open https://fwldom.github.io/Freedom")
    }
})
document.getElementById("menu-about").addEventListener("click", () => { document.getElementById("about-app").style.display = "flex" })
document.getElementById("about").addEventListener("click", () => { document.getElementById("about-app").style.display = "flex" })
document.getElementById("close-about").addEventListener("click", () => { document.getElementById("about-app").style.display = "" })
//#endregion
// #region Section Menu
document.getElementById("menu-show").onclick = () => {
    document.getElementById("menu").style.display = "flex";
    document.getElementById("menu").style.transition = "0.5s";
    document.getElementById("menu").style.position = "absolute";
    document.getElementById("menu").style.left = "";
    document.getElementById("menu").style.visibility = "1";
};
document.getElementById("menu-freedom-vibe").onclick = () => {
    Loading("");
    LoadVibe();
};
document.getElementById("menu-freedom-browser").onclick = () => {
    ipc.send("load-browser", "")
};
document.getElementById("menu-freedom-plus").onclick = () => {
    ipc.send("load-file", "./plus/index.html")
};
document.getElementById("menu-dns").onclick = () => { document.getElementById("dns-set").style.display = "flex" };
document.getElementById("menu-exit").onclick = () => {
    document.getElementById("menu").style.transition = "1.3s";
    document.getElementById("menu").style.position = "absolute"
    document.getElementById("menu").style.left = "-110vw";
    document.getElementById("menu").style.visibility = "0.3";
    setTimeout(() => {
        document.getElementById("menu").style.display = "";
    }, 1300);
};
document.getElementById("menu-exit-app").onclick = () => {
    ipc.send("exit-app", "")
};
//#endregion
// #region Section Freedom-Vibe

var configsVibeName = [
    "Auto",
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
        settingVibe = JSON.parse(read_file("vibe.json")); // Load Setting From File.json 
        configsVibeName = JSON.parse(read_file("configsVibeName.json")); // Load Setting From File.json 
        configsVibeLink = JSON.parse(read_file("configsVibeLink.json")); // Load Setting From File.json 
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
    // Save setting vibe & setting warp In vibe.json & warp.json
    write_file("vibe.json", JSON.stringify(settingVibe));
    write_file("warp.json", JSON.stringify(settingWarp));
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
    write_file("configsVibeName.json", JSON.stringify(configsVibeName));
    write_file("configsVibeLink.json", JSON.stringify(configsVibeLink));
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
    // Run Dns Jumper With DNS address as parameter for Apply DNS
    (dns1 != "" & dns2 != "") ? (process.platform == "linux") ? spawn(`"${path.join(__dirname, "assets", "bash", "set_dns.sh")}"`, [dns1, dns2]) : ("") : ("");
    if (dns1 != "" & dns2 != "") Run("DnsJumper.exe", [dns1 + "," + dns2]);
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
ipcRenderer.on('start-get', (event, key, value) => {

});
ipcRenderer.on('set-warp-true', (event, key) => {
    settingWarp[`${key}`] = true;
    ResetArgsWarp();
    SetSettingWarp();
});
ipcRenderer.on('start-link', (event, link) => {
    alert(link);
});
// #endregion
// #region Interval Timers and Loads
setInterval(() => {
    document.getElementById("loading").style.display = "none";
}, 5000);
Onload();
setInterval(() => {
    testProxy();
    saveSetting();
}, 7500);

//#endregion
// End code
