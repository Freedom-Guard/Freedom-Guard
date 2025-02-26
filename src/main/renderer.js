// #region Libraries 
const { ipcRenderer, dialog, shell } = require('electron');
const { remote } = require('electron');
const { path } = require('path');
const { readFileSync } = require('fs');
const { connect, connectAuto, test, publicSet, Tools } = require('../components/connect');
const $ = require('jquery');
require("jquery.easing");
const { count } = require('console');
const { exec, execFile, spawn } = require('child_process');
const { on } = require('events');
window.$ = $;
const vesrionApp = "2.0.0";
let LOGS = [];
window.LogLOG = (log = "", type = "info") => {
    LOGS.push(log);
    const timestamp = new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
    log = timestamp + (type != "null" ? " --" + type + "--> " : "") + log;
    $("#LogsContent").append(`<p class="log-item">${log}</p>`);
    if (type == "clear") { $("#LogsContent").html("Logs Cleared!"); LOGS = []; };
    $("#LogsContent").scrollTop($("#LogsContent")[0].scrollHeight);
};
window.diconnectedUI = () => {
    $("#ChangeStatus").removeClass("connecting");
    mainSTA.publicSet.status = false;
    mainSTA.publicSet.connected = false;
    mainSTA.connect.killVPN(mainSTA.publicSet.settingsALL["public"]["core"]);
    mainSTA.connectAuto.killVPN();
    ipcRenderer.send("set-off-fg");
};
window.connectedUI = () => {
    $("#ChangeStatus").addClass("connected");
    $("#ip-ping").trigger("click");
    $("#ChangeStatus").removeClass("connecting");
    mainSTA.publicSet.status = true;
    mainSTA.publicSet.connected = true;
    ipcRenderer.send("set-on-fg");
    window.showMessageUI(mainSTA.publicSet.settingsALL["lang"]["connected_mess_notif"])
};
window.donateCONFIG = async (config) => {
    fetch("https://freedom-link.freedomguard.workers.dev/api/submit-config", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer IRAN"
        },
        body: JSON.stringify({
            key: "donated-config",
            config: {
                config: config,
                isp: mainSTA.publicSet.settingsALL["public"]["isp"],
                device: mainSTA.Tools.returnOS(),
                ping: await mainSTA.publicSet.getIP_Ping()["ping"],
                core: mainSTA.publicSet.settingsALL["public"]["core"],
                timestamp: Date.now(),
            }
        })
    })
        .then(response => response.json())
        .then(data => mainSTA.publicSet.LOGLOG("✅ کانفیگ با موفقیت اهدا شد" + JSON.stringify(data), "showmess"))
        .catch(error => mainSTA.publicSet.LOGLOG("❌ کانفیگ اهدا نشد:" + error, "showmess"));

};
window.setHTML = (selector, text) => {
    $(selector).html(text);
};
window.setATTR = (selector, attr, value) => {
    $(selector).attr(attr, value);
};
class main {
    constructor() {
        this.connect = new connect();
        this.connectAuto = new connectAuto();
        this.test = new test();
        this.path = require("path");
        this.axios = require("axios");
        this.publicSet = new publicSet();
        this.Tools = new Tools();
    };
    init = async () => {
        this.publicSet.LOGLOG("App Started");
        await this.loading();
        this.addEvents();
        this.setSettings();
        this.reloadServers();
        this.setPingBox();
        this.publicSet.startINIT();
        this.checkUPDATE();
        this.loadLang();
    };
    connectFG() {
        $("#ChangeStatus").removeClass("connected");
        $("#ChangeStatus").addClass("connecting");
        if (this.publicSet.status == false) {
            this.publicSet.status = true;
            if (this.publicSet.settingsALL["public"]["core"] == "auto") {
                this.connectAuto.connect();
            }
            else {
                this.connect.connect();
            }
        }
        else {
            $("#ChangeStatus").removeClass("connecting");
            $("#ChangeStatus").removeClass("connected");
            this.publicSet.status = false;
            this.publicSet.connected = false;
            this.connect.killVPN(this.publicSet.settingsALL["public"]["core"]);
            this.connectAuto.killVPN(this.publicSet.settingsALL["public"]["core"]);
        }
    };
    async loading(textloading = "", time = 3000) {// Displays a random tribute message and image during loading, then hides the loader after a set time.
        let loaderImages = ["yalda.png", "mahsa.jpg", "nika.jpg", "sarina.jpg", "kian.jpg", "mehrshad.jpg", "hadis.jpg", "hananeh.jpg", "hamidreza.jpg", "AylarH.jpg"];
        let loaderText = ["به یاد یلدا آقافضلی", "به یاد مهسا امینی", "به یاد نیکا شاکرمی", "به یاد سارینا اسماعیل زاده", "به یاد کیان پیرفلک", "به یاد مهرشاد شهیدی", "به یاد حدیث نجفی", "به یاد حنانه کیا", "به یاد حمید رضا روحی", "به یاد آیلار حقی"];
        let random = Math.floor(Math.random() * loaderImages.length);
        let loaderImage = "../assets/" + loaderImages[random];
        let loaderTxt = loaderText[random];
        $("#loader-text").html(loaderTxt);
        $('#loader-image').attr("src", loaderImage);
        $("#loading-text").html(textloading);
        $("#loading").attr("style", "display:flex;");
        process.nextTick(() => {
            global.setTimeout(() => {
                $("#loading").fadeOut("fast");
            }, time);
        });
    };
    async checkUPDATE() {// Checks for updates by fetching the latest version information from a remote JSON file.
        let response = await this.axios.get("https://raw.githubusercontent.com/Freedom-Guard/Freedom-Guard/main/config/latest.json");
        if (response.data["version"] > vesrionApp) {
            window.showModal(response.data["messText"], response.data["url"]);
        };
    };
    connectVPN() {

    };
    killVPN() {

    };
    onConnect() {

    };
    async loadLang() { // Load lang -> set HTML with key, json
        this.publicSet.ReloadSettings();
        let lang = this.publicSet.settingsALL["public"]["lang"];
        const response = await fetch(`../components/locales/${lang}.json`);
        const translations = await response.json();
        $('[data-lang]').each(function () {
            try {
                let key = $(this).attr('data-lang');
                if (lang == "fa")
                    $(this).attr('dir', "rtl");
                else {
                    $(this).attr('dir', "ltr");
                }
                $(this).html(translations[key]);
            }
            catch { }
        });
        this.publicSet.settingsALL["lang"] = translations;
        if (lang == "fa") {
            $("#setting-app>section").attr("dir", "rtl");
            $("#setting-app h3").toggleClass("right");
        }
        else {
            $("#setting-app>section").attr("dir", "ltr");
            $("#setting-app h3").toggleClass("right");
        }
        this.publicSet.saveSettings();
        $("a").on('click', (e) => {
            e.preventDefault();
            let href = $(e.target).attr("href");
            this.openLink(href);
        });
    }
    async isAdmin() {
        const isAdmin = await ipcRenderer.invoke("check-admin");
        if (!isAdmin) {
            return true;
            // window.showMessageUI("🔒 برای استفاده از این قابلیت، باید برنامه را با دسترسی ادمین اجرا کنید.\n\nلطفاً برنامه را بسته و با دسترسی ادمین باز کنید.", 7000);
        }
        return isAdmin;
    }
    openLink(href) {
        shell.openExternal(href);
    }
    addEvents() { // Add Events for settings, menu, connect, ....
        $("a").on('click', (e) => {
            e.preventDefault();
            let href = $(e.target).attr("href");
            this.openLink(href);
        });
        $('#menu-show, #menu-exit').on('click', () => {
            $('#menu').css('display') === 'none' ? $('#menu').css('display', 'flex') : $('#menu').css('display', 'none');
            global.setTimeout(() => {
                $('#menu').toggleClass('show');
            }, 100);
        });
        $('#menu-dns, #close-dns').on('click', () => {
            $('#dns-set').toggleClass('show');
        });
        $('#menu-freedom-browser').on('click', () => {
            ipcRenderer.send("load-browser");
        });
        $("#menu-about, #about").on('click', () => {
            $("#about-app").attr("style", "display:flex;");
        });
        $("#setting-show, #close-setting").on('click', () => {
            let settingApp = $("#setting-app");

            if (settingApp.is(":visible")) {
                settingApp.animate({ right: "-1300px" }, 1000, () => settingApp.hide());
            } else {
                settingApp.show().animate({ right: "0px" }, 700);
            };
        });
        $("#open-drop-setting").on("click", () => {
            $("#more-options-content").toggleClass("active");
        });
        $("#close-about").on('click', () => {
            $("#about-app").hide();
        });
        $("#reload-server-btn").on("click", async () => {
            await this.reloadServers();
        });

        $("#box-select-country-mini, #close-box-select-server").on("click", async () => {

            let $box = $("#box-select-country");

            if ($box.is(":visible")) {
                $box.animate(
                    { opacity: 0, top: "-20px" },
                    {
                        duration: 600,
                        easing: "easeInBack",
                        queue: false,
                        complete: function () {
                            $box.css("display", "");
                        },
                    }
                );
            } else {
                await this.reloadServers();
                $box.css({ opacity: 0, top: "-20px" }).css("display", "flex");
                $box.animate(
                    { opacity: 1, top: "0px" },
                    {
                        duration: 600,
                        easing: "easeOutBack",
                    }
                );
            }
        });

        $("#menu-exit-app").on('click', () => {
            ipcRenderer.send("exit-app");
        });
        $("#ip-ping").on('click', async () => {
            this.setPingBox();
        });
        $("#ChangeStatus").on("click", () => {
            this.connectFG();
        });
        $("#menu-freedom-logs, #CloseLogs").on("click", () => {
            $("#Logs").toggle();
        });
        $("#ClearLogs").on("click", () => {
            window.LogLOG("", "clear");
        });
        $("#CopyLogs").on("click", () => {
            this.publicSet.ReloadSettings();
            let logs = LOGS.join("\n");
            logs += "\n ISP:" + this.publicSet.settingsALL["public"]["isp"] + " \n CORE:" + this.publicSet.settingsALL["public"]["core"];
            navigator.clipboard.writeText(logs);
        });
        $("#menu-kill-all").on("click", () => {
            this.KILLALLCORES('warp');
            this.KILLALLCORES('flex');
            this.KILLALLCORES('grid');
            this.KILLALLCORES('vibe');
            this.publicSet.offProxy();
            this.setPingBox();
            window.showMessageUI(this.publicSet.settingsALL["lang"]["killed_services"]);
        });
        process.nextTick(() => this.addEventsSetting());
    };
    addEventsSetting() {// Add Event for settings
        $("#core-guard-selected").on('change', () => {
            this.publicSet.settingsALL["public"]["core"] = $("#core-guard-selected").val(); this.publicSet.saveSettings();
            $("#warp, #vibe, #auto, #flex, #grid, #new".replace("#" + this.publicSet.settingsALL["public"]["core"] + ",", "")).slideUp();
            $(`#${this.publicSet.settingsALL["public"]["core"]}`).slideDown();
            this.publicSet.settingsALL["public"]["core"] == "warp" ? $("#vpn-type-selected").val("system") : '';
            this.addEventSect(this.publicSet.settingsALL["public"]["core"]);
            $("#config-value").val("");
            this.publicSet.importConfig("");
            window.setATTR("#imgServerSelected", "src", "../svgs/" + (this.publicSet.settingsALL["public"]["core"] == "warp" ? "warp.webp" : this.publicSet.settingsALL["public"]["core"] == "vibe" ? "vibe.png" : "ir.svg"));
            window.setHTML("#textOfCfon", this.publicSet.settingsALL["public"]["core"] + " Server + Customized")
        });
        $("#export-config").on("click", async () => {
            this.publicSet.ReloadSettings();
            ipcRenderer.send("export-settings", JSON.stringify(this.publicSet.settingsALL));
            ipcRenderer.on("save-status", (event, status) => {
                if (status === "success") {
                    window.showMessageUI(this.publicSet.settingsALL["lang"]["settings_saved"]);
                }
            });
        });
        $("#import-config-file").on("click", async () => {
            const response = await ipcRenderer.invoke("import-config");
            this.publicSet.settingsALL = JSON.parse(response["data"]);
            this.publicSet.saveSettings();
            this.setSettings();
        });
        $("#reset-setting-btn").on("click", () => {
            this.publicSet.resetSettings();
        });
        $("#config-fg-value").on("input", () => {
            this.publicSet.settingsALL["public"]["configAuto"] = $("#config-fg-value").val();
            this.publicSet.settingsALL["public"]["core"] = "auto";
            this.setSettings();
            this.publicSet.saveSettings();
        });
        $("#submit-config").on("click", async () => {
            await this.publicSet.importConfig($("#config-value").val());
            this.setSettings();
            this.reloadServers();
        });
        $("#vpn-type-selected").on('change', async () => {
            if (this.publicSet.settingsALL["public"]["core"] == "warp" && $("#vpn-type-selected").val() == "tun") {
                window.showMessageUI(this.publicSet.settingsALL["lang"]["tun_not_supported"]);
                $("#vpn-type-selected").val("system");
                return;
            }
            else {
                this.publicSet.settingsALL["public"]["type"] = $("#vpn-type-selected").val(); this.publicSet.saveSettings();
            }
        });
        $("#bind-address-text").on('change', () => {
            this.publicSet.settingsALL["public"]["proxy"] = $("#bind-address-text").val(); this.publicSet.saveSettings();
        });
        $("#isp-guard-selected").on('change', () => {
            this.publicSet.settingsALL["public"]["isp"] = $("#isp-guard-selected").val(); this.publicSet.saveSettings();
        });
        $("#lang-app-value").on("change", () => {
            this.publicSet.settingsALL["public"]["lang"] = $("#lang-app-value").val();
            this.publicSet.saveSettings();
            window.showMessageUI(this.publicSet.settingsALL["lang"]["mess-change-lang"], 5000);
            this.loadLang();
        });
        $("#conn-test-text").on('input', () => {
            this.publicSet.settingsALL["public"]["testUrl"] = $("#conn-test-text").val(); this.publicSet.saveSettings();
        });
        $("#change-background-btn").on("click", () => {
            let backgroundImageLists = ["1.png", "2.png", "3.jpg", "4.jpg", "5.jpg", "6.jpg", "7.jpg", "8.jpg", "9.jpg", "10.jpg", "11.jpg", "12.jpg", "13.jpg", "14.jpg", "15.jpg", "16.jpg", "17.jpg"];
            let randomIndex = Math.floor(Math.random() * backgroundImageLists.length);
            let randomImage = backgroundImageLists[randomIndex];
            document.body.style.backgroundSize = "cover";
            document.body.style.backgroundImage = "url('background/" + randomImage + "')";
        });
        $("#repo-contact").on("click", () => { this.openLink("https://github.com/Freedom-Guard/Freedom-Guard/") });
        $("#x-contact").on("click", () => { this.openLink("https://x.com/Freedom_Guard_N") });
        $("#telegram-contact").on("click", () => { this.openLink("https://t.me/Freedom_Guard_Net") });
        $("#refresh-servers-btn").on("click", async () => {
            this.publicSet.updateISPServers(this.publicSet.settingsALL["public"]["isp"]); await this.publicSet.updateISPServers();
            await this.reloadServers(); this.publicSet.saveSettings(); window.showMessageUI(this.publicSet.settingsALL["lang"]["refreshed_isp_servers"]);
        });
        $("#submit-dns").on("click", async () => {
            if ((!await this.isAdmin())) {
                return;
            };
            this.Tools.setDNS($("#dns1-text").val(), $("#dns2-text").val(), this.Tools.returnOS());
            window.showMessageUI(this.publicSet.settingsALL["lang"]["dns_set_success"])
        });
        $("#freedom-link-status").on("click", () => {
            this.publicSet.settingsALL["public"]["freedomLink"] = !this.publicSet.settingsALL["public"]["freedomLink"]
            this.publicSet.saveSettings();
        });
    };
    addEventSect(core) {// Add Event for sect settings
        if (core == "warp") {
            $("#endpoint-warp-value").on("input", () => {
                this.publicSet.settingsALL["warp"]["endpoint"] = $("#endpoint-warp-value").val(); this.publicSet.saveSettings();
            });
            $("#get-endpoint-warp").on("click", async () => {
                try {
                    const response = await this.axios.get("https://raw.githubusercontent.com/ircfspace/endpoint/refs/heads/main/ip.json");
                    const ipData = (response.data);
                    const version = this.publicSet.settingsALL["warp"]["ipv"].toLowerCase() ?? "ipv4";
                    const ipList = version === "ipv6" ? ipData.ipv6 : ipData.ipv4;
                    if (ipList.length === 0) {
                        this.publicSet.LOGLOG("No available endpoints for the selected IP version.");
                        return;
                    }
                    const randomIP = ipList[Math.floor(Math.random() * ipList.length)];
                    $("#endpoint-warp-value").val(randomIP);
                    this.publicSet.settingsALL["warp"]["endpoint"] = randomIP;
                    this.publicSet.saveSettings();
                    window.showMessageUI(this.publicSet.settingsALL["lang"]["endpoint_retrieved"]);
                } catch (error) {
                    this.publicSet.LOGLOG("Error fetching endpoint data:", error);
                }
            });

            $("#Gool").on("click", () => {
                this.publicSet.settingsALL["warp"]["gool"] = !this.publicSet.settingsALL["warp"]["gool"]; this.publicSet.saveSettings();
            });
            $("#Scan").on("click", () => {
                this.publicSet.settingsALL["warp"]["scan"] = !this.publicSet.settingsALL["warp"]["scan"]; this.publicSet.saveSettings();
            });
            $("#get-key-warp").on("click", async () => {
                try {
                    const response = await this.axios.get("https://raw.githubusercontent.com/ircfspace/warpkey/main/plus/full");
                    const keys = response.data.split("\n").filter(key => key.trim() !== "");
                    const randomKey = keys[Math.floor(Math.random() * keys.length)];
                    $("#warp-key-value").val(randomKey);
                    this.publicSet.settingsALL["warp"]["key"] = randomKey;
                    this.publicSet.saveSettings();
                    window.showMessageUI(this.publicSet.settingsALL["lang"]["warp_key_applied"]);
                } catch (error) {
                    this.publicSet.LOGLOG("Error fetching WARP keys:", error);
                }
            });
            $("#warp-key-value").on("input", () => {
                this.publicSet.settingsALL["warp"]["key"] = $("#warp-key-value").val(); this.publicSet.saveSettings();
            });
            $("#selector-ip-version-warp").on("change", () => {
                this.publicSet.settingsALL["warp"]["ipv"] = $("#selector-ip-version-warp").val(); this.publicSet.saveSettings();
            });
            $("#scan-rtt-value").on("input", () => {
                this.publicSet.settingsALL["warp"]["scanrtt"] = $("#scan-rtt-value").val(); this.publicSet.saveSettings();
            });
            $("#verbose-status").on("click", () => {
                this.publicSet.settingsALL["warp"]["verbose"] = !this.publicSet.settingsALL["warp"]["verbose"]; this.publicSet.saveSettings();
            });
            $("#reserved-status").on("click", () => {
                this.publicSet.settingsALL["warp"]["reserved"] = !this.publicSet.settingsALL["warp"]["reserved"]; this.publicSet.saveSettings();
            });
            $("#test-url-warp-status").on("click", () => {
                this.publicSet.settingsALL["warp"]["testUrl"] = !this.publicSet.settingsALL["warp"]["testUrl"]; this.publicSet.saveSettings();
            });
            $("#dns-warp-value").on("input", () => {
                this.publicSet.settingsALL["warp"]["dns"] = $("#dns-warp-value").val(); this.publicSet.saveSettings();
            });
        }
        else if (core == "vibe") {
            $("#hiddify-config-vibe").on("click", async () => {
                const response = await ipcRenderer.invoke("import-config");
                this.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"] = response["data"];
                this.publicSet.saveSettings();
            });
            $("#hiddify-reset-vibe").on("click", async () => {
                this.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"] = null;
                this.publicSet.saveSettings();
            });
        }
        else if (core == "grid") {

        }
        else if (core == "flex") {

        }
    }
    setSettings() { // Loads and applies saved settings to the UI elements
        this.publicSet.ReloadSettings();
        $("#core-guard-selected").val(this.publicSet.settingsALL["public"]["core"]);
        $("#vpn-type-selected").val(this.publicSet.settingsALL["public"]["type"]);
        $("#isp-guard-selected").val(this.publicSet.settingsALL["public"]["isp"]);
        $("#bind-address-text").val(this.publicSet.settingsALL["public"]["proxy"]);
        $("#config-value").val(this.publicSet.settingsALL["public"]["configManual"]);
        $("#lang-app-value").val(this.publicSet.settingsALL["public"]["lang"]);
        this.publicSet.settingsALL["public"]["core"] == "vibe" ? $("#config-vibe-value").val(this.publicSet.settingsALL["public"]["configManual"]) : '';
        window.setATTR("#imgServerSelected", "src", "../svgs/" + (this.publicSet.settingsALL["public"]["core"] == "warp" ? "warp.webp" : this.publicSet.settingsALL["public"]["core"] == "vibe" ? "vibe.png" : "ir.svg"));
        window.setHTML("#textOfCfon", this.publicSet.settingsALL["public"]["configManual"].includes("#") ? this.publicSet.settingsALL["public"]["configManual"].split("#").pop().trim() : this.publicSet.settingsALL["public"]["configManual"].substring(0, 50) == "" ? this.publicSet.settingsALL["public"]["core"] + " Server" : this.publicSet.settingsALL["public"]["configManual"].substring(0, 50));
        $("#conn-test-text").val(this.publicSet.settingsALL["public"]["testUrl"]);
        $("#endpoint-warp-value").val(this.publicSet.settingsALL["warp"]["endpoint"]);
        $("#selector-ip-version-warp").val(this.publicSet.settingsALL["warp"]["ipv"] ?? "IPV4");
        $("#scan-rtt-value").val(this.publicSet.settingsALL["warp"]["scanrtt"]);
        $("#warp-key-value").val(this.publicSet.settingsALL["warp"]["key"]);
        $("#Gool").prop("checked", this.publicSet.settingsALL["warp"]["gool"]);
        $("#Scan").prop("checked", this.publicSet.settingsALL["warp"]["scan"]);
        $("#freedom-link-status").prop("checked", this.publicSet.settingsALL["public"]["freedomLink"]);
        $("#reserved-status").prop("checked", this.publicSet.settingsALL["warp"]["reserved"]);
        $("#verbose-status").prop("checked", this.publicSet.settingsALL["warp"]["verbose"]);
        $("#test-url-warp-status").prop("checked", this.publicSet.settingsALL["warp"]["testUrl"]);
        $("#dns-warp-value").val(this.publicSet.settingsALL["warp"]["dns"]);
        $("#warp, #vibe, #auto, #flex, #grid, #new".replace("#" + this.publicSet.settingsALL["public"]["core"] + ",", "")).slideUp();
        $(`#${this.publicSet.settingsALL["public"]["core"]}`).slideDown();
        this.addEventSect(this.publicSet.settingsALL["public"]["core"]);
    };
    async reloadServers() {// Reloads server list, updates UI, and manages server selection and context menu interactions.
        this.publicSet.ReloadSettings();
        await this.publicSet.updateISPServers();

        let ispServers = [...this.publicSet.settingsALL["public"]["ispServers"]];
        let importedServers = [...this.publicSet.settingsALL["public"]["importedServers"]];

        let box = document.getElementById("box-select-servers");
        $("#box-select-servers").html("");

        $("#add-server-btn").on("click", () => {
            let settingApp = $("#setting-app");
            settingApp.show().animate({ right: "0px" }, 0);
            $("#config-value").focus();
        });

        await this.createServerList("Your Servers", importedServers, box, "imported");
        await this.createServerList("ISP Servers", ispServers, box, "isp");
        box.addEventListener("click", async (event) => {
            let target = event.target.closest(".country-option");
            if (!target) return;

            let serverType = target.getAttribute("data-type");
            let serverIndex = target.getAttribute("data-index");
            let server = target.getAttribute("data-server");

            if (!server || serverIndex === null) return;

            event.preventDefault();

            document.querySelectorAll(".country-option").forEach(el => {
                el.style.backgroundColor = "";
                el.id = "";
            });

            target.style.backgroundColor = "rgba(105, 10, 255, 0.8)";
            target.id = "selected-server";

            this.publicSet.LOGLOG(`🔵 Clicked on server: ${server} | Type: ${serverType}`);

            await this.publicSet.importConfig(server);
            this.setSettings();
        });


        box.addEventListener("contextmenu", (event) => {
            let target = event.target.closest(".country-option");
            if (!target) return;

            let serverType = target.getAttribute("data-type");
            let serverIndex = target.getAttribute("data-index");
            let server = target.getAttribute("data-server");

            if (!server || serverIndex === null) return;

            event.preventDefault();
            this.showContextMenuServer(event, server, serverType, serverIndex);
        });
    }

    async createServerList(title, servers, container, type) { // Generates and appends a list of servers to the provided container.
        container.innerHTML += `<h2 style='margin:0.7em;'>${title}</h2>`;

        servers.forEach((server, index) => {
            let imgServer = server.split(",;,")[0] == "warp" ? "warp.webp" : server.split(",;,")[0] == "vibe" ? "vibe.png" : server.split("://")[0] == "warp" ? "warp.webp" : "vibe.png";
            server = server.replace("vibe,;,", "").replace(",;,", "://");
            let name = server.includes("#") ? server.split("#").pop().trim() : server.substring(0, 50);

            let div = document.createElement("div");
            div.className = "country-option";
            div.title = server;
            div.setAttribute("data-type", type);
            div.setAttribute("data-index", index);
            div.setAttribute("data-server", server);
            div.innerHTML = `<img src="../svgs/${imgServer}" alt="${name}"><p>${name}</p>`;
            if (server == this.publicSet.settingsALL["public"]["configManual"] && $("#selected-server").html() == undefined) {
                div.style.backgroundColor = "rgba(105, 10, 255, 0.8)";
                div.id = "selected-server";
            }
            container.appendChild(div);
        });
    }

    showContextMenuServer(event, server, type, index) {//  Displays a custom right-click context menu for server options.
        let existingMenu = document.getElementById("server-context-menu");
        if (existingMenu) existingMenu.remove();

        let menu = document.createElement("div");
        menu.id = "server-context-menu";
        menu.className = "server-menu";
        menu.style.top = `${event.clientY}px`;
        menu.style.left = `${event.clientX}px`;

        menu.innerHTML = `
            <button class="edit-server"><i class='bx bxs-pencil'></i> ویرایش</button>
            <button class="delete-server"><i class='bx bxs-trash'></i> حذف</button>
        `;

        menu.querySelector(".edit-server").addEventListener("click", async () => {
            let newName = await window.prompt("کانفیگ جدید را وارد کنید:", server);
            if (newName && newName.trim() !== "") {
                let newServer = newName.trim();

                if (type === "imported") {
                    this.publicSet.settingsALL["public"]["importedServers"][index] = newServer;
                } else if (type === "isp") {
                    this.publicSet.settingsALL["public"]["ispServers"][index] = newServer;
                }

                await this.publicSet.saveSettings();
                this.setSettings();
                this.reloadServers();
            }
            menu.remove();
        });

        menu.querySelector(".delete-server").addEventListener("click", async () => {
            const userConfirmed = await ipcRenderer.invoke("submit-dialog", "آیا مطمئن هستید که می‌خواهید این کانفیگ را حذف کنید؟");
            if (!userConfirmed) return;

            try {
                await this.publicSet.deleteConfig(server);
                await this.publicSet.ReloadSettings();
                this.publicSet.settingsALL["public"]["core"] = "auto";
                this.publicSet.settingsALL["public"]["configManual"] = "";
                this.publicSet.saveSettings();
                this.setSettings();
                this.reloadServers();
            } catch (error) {
                console.error("خطا:", error);
            }

            menu.remove();
        });

        document.body.appendChild(menu);

        setTimeout(() => {
            document.addEventListener("click", () => menu.remove(), { once: true });
        }, 100);
    };
    async setPingBox() { // Updates the UI with the current IP, country, ping, and bypass status.
        let data = await this.publicSet.getIP_Ping();
        let countryEmoji = data.country ? `🌍 ${data.country}` : "🌍 Unknown";
        let isConnected = !data.filternet;
        let htmlContent = "";
        if (this.publicSet.connected) {
            htmlContent = `
                <p class="ip-ping-item">
                    <span class="ip-icon">🌍</span> 
                    Country: <b>${countryEmoji}</b>
                </p>
                <p class="ip-ping-item">
                    <span class="ip-icon">🔍</span> 
                    IP: <b>${data.ip || "Unknown"}</b>
                </p>
                <p class="ip-ping-item">
                    <span class="ip-icon">⚡</span> 
                    Ping: <b>${data.ping || "N/A"} ms</b>
                </p>
                <p class="ip-ping-item">
                    <span class="ip-icon">🚀</span> 
                    Bypass: <b>${isConnected ? "On" : "Off"}</b>
                </p>
                <p id="connection-status" class="ip-status ${this.publicSet.connected ? '' : 'disconnected'}">
                    ${this.publicSet.connected ? '🟢 Connected' : '🔴 Disconnected'}
                </p>
        `;
            $("#ChangeStatus").addClass("connected");
            this.publicSet.status = true;
            this.publicSet.connected = true;
        } else {
            htmlContent = `
                <p class="ip-ping-item" style='margin:0;padding:0;'>
                    <b style='color:${data.ping > 1500 ? "red" : "green"};margin:0.5em 1em'>${data.ping}ms</b>
                </p>
                `;
        }
        $("#ip-ping").html(htmlContent);
        this.publicSet.connected ? $("#ip-ping, #ChangeStatus").addClass("connected") : $("#ip-ping, #ChangeStatus").removeClass("connected");
    };
    KILLALLCORES(core) { // Terminates a process with the given core name on both Windows and Unix-based systems.
        core = core.toString().toLowerCase() + "-core";
        this.publicSet.LOGLOG(`Killing ${core}...`);
        if (process.platform == "win32") {
            if (!core || typeof core !== "string") {
                this.publicSet.LOGLOG("Error: Invalid process name.");
            } else {
                execFile("taskkill", ["/f", "/im", `${core}.exe`], (error, stdout, stderr) => {
                    if (error) {
                        this.publicSet.LOGLOG(`Error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        this.publicSet.LOGLOG(`stderr: ${stderr}`);
                        return;
                    }
                    this.publicSet.LOGLOG(`stdout: ${stdout}`);
                });
            }
        }
        else if (process.platform) {
            if (!core || typeof core !== "string") {
                this.publicSet.LOGLOG("Error: Invalid process name.");
            } else {
                execFile("killall", [core], (error, stdout, stderr) => {
                    if (error) {
                        this.publicSet.LOGLOG(`Error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        this.publicSet.LOGLOG(`stderr: ${stderr}`);
                        return;
                    }
                    this.publicSet.LOGLOG(`stdout: ${stdout}`);
                });
            }
        }
    }
};
class fgCLI extends main {
    constructor() {
        super();
    };
    init = async () => {
        $("#submit-command-line").on("click", () => {
            let command = $("#command-line").val();
            this.enterCommand(command);
        });
        $("#command-line").on("keypress", (event) => {
            if (event.which === 13) {
                let command = $("#command-line").val();
                this.enterCommand(command);
            };
        });
        $("#HelpLogs").on("click", () => {
            this.enterCommand("help");
        });
    };
    async enterCommand(command) {// Executes various user commands from Logs
        $("#command-line").val("");
        let commandSplit = command.split(" ");
        let commandName = commandSplit[0];
        let commandArgs = commandSplit.slice(1);
        switch (commandName.toString().toLowerCase()) {
            case "connect":
                commandArgs.length > 0 ? this.publicSet.settingsALL["public"]["core"] = commandArgs[0] : this.publicSet.settingsALL["public"]["core"] = "auto";
                this.setSettings();
                this.connectFG();
                break;
            case "disconnect":
                this.connectFG();
                break;
            case "ping":
                window.LogLOG("Getting IP information...");
                let data = await this.publicSet.getIP_Ping();
                window.LogLOG(`Country: ${data.country}`);
                window.LogLOG(`IP: ${data.ip}`);
                window.LogLOG(`Ping: ${data.ping}`);
                window.LogLOG(`Bypass: ${!data.filternet}`);
                break;
            case "clear":
                window.LogLOG("", "clear");
                break;
            case "exit":
                ipcRenderer.send("exit-app");
                break;
            case "help":
                this.helpCommand();
                break;
            case "set":
                if (commandArgs.length > 1) {
                    let sect = commandArgs[0];
                    let key = commandArgs[1];
                    let value = commandArgs[2];
                    this.publicSet.settingsALL[sect][key] = value;
                    this.publicSet.saveSettings();
                    this.setSettings();
                    window.LogLOG(`Set ${sect}->${key} to ${value}`);
                }
                else {
                    window.LogLOG("Invalid arguments");
                }
                break;
            case "show":
                window.LogLOG("Showing settings->" + commandArgs[0] ?? "" + "...");
                if (commandArgs.length > 0) {
                    let sect = commandArgs[0];
                    let keys = commandArgs[1] == undefined ? Object.keys(this.publicSet.settingsALL[sect]) : [[commandArgs[1]]];
                    keys.forEach((key) => {
                        window.LogLOG(`&nbsp;&nbsp;&nbsp;&nbsp;${key}: ${this.publicSet.settingsALL[sect][key]}`);
                    });
                }
                else {
                    window.LogLOG("Invalid arguments, no section provided, use show [section]");
                }
                break;
            case "start":
                const corePath = this.path.join(
                    this.publicSet.coresPath,
                    commandArgs[0],
                    this.connect.addExt(commandArgs[0] + "-core")
                );
                window.LogLOG(`Starting ${corePath} ${commandArgs.slice(1).join(" ")}...`);
                const process = spawn(corePath, commandArgs.slice(1), {
                    stdio: "pipe",
                    shell: false,
                });

                process.stdout.on("data", (data) => {
                    window.LogLOG(`stdout: ${data.toString().trim()}`);
                });

                process.stderr.on("data", (data) => {
                    window.LogLOG(`stderr: ${data.toString().trim()}`);
                });

                process.on("close", (code) => {
                    window.LogLOG(`Process exited with code ${code}`);
                });

                process.on("error", (err) => {
                    window.LogLOG(`Error: ${err.message}`);
                });
                break;
            case "kill":
                this.connect.killVPN(commandArgs[0]);
                commandArgs[1] == "/f" ? this.KILLALLCORES(commandArgs[0]) : "";
                window.LogLOG(`Killed ${commandArgs[0] + (commandArgs[1] == "/f" ? " with force" : "")}`);
                break;
            case "proxy":
                let proxy = commandArgs[0];
                this.publicSet.setProxy(proxy);
                if (!proxy) {
                    this.publicSet.offProxy(proxy);
                }
                break;
            case "refresh":
                this.publicSet.ReloadSettings();
                this.reloadServers();
                this.setPingBox();
                this.setSettings();
            default:
                window.LogLOG("Command not found");
                break;
        }
        $("#LogsContent").scrollTop($("#LogsContent")[0].scrollHeight);
        $("#command-line").focus();
    };
    helpCommand() {
        window.LogLOG("Available commands:");
        window.LogLOG("&nbsp;&nbsp;&nbsp;connect - Connect to VPN with core selected(setting)");
        window.LogLOG("&nbsp;&nbsp;&nbsp;start - start [core] [args]");
        window.LogLOG("&nbsp;&nbsp;&nbsp;disconnect - Disconnect from VPN");
        window.LogLOG("&nbsp;&nbsp;&nbsp;ping - Get IP information");
        window.LogLOG("&nbsp;&nbsp;&nbsp;set - settings->set public core warp");
        window.LogLOG("&nbsp;&nbsp;&nbsp;show - settings->show public core");
        window.LogLOG("&nbsp;&nbsp;&nbsp;kill - only core selected mode->kill warp (/f)");
        window.LogLOG("&nbsp;&nbsp;&nbsp;refresh - refresh(isp servers, settings, ping, ...)");
        window.LogLOG("&nbsp;&nbsp;&nbsp;clear - Clear logs");
        window.LogLOG("&nbsp;&nbsp;&nbsp;exit - Exit application");
    };
};
const mainSTA = new main();
mainSTA.init();
const fgCLI_STA = new fgCLI();
fgCLI_STA.init();
window.reloadPing = () => {
    mainSTA.setPingBox();
};
window.setSettings = () => {
    mainSTA.setSettings();
};
window.startNewUser = () => {
    $("#start-box").css("display", "");
    $("#submit-start").on("click", () => {
        mainSTA.publicSet.settingsALL["public"]["isp"] = $("#selector-isp-start").val();
        if ($("#selector-mode-start").val() == "import") {
            $("#box-select-country-mini").trigger("click");
        };
        mainSTA.publicSet.settingsALL["public"]["lang"] = $("#selector-lang-start").val();
        mainSTA.publicSet.saveSettings();
        window.showMessageUI(mainSTA.publicSet.settingsALL["lang"]["mess-change-lang"], 5000);
        mainSTA.loadLang();
        mainSTA.publicSet.saveSettings();
        $("#start-box").hide();
        window.setSettings();
        let { trackEvent } = require("@aptabase/electron");
        trackEvent("new-user", { isp: mainSTA.publicSet.settingsALL["public"]["isp"] });
    });
};
window.showMessageUI = (message, duration = 3000) => {
    const messageBox = document.getElementById("message");
    const messageText = document.getElementById("messageText");
    const messageBorder = document.getElementById("message-border");

    if (!messageBox || !messageText || !messageBorder) return;

    messageText.innerHTML = message;
    messageBox.classList.add("show-message");

    messageBorder.style.width = "100%";
    setTimeout(() => messageBorder.style.width = "0%", 500);

    setTimeout(() => {
        $("#message").slideToggle("slow", () => {
            messageBox.classList.remove("show-message");
        })
    }, duration);
};
window.showModal = (mess = "", link = "", btnOpenLinkHTML = "بازش کن", btnCloseModalHTML = "الان حالش نیست") => {
    $("#text-box-notif").html(mess);
    $(".box-notif").css("display", "flex");
    $("#href-box-notif").attr("href", link);
    $("#href-box-notif").html(btnOpenLinkHTML);
    $("#close-box-notif").html(btnCloseModalHTML);
    $("#href-box-notif, #close-box-notif").on("click", () => {
        $(".box-notif").css("display", "none");
    });
};
window.prompt = (message = "لطفاً مقدار موردنظر را وارد کنید:", defaultValue = "") => {
    return new Promise((resolve) => {
        const promptBox = document.getElementById("prompt");
        const promptMessage = document.getElementById("prompt-message");
        const promptInput = document.getElementById("prompt-input");
        const confirmBtn = document.getElementById("confirm-prompt");
        const cancelBtn = document.getElementById("cancel-prompt");

        promptMessage.innerText = message;
        promptInput.value = defaultValue;

        promptBox.classList.remove("hidden");
        promptInput.focus();

        confirmBtn.onclick = () => {
            resolve(promptInput.value);
            promptBox.classList.add("hidden");
        };

        cancelBtn.onclick = () => {
            resolve(null);
            promptBox.classList.add("hidden");
        };

        promptInput.onkeydown = (event) => {
            if (event.key === "Enter") {
                confirmBtn.click();
            }
        };
    });
};
// #region IPC 
ipcRenderer.on("start-fg", (event) => {
    mainSTA.connectFG();
})
ipcRenderer.on("start-link", (event, link) => {
    function isBase64(str) {
        try {
            return btoa(atob(str)) === str;
        } catch (err) {
            return false;
        }
    }
    try {
        mainSTA.publicSet.LOGLOG("import config from deep link -> " + link.split("freedom-guard://")[1]);

        let rawLink = link.split("freedom-guard://")[1];

        if (isBase64(rawLink)) {
            link = atob(rawLink);
        } else {
            link = rawLink;
        }

        mainSTA.publicSet.importConfig(link);
    } catch (error) {
    }
    window.showMessageUI(mainSTA.publicSet.settingsALL["lang"]["config_imported"] + link.split("://")[0]);
});