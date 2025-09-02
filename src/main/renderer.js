// #region Libraries 
const { ipcRenderer, dialog, shell, clipboard } = require('electron');
const { Connect, ConnectAuto, Test, PublicSet, Tools } = require('../components/connect');
const $ = require('jquery');
require("jquery.easing");
const { exec, execFile, spawn } = require('child_process');
window.$ = $;
const vesrionApp = "9.7.0";
let LOGS = [];
// #endregion
// #region components
window.LogLOG = (log = "", type = "info", ac = "text") => {
    LOGS.push(log);
    console.log(log);
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
    const logLength = log.length;
    const logId = `log-item-${LOGS.length}`;
    const isLongLog = logLength > 200;
    const shortLog = isLongLog ? log.substring(0, 200) + "..." : log;
    const htmlContent = isLongLog
        ? `<p class="log-item" id="${logId}">${ac == "html" ? shortLog : shortLog}</p><button class="btn" onclick="window.toggleLog('${logId}', \`${encodeURIComponent(log)}\`, '${ac}')" style="font-size: 0.7em;">View More</button>`
        : `<p class="log-item" id="${logId}">${ac == "html" ? log : log}</p>`;
    $("#LogsContent").append(htmlContent);
    if (type == "clear") { $("#LogsContent").html("Logs Cleared!"); LOGS = []; }
    (window.scrollLogs ?? false) == true ? $("#LogsContent").scrollTop($("#LogsContent")[0].scrollHeight) : '';
};

window.toggleLog = (logId, fullLog, ac) => {
    const $logItem = $(`#${logId}`);
    const $button = $logItem.next(".btn");
    if ($logItem.hasClass("expanded")) {
        $logItem.html(ac == "html" ? decodeURIComponent(fullLog.substring(0, 200)) + "..." : decodeURIComponent(fullLog.substring(0, 200) + "..."));
        $logItem.removeClass("expanded");
        $button.text("View More");
    } else {
        $logItem.html(decodeURIComponent(fullLog));
        $logItem.addClass("expanded");
        $button.text("View Less");
    }
}
window.confirm = (mess = "") => {
    return new Promise((resolve) => {
        const box = document.getElementById("confirmation-box");
        const messageEl = document.getElementById("confirmation-box-mess");
        const yesBtn = document.getElementById("confirmation-box-yes");
        const noBtn = document.getElementById("confirmation-box-no");

        messageEl.textContent = mess;
        box.style.display = "block";

        const cleanup = () => {
            box.style.display = "none";
            yesBtn.removeEventListener("click", onYes);
            noBtn.removeEventListener("click", onNo);
        };

        const onYes = () => {
            cleanup();
            resolve(true);
        };

        const onNo = () => {
            cleanup();
            resolve(false);
        };

        yesBtn.addEventListener("click", onYes);
        noBtn.addEventListener("click", onNo);
    });
};
window.disconnectedUI = () => {
    $("#ChangeStatus").removeClass("connecting");
    mainSTA.publicSet.status = false;
    mainSTA.publicSet.connected = false;
    mainSTA.publicSet.killAllCores("vibe");
    mainSTA.publicSet.killAllCores("vibe");
    mainSTA.publicSet.killAllCores("warp");
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
        .then(data => mainSTA.publicSet.log("✅ کانفیگ با موفقیت اهدا شد" + JSON.stringify(data), "showmess"))
        .catch(error => mainSTA.publicSet.log("❌ کانفیگ اهدا نشد:" + error, "showmess"));

};
window.setHTML = (selector, text) => {
    $(selector).text(text);
};
window.setATTR = (selector, attr, value) => {
    $(selector).attr(attr, value);
};
// #endregion
// #region main/classes
class main {
    constructor() {
        this.connect = new Connect();
        this.connectAuto = new ConnectAuto();
        this.test = new Test();
        this.path = require("path");
        this.axios = require("axios");
        this.publicSet = new PublicSet();
        this.Tools = new Tools();
    };
    init = async () => {
        this.publicSet.log("App Started");
        await this.loading();
        this.addEvents();
        this.setSettings();
        this.reloadServers();
        this.setPingBox();
        this.publicSet.startINIT();
        this.checkUPDATE();
        this.loadLang();
        this.loadTheme();
        this.initCompo();
        this.initApp();
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
    async loading(textloading = "", time = 3000) {
        // Displays a random tribute message and image during loading, then hides the loader after a set time.
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
    async checkUPDATE() {
        // Checks for updates by fetching the latest version information from a remote JSON file.
        let response = await this.axios.get("https://raw.githubusercontent.com/Freedom-Guard/Freedom-Guard/main/config/desktop.json");
        if (response.data["version"] > vesrionApp) {
            window.showModal(response.data["messText"], response.data["url"]);
        };
    };
    connectVPN() { };
    killVPN() { };
    onConnect() { };
    async loadBox() { }
    async loadTheme() {
        this.publicSet.reloadSettings();
        let theme = this.publicSet.settingsALL["public"]["theme"] ?? "Dark";
        $("#theme-css").attr("href", "./themes/" + theme + ".css");
    }
    async loadLang() {
        // Load lang -> set HTML with key, json
        this.publicSet.reloadSettings();
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
        if (lang == "fa" || lang == "ar") {
            $("#setting-app>section").attr("dir", "rtl");
            $("#setting-app h3").toggleClass("right");
        }
        else {
            $("#setting-app>section").attr("dir", "ltr");
            $("#setting-app h3").toggleClass("right");
        }
        this.publicSet.saveSettings();
        $("#about-app a").on('click', (e) => {
            e.preventDefault();
            let href = $(e.target).attr("href");
            this.openLink(href);
        });
    };
    async isAdmin() { };
    openLink(href) {
        shell.openExternal(href);
    };
    async initCompo() {
        let that = this;
        $(".close-btn").on("click", function (event) {
            const targetClose = $(event.target).attr("targetclose");
            if (targetClose) {
                $(targetClose).hide();
            }
        });
        const $tooltip = $('.tooltip-box');
        $('#menu div').on('mousemove', function (e) {
            if ($(this).parent().hasClass('show')) {
                return;
            };
            const text = $(this).find('span').text();
            $tooltip.text(text).css({
                top: e.pageY + 0,
                left: e.pageX + 15
            }).fadeIn(300);
        }).on('mouseleave', function () {
            $tooltip.hide(100);
        });
        $(".has-tooltip").on("mousemove", function (e) {
            const $tooltip = $('.tooltip-box');
            const text = $(this).attr('data-tooltip').startsWith("tr") ? that.publicSet.settingsALL["lang"][$(this).attr('data-tooltip').replace("tr(", "").replace(")", "")] ?? $(this).attr('data-tooltip') : $(this).attr('data-tooltip');
            $tooltip.text(text).css({
                top: e.pageY + 10,
                left: e.pageX + 15
            }).fadeIn(300);
        }).on('mouseleave', function () {
            $('.tooltip-box').hide(100);
        });
        $('#setting-app h3:not(.not-sect)').on("click", function () {
            var content = $(this).attr("openSection");
            that.addEventSect(content == "vibe" ? "vibe" : "warp")
            $("#" + content).slideToggle();
            $(this).toggleClass("active");
        });
    }
    async initApp() {
        this.publicSet.reloadSettings();
        if (this.publicSet.settingsALL["public"]["auto_conn_after_runs"]) {
            this.connectFG();
        };
    }
    addEvents() {
        // Add Events for settings, menu, connect, ....
        $("a").on('click', (e) => {
            e.preventDefault();
            let href = $(e.target).attr("href");
            this.openLink(href);
        });
        $('#menu-expand').on('click', () => {
            $('#menu').toggleClass('show');
        });
        $('#menu-dns, #close-dns').on('click', () => {
            $('#dns-set').toggle();
        });
        $("#selector-dns").on("change", () => {
            const dnsValues = $("#selector-dns").val().split(",");
            $("#dns1-text").val(dnsValues[0]);
            $("#dns2-text").val(dnsValues[1]);
        });
        $("#submit-donate-config").on("click", () => {
            const config = $("#donate-config-text").val();
            if (config) {
                window.donateCONFIG(config);
                window.showMessageUI("Config submitted successfully!");
            } else {
                window.showMessageUI("Please enter a valid config.");
            }
            window.showMessageUI("از قلب بزرگ و سخاوتمند شما بی‌نهایت سپاسگزاریم! ❤️ با کمک شما، افراد بیشتری به اینترنت آزاد دسترسی پیدا می‌کنند. به پاس این همراهی ارزشمند، تم «تپش قلب» برایتان فعال شد. البته هر زمان که بخواهید، می‌توانید آن را از تنظیمات تغییر دهید.", 10000);
            this.publicSet.settingsALL["public"]["theme"] = "Heart"; this.publicSet.saveSettings();
            this.loadTheme();
        });

        $("#close-donate-box, #show-donate-box").on("click", () => {
            $("#donate-box").toggle();
        });
        $('#menu-freedom-browser').on('click', () => {
            ipcRenderer.send("load-browser");
        });
        $("#menu-about, #about").on('click', () => {
            $("#about-app").attr("style", "display:flex;");
        });
        $("#setting-show, #close-setting").on('click', () => {
            $("#setting-app").toggle();
        });
        $("#open-drop-setting").on("click", () => {
            $("#more-options-content").toggleClass("active");
            setTimeout(() => {
                document.addEventListener("click", () => $("#more-options-content").toggleClass("active"), { once: true });
            }, 100)
        });
        $("#close-about").on('click', () => {
            $("#about-app").hide();
        });
        $("#reload-server-btn").on("click", async () => {
            await this.reloadServers();
            window.showMessageUI(this.publicSet.settingsALL["lang"]["refreshed_isp_servers"]);
        });
        $("#box-select-server-mini, #close-box-select-server").on("click", async () => {
            $("#box-select-server").toggle();
        });
        $("#menu-exit-app").on('click', () => {
            ipcRenderer.send("exit-app");
        });
        $("#ip-ping, #reload-ping").on('click', async () => {
            this.setPingBox();
        });
        $("#ChangeStatus").on("click", () => {
            this.connectFG();
        });
        $("#menu-freedom-logs, #CloseLogs").on("click", () => {
            $("#Logs").toggle();
            $("#LogsContent").scrollTop($("#LogsContent")[0].scrollHeight);
        });
        $("#ClearLogs").on("click", () => {
            window.LogLOG("", "clear");
        });
        $("#CopyLogs").on("click", () => {
            this.publicSet.reloadSettings();
            let logs = LOGS.join("\n");
            logs += "\n ISP:" + this.publicSet.settingsALL["public"]["isp"] + " \n CORE:" + this.publicSet.settingsALL["public"]["core"];
            navigator.clipboard.writeText(logs);
            window.showMessageUI(this.publicSet.settingsALL["lang"]["copied"])
        });
        $("#menu-kill-all").on("click", () => {
            this.KILLALLCORES('warp');
            this.KILLALLCORES('flex');
            this.KILLALLCORES('grid');
            this.KILLALLCORES('vibe');
            this.publicSet.offProxy();
            this.setPingBox();
            window.showMessageUI(this.publicSet.settingsALL["lang"]["killed_services"]);
            window.disconnectedUI();
            location.reload();
        });
        $("#menu-tool-box, #tool-close-box").on("click", () => {
            this.showToolBox();
        })
        $("#close-sys-check").on("click", () => {
            $("#system-check-result").toggle();
        })
        process.nextTick(() => this.addEventsSetting());
    };
    addEventsSetting() {
        // Add Event for settings
        $("#core-guard-selected").on('change', () => {
            this.publicSet.settingsALL["public"]["core"] = $("#core-guard-selected").val(); this.publicSet.saveSettings();
            $("#warp, #vibe, #auto, #flex, #grid, #new".replace("#" + this.publicSet.settingsALL["public"]["core"] + ",", "")).slideUp();
            $(`#${this.publicSet.settingsALL["public"]["core"]}-settings`).addClass("active");
            $(`#${this.publicSet.settingsALL["public"]["core"]}-settings`).addClass("active");
            $(`#${this.publicSet.settingsALL["public"]["core"]}`).slideDown();
            this.publicSet.settingsALL["public"]["core"] == "warp" ? $("#vpn-type-selected").val("system") : '';
            this.addEventSect(this.publicSet.settingsALL["public"]["core"]);
            $("#config-value").val("");
            this.publicSet.importConfig("");

            window.setATTR("#imgServerSelected", "src", "../svgs/" + (this.publicSet.settingsALL["public"]["core"] == "warp" ? "warp.webp" : this.publicSet.settingsALL["public"]["core"] == "vibe" ? "vibe.png" : "ir.svg"));
            window.setHTML("#textOfServer", decodeURIComponent(this.publicSet.settingsALL["public"]["core"] + " Server + Customized"));
        });
        $("#auto-conn-status").on("change", () => {
            this.publicSet.settingsALL["public"]["auto_conn_after_runs"] = $("#auto-conn-status").is(":checked");
            this.publicSet.saveSettings();
        });
        $("#export-config").on("click", async () => {
            this.publicSet.reloadSettings();
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
        $("#config-fg-value").on("change", () => {
            this.publicSet.settingsALL["public"]["configAuto"] = $("#config-fg-value").val();
            this.publicSet.settingsALL["public"]["configAutoMode"] = "remote";
            this.publicSet.settingsALL["public"]["core"] = "auto";
            this.publicSet.saveSettings();
            this.setSettings();
        });
        $("#submit-config").on("click", async () => {
            await this.publicSet.importConfig($("#config-value").val());
            this.setSettings();
            this.reloadServers();
        });
        $("#add-warp-config").on("click", async () => {
            await this.publicSet.importConfig("https://raw.githubusercontent.com/hiddify/hiddify-next/main/test.configs/warp#%F0%9F%94%A5%20WARP%20%F0%9F%94%A5");
            this.setSettings();
            this.reloadServers();
        });
        $("#apply-ISP-preset").on("click", async () => {
            this.publicSet.reloadSettings();
            this.runActionsFromJSON("https://raw.githubusercontent.com/Freedom-Guard/Freedom-Guard/main/config/desktop/settings.json", this.publicSet.settingsALL.public.isp);
        });
        $("#submit-config-clipboard").on("click", async () => {
            $("#config-value").val(clipboard.readText());
            await this.publicSet.importConfig($("#config-value").val());
            this.setSettings();
            this.reloadServers();
        });
        $("#submit-config-file").on("click", async () => {
            let server = await ipcRenderer.invoke("import-config")["noJsonData"];
            $("#config-value").val(server);
            await this.publicSet.importConfig(server);
            this.setSettings();
            this.reloadServers();
        });
        $("#config-fg-file").on("click", async () => {
            let response = await ipcRenderer.invoke("import-config");

            if (response.success) {
                let servers = JSON.parse(response.noJsonData);

                this.publicSet.settingsALL["public"]["configAutoMode"] = "local";
                this.publicSet.settingsALL["public"]["configAuto"] = servers;
                this.publicSet.settingsALL["public"]["core"] = "auto";

                this.publicSet.saveSettings();
                this.setSettings();
                this.reloadServers();

                window.showMessageUI(this.publicSet.settingsALL["lang"]["imported_config_file"]);
            } else {
                console.error("Failed to import config:", response.error);
                window.showMessageUI("❌ " + response.error);
            }
        });
        $("#vpn-type-selected").on('change', async () => {
            this.publicSet.settingsALL["public"]["type"] = $("#vpn-type-selected").val(); this.publicSet.saveSettings();
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
        $("#theme-app-value").on("change", () => {
            this.publicSet.settingsALL["public"]["theme"] = $("#theme-app-value").val();
            this.publicSet.saveSettings();
            this.loadTheme();
        });
        $("#conn-test-text").on('input', () => {
            this.publicSet.settingsALL["public"]["testUrl"] = $("#conn-test-text").val(); this.publicSet.saveSettings();
        });
        $("#change-background-btn").on("click", () => {
            let backgroundImageLists = ["1.jpg", "4.jpg", "5.jpg", "6.jpg", "7.jpg", "8.jpg", "9.jpg", "10.jpg", "11.jpg", "12.jpg", "13.jpg", "14.jpg", "15.jpg", "17.jpg", "18.jpg", "19.jpg", "20.jpg"];
            let randomIndex = Math.floor(Math.random() * backgroundImageLists.length);
            let randomImage = backgroundImageLists[randomIndex];
            document.body.style.backgroundSize = "cover";
            document.body.style.backgroundImage = "url('background/" + randomImage + "')";
        });
        $("#x-contact").on("click", () => { this.openLink("https://x.com/Freedom_Guard_N") });
        $("#telegram-contact").on("click", () => { this.openLink("https://t.me/Freedom_Guard_Net") });
        $("#refresh-servers-btn").on("click", async () => {
            this.publicSet.updateISPServers(this.publicSet.settingsALL["public"]["isp"]); await this.publicSet.updateISPServers();
            await this.reloadServers(); this.publicSet.saveSettings(); window.showMessageUI(this.publicSet.settingsALL["lang"]["refreshed_isp_servers"]);
        });
        $("#submit-dns").on("click", async () => {
            this.Tools.setDNS($("#dns1-text").val(), $("#dns2-text").val(), this.Tools.returnOS());
            window.showMessageUI(this.publicSet.settingsALL["lang"]["dns_set_success"])
        });
        $("#freedom-link-status").on("click", () => {
            this.publicSet.settingsALL["public"]["freedomLink"] = !this.publicSet.settingsALL["public"]["freedomLink"]
            this.publicSet.saveSettings();
        });
        $("#quick-connect-status").on("click", () => {
            this.publicSet.settingsALL["public"]["quickConnect"] = !this.publicSet.settingsALL["public"]["quickConnect"]
            this.publicSet.saveSettings();
        });
    };
    addEventSect(core) {
        // Add Event for sect settings
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
                        this.publicSet.log("No available endpoints for the selected IP version.");
                        return;
                    }
                    const randomIP = ipList[Math.floor(Math.random() * ipList.length)];
                    $("#endpoint-warp-value").val(randomIP);
                    this.publicSet.settingsALL["warp"]["endpoint"] = randomIP;
                    this.publicSet.saveSettings();
                    window.showMessageUI(this.publicSet.settingsALL["lang"]["endpoint_retrieved"]);
                } catch (error) {
                    this.publicSet.log("Error fetching endpoint data:", error);
                }
            });
            $("#Gool").on("click", () => {
                if (!this.publicSet.settingsALL["warp"]["gool"]) {
                    this.publicSet.settingsALL["warp"]["cfon"] = false;
                    $("#cfon").prop("checked", this.publicSet.settingsALL["warp"]["cfon"]);
                };
                this.publicSet.settingsALL["warp"]["gool"] = !this.publicSet.settingsALL["warp"]["gool"]; this.publicSet.saveSettings();
            });

            $("#cfon").on("click", () => {
                if (!this.publicSet.settingsALL["warp"]["cfon"]) {
                    this.publicSet.settingsALL["warp"]["gool"] = false;
                    $("#Gool").prop("checked", this.publicSet.settingsALL["warp"]["gool"]);
                };
                this.publicSet.settingsALL["warp"]["cfon"] = !this.publicSet.settingsALL["warp"]["cfon"]; this.publicSet.saveSettings();
            });
            $("#Scan").on("click", () => {
                this.publicSet.settingsALL["warp"]["scan"] = !this.publicSet.settingsALL["warp"]["scan"]; this.publicSet.saveSettings();
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
            var that = this;
            $("#hiddify-config-vibe").on("click", async () => {
                const response = await ipcRenderer.invoke("import-config");
                this.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"] = response["data"];
                this.publicSet.saveSettings();
            });
            $(".vibe-option-state").on("click", function () {
                if (!that.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"] || that.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"] == "null") {
                    that.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"] = that.publicSet.resetVibeSettings();
                }
                let optionVibe = $(this).attr("optionVibe");
                const keys = optionVibe.split(".");

                keys.reduce((acc, key, index) => {
                    if (index === keys.length - 1) {
                        acc[key] = $(this).prop('checked');
                    }
                    return acc[key];
                }, that.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"]);

                that.publicSet.saveSettings();
            });
            $(".vibe-option-value").on("change", function () {
                if (!that.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"] || that.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"] == "null") {
                    that.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"] = that.publicSet.resetVibeSettings();
                }
                let optionVibe = $(this).attr("optionVibe");
                const keys = optionVibe.split(".");

                keys.reduce((acc, key, index) => {
                    if (index === keys.length - 1) {
                        acc[key] = $(this).prop("type") == "number" ? parseInt($(this).prop("value")) : $(this).prop("value");
                    }
                    return acc[key];
                }, that.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"]);

                that.publicSet.saveSettings();
            });
            $("#hiddify-reset-vibe").on("click", async () => {
                that.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"] = that.publicSet.resetVibeSettings();
                this.publicSet.saveSettings();
                this.setSettings();
            });
        }
        else if (core == "grid") {

        }
        else if (core == "flex") {

        }
        else if (core == "masque") {
            var that = this;

            $(".masque-option-state").on("click", function () {
                let optionMasque = $(this).attr("optionMasque");
                const keys = optionMasque.split(".");
                that.publicSet.masque = that.publicSet.masque || {};
                keys.reduce((acc, key, index) => {
                    if (index === keys.length - 1) {
                        acc[key] = $(this).prop('checked');
                    }
                    return acc[key];
                }, that.publicSet.settingsALL["masque"]);

                that.publicSet.saveSettings();
            });
            $(".masque-option-value").on("change", function () {
                let optionMasque = $(this).attr("optionMasque");

                that.publicSet = that.publicSet || {};
                that.publicSet.settingsALL = that.publicSet.settingsALL || {};
                that.publicSet.settingsALL.masque = that.publicSet.settingsALL.masque || {};

                const keys = optionMasque.split(".");
                const value = $(this).prop("type") === "number"
                    ? parseInt($(this).prop("value"))
                    : $(this).prop("value");

                keys.reduce((acc, key, index) => {
                    if (index === keys.length - 1) {
                        acc[key] = value;
                    } else {
                        acc[key] = acc[key] || {};
                    }
                    return acc[key];
                }, that.publicSet.settingsALL.masque);

                that.publicSet.saveSettings();
            });

        }
    };
    setSettings() {
        // Loads and applies saved  settings to the UI elements
        this.publicSet.reloadSettings();
        $("#core-guard-selected").val(this.publicSet.settingsALL["public"]["core"]);
        $("#auto-conn-status").prop("checked", this.publicSet.settingsALL["public"]["auto_conn_after_runs"]);
        $("#vpn-type-selected").val(this.publicSet.settingsALL["public"]["type"]);
        $("#isp-guard-selected").val(this.publicSet.settingsALL["public"]["isp"]);
        $("#bind-address-text").val(this.publicSet.settingsALL["public"]["proxy"]);
        $("#config-value").val(this.publicSet.settingsALL["public"]["configManual"]);
        $("#config-fg-value").val(this.publicSet.settingsALL["public"]["configAutoMode"] == "local" ? "LOCAL SOURCE (SERVERS)" : this.publicSet.settingsALL["public"]["configAuto"]);
        $("#lang-app-value").val(this.publicSet.settingsALL["public"]["lang"]);
        $("#theme-app-value").val(this.publicSet.settingsALL["public"]["theme"] ?? "Dark");
        this.publicSet.settingsALL["public"]["core"] == "vibe" ? $("#config-vibe-value").val(this.publicSet.settingsALL["public"]["configManual"]) : '';
        let imgServer = (() => {
            let s = this.publicSet.settingsALL["public"]["configManual"];
            let [p] = s.split(",;,");
            let q = (s.split("***")[1] ?? "");
            let f = q.split("&").map(x => x.split("=")).find(x => x[0] === "flag")?.[1];
            let proto = p.split("://")[0];

            let file = f
                ? `${f}.svg`
                : (proto === "warp" || proto === "masque" ? "warp.webp" : "vibe.png");

            return file.replaceAll("/", "").replaceAll("\\", "");
        })();
        window.setATTR("#imgServerSelected", "src", "../svgs/" + (imgServer));
        window.setHTML("#textOfServer", decodeURIComponent(this.publicSet.settingsALL["public"]["configManual"].includes("#") ? this.publicSet.settingsALL["public"]["configManual"].split("#").pop().trim().split("***")[0] : this.publicSet.settingsALL["public"]["configManual"].substring(0, 50) == "" ? this.publicSet.settingsALL["public"]["core"] + " Server" : this.publicSet.settingsALL["public"]["configManual"].substring(0, 50)));
        $("#conn-test-text").val(this.publicSet.settingsALL["public"]["testUrl"]);
        $("#endpoint-warp-value").val(this.publicSet.settingsALL["warp"]["endpoint"]);
        $("#selector-ip-version-warp").val(this.publicSet.settingsALL["warp"]["ipv"] ?? "IPV4");
        $("#scan-rtt-value").val(this.publicSet.settingsALL["warp"]["scanrtt"]);
        $("#warp-key-value").val(this.publicSet.settingsALL["warp"]["key"]);
        $("#Gool").prop("checked", this.publicSet.settingsALL["warp"]["gool"]);
        $("#cfon").prop("checked", this.publicSet.settingsALL["warp"]["cfon"]);
        $("#Scan").prop("checked", this.publicSet.settingsALL["warp"]["scan"]);
        $("#freedom-link-status").prop("checked", this.publicSet.settingsALL["public"]["freedomLink"]);
        $("#quick-connect-status").prop("checked", this.publicSet.settingsALL["public"]["quickConnect"] ?? false);
        $("#reserved-status").prop("checked", this.publicSet.settingsALL["warp"]["reserved"]);
        $("#verbose-status").prop("checked", this.publicSet.settingsALL["warp"]["verbose"]);
        $("#test-url-warp-status").prop("checked", this.publicSet.settingsALL["warp"]["testUrl"]);
        let thatHi = this;

        $(".vibe-option-state").each(function () {
            const element = $(this);
            const optionName = element.attr("optionVibe");
            const keysToSync = optionName.split(".");
            if (!thatHi.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"] || thatHi.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"] == "null") {
                thatHi.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"] = thatHi.publicSet.resetVibeSettings();
            }

            let value = thatHi.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"];
            keysToSync.forEach((key) => {
                value = value[key];
            });

            if (value !== undefined) {
                element.prop('checked', value);
            }
        });
        $(".vibe-option-value").each(function () {
            const element = $(this);
            const optionName = element.attr("optionVibe");
            const keysToSync = optionName.split(".");
            if (!thatHi.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"] || thatHi.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"] == "null") {
                thatHi.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"] = thatHi.publicSet.resetVibeSettings();
            }

            let value = thatHi.publicSet.settingsALL["vibe"]["hiddifyConfigJSON"];
            keysToSync.forEach((key) => {
                value = value[key];
            });

            if (value !== undefined) {
                element.prop('value', value);
            }
        });
        $(".masque-option-state").each(function () {
            const element = $(this);
            const optionName = element.attr("optionMasque");
            const keysToSync = optionName.split(".");
            if (!thatHi.publicSet.settingsALL.masque) {
                thatHi.publicSet.settingsALL.masque = {};
            }

            let value = thatHi.publicSet.settingsALL["masque"];
            keysToSync.forEach((key) => {
                value = value[key];
            });

            if (value !== undefined) {
                element.prop('checked', value);
            }
        });
        $(".masque-option-value").each(function () {
            const element = $(this);
            const optionName = element.attr("optionMasque");
            const keysToSync = optionName.split(".");
            if (!thatHi.publicSet.settingsALL.masque) {
                thatHi.publicSet.settingsALL.masque = {};
            }

            let value = thatHi.publicSet.settingsALL["masque"];
            keysToSync.forEach((key) => {
                value = value[key];
            });

            if (value !== undefined) {
                element.prop('value', value);
            }
        });
        $("#dns-warp-value").val(this.publicSet.settingsALL["warp"]["dns"]);
        $("#warp, #vibe, #auto, #flex, #grid, #new".replace("#" + this.publicSet.settingsALL["public"]["core"] + ",", "")).slideUp();
        $(`#${this.publicSet.settingsALL["public"]["core"]}-settings`).addClass("active");
        $(`#${this.publicSet.settingsALL["public"]["core"]}`).slideDown();
        this.addEventSect(this.publicSet.settingsALL["public"]["core"]);
    };
    runActionsFromJSON(url, field) {
        $.getJSON(url, function (data) {
            const actions = data[field];
            if (!actions) {
                window.showMessageUI("⚠️ داده‌ها در دسترس نیستند. لطفاً بعداً دوباره تلاش کنید.");
                return;
            }

            window.showMessageUI("🚀 در حال آماده‌سازی تنظیمات اولیه شما... لطفاً کمی صبر کنید.");

            $.each(actions, function (selector, settings) {
                const events = settings.actions.split(',').map(e => e.trim());
                const $el = $(selector);

                if (settings.value) {
                    $el.val(settings.value);
                }
                if (settings.text) {
                    $el.text(settings.text);
                }
                if (settings.css) {
                    $el.css(settings.css);
                }

                if (selector.includes("vibe")) {
                    $(`#vibe-settings`).addClass("active");
                    $(`#vibe`).slideDown();
                }

                if (!$el.length) return;

                let delay = settings.delay || 500;
                events.forEach(event => {
                    delay += 500;
                    setTimeout(() => {
                        if (event === 'scroll') {
                            $el.animate({ scrollTop: $el[0].scrollHeight }, delay);
                        } else if (event === 'focus') {
                            $el.focus();
                        } else if (event === 'click') {
                            if ($el.prop("checked") == settings.checked ?? false) return;
                            $el.click();
                        }
                    }, delay);
                });
            });

            window.showMessageUI("✅ تنظیمات اولیه با موفقیت انجام شد! آماده شروع هستید 😎");
        });
    };
    showToolBox() {
        $("#tool-box").toggle();
        $("#tool-off-proxy").on("click", () => {
            this.publicSet.offGrid(this.publicSet.settingsALL["public"]["type"]);
            window.showMessageUI("OFF GRID");
        });
        $("#tool-set-grid").on("click", () => {
            this.publicSet.setupGrid(this.publicSet.settingsALL["public"]["proxy"], this.publicSet.settingsALL["public"]["type"]);
            window.showMessageUI("SET GRID ON: " + this.publicSet.settingsALL["public"]["proxy"]);
        });
        $("#tool-auto-mode").on("click", () => {
            this.publicSet.settingsALL["public"]["configManual"] = "freedom-guard://core=auto#Auto Server***flag=ir";
            this.publicSet.saveSettings();
            this.setSettings();
        });
        $("#tool-update-cores").on("click", () => {
            this.Tools.fetchAndInstallCores();
        });
        $("#run-system-check").on("click", () => {
            window.showTestResultUI();
        });
    };
    async reloadServers() {
        // Reloads server list, updates UI, and manages server selection and context menu interactions.
        this.publicSet.reloadSettings();
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

            target.id = "selected-server";

            this.publicSet.log(`🔵 Clicked on server: ${server} | Type: ${serverType}`);

            await this.publicSet.importConfig(server);
            this.setSettings();
            this.reloadServers();
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
    };
    async createServerList(title, servers, container, type) { // Generates and appends a list of servers to the provided container.
        container.innerHTML += `<h2 style='margin:0.7em;'>${title}</h2>`;

        servers.forEach((server, index) => {
            let pre = server.split(",;,")[0];
            let query = server.split("***")[1] ?? "";
            let flag = query.split("&").map(p => p.split("=")).find(p => p[0] === "flag")?.[1];
            let imgServer =
                pre.split("://")[0] === "warp" ? (flag ? `${flag}.svg` : "warp.webp") :
                    true ? (flag ? `${flag}.svg` : "vibe.png") :
                        "vibe.png";
            imgServer = imgServer.replaceAll("/", "").replaceAll("\\", "");
            server = decodeURIComponent(server.replace("vibe,;,", "").replace(",;,", "://"));
            let name = server.includes("#") ? server.split("#").pop().trim().split("***")[0] : server.substring(0, 50);

            let div = document.createElement("div");
            div.className = "country-option";
            div.title = server;
            div.setAttribute("data-type", type);
            div.setAttribute("data-index", index);
            div.setAttribute("data-server", server);
            div.innerHTML = `<img src="../svgs/${imgServer}" alt="${name}"><p>${name}</p>`;
            if (server == this.publicSet.settingsALL["public"]["configManual"] && $("#selected-server").html() == undefined) {
                div.id = "selected-server";
            }
            container.appendChild(div);
        });
    };
    showContextMenuServer(event, server, type, index) {//  Displays a custom right-click context menu for server options.
        let existingMenu = document.getElementById("server-context-menu");
        if (existingMenu) existingMenu.remove();

        let menu = document.createElement("div");
        menu.id = "server-context-menu";
        menu.className = "server-menu";
        menu.style.top = `${event.clientY}px`;
        menu.style.left = `${event.clientX}px`;

        menu.innerHTML = (type != "isp" ? `
            <button class="edit-server"><i class='bx bxs-pencil'></i> ویرایش</button>
            <button class="delete-server"><i class='bx bxs-trash'></i> حذف</button>
            `: `<span style="padding: 0.5em;">برای ویرایش ابتدا با ضربه زدن بر روی سرور آن را اضافه کنید</span>`) + `
            <button class="share-server"><i class='bx bxs-share'></i> اشتراک‌ گذاری</button>
        `;
        if (type != "isp") {
            menu.querySelector(".edit-server").addEventListener("click", async () => {
                let newServer = await window.promptMulti({
                    title: this.publicSet.settingsALL["lang"]["edit_config"],
                    fields: [
                        { label: this.publicSet.settingsALL["lang"]["config_name"], defaultValue: this.publicSet.settingsALL["public"][type == "isp" ? "ispServers" : "importedServers"][index].split("#")[1] == "" ? "no name" : this.publicSet.settingsALL["public"][type == "isp" ? "ispServers" : "importedServers"][index].split("#")[1], name: "name" },
                        { label: this.publicSet.settingsALL["lang"]["config"], defaultValue: this.publicSet.settingsALL["public"][type == "isp" ? "ispServers" : "importedServers"][index].split("#")[0], name: "server" }
                    ],
                    returnName: true
                });
                if (newServer) {
                    newServer = newServer["server"] + "#" + newServer["name"];
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
                const userConfirmed = await window.confirm("آیا مطمئن هستید که می‌خواهید این کانفیگ را حذف کنید؟");
                if (!userConfirmed) return;

                try {
                    await this.publicSet.deleteConfig(server);
                    await this.publicSet.reloadSettings();
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
        }
        menu.querySelector(".share-server").addEventListener("click", async () => {
            try {
                const serverConfig = server.replace(",;,", "://");
                await navigator.clipboard.writeText(serverConfig);
                window.showMessageUI("کانفیگ در کلیپ‌بورد کپی شد!", 5000);
            } catch (error) {
                console.error("خطا در کپی کردن:", error);
                window.showMessageUI("خطا در کپی کردن کانفیگ!", 5000);
            };
            menu.remove();
        });
        document.body.appendChild(menu);

        setTimeout(() => {
            document.addEventListener("click", () => menu.remove(), { once: true });
        }, 100);
    };
    getEmojiCountry(country) {
        return `<img src="../svgs/${country.toLowerCase()}.svg" style="width: 20px; height: 20px;border-radius:0px;"> ${country}`;
    };
    async setPingBox() {// Update UI connected-info
        $("#connected-ping").html(`Pinging...`);
        $("#ip-ping").html(`Pinging...`);
        const connectedInfo = await this.connect.getIP_Ping();
        const countryEmoji = connectedInfo.country ? ` ${this.getEmojiCountry(connectedInfo.country)}` : "🌍 Unknown";
        const isConnected = !connectedInfo.filternet;

        if (this.publicSet.connected) {
            $(".connection, #ip-ping").addClass("connected");
            $("#connected-country").html(`Country: <b style="display:flex;gap:8px;">${countryEmoji}</b>`);
            $("#connected-ping").html(`Ping: <b>${connectedInfo.ping || "N/A"} ms</b>`);
            $("#connected-status").html(`Status: <b>${connectedInfo.ping ? "Connected" : "Disconnected"}</b>`);
            $("#connected-bypass").html(`Bypass: <b>${isConnected ? "On" : "Off"}</b>`);
            this.publicSet.settingsALL.public.core == "warp" ? $("#share-connection").hide() :
                $("#share-connection").on("click", async () => {
                    await this.publicSet.reloadSettings();
                    $("#text-box-notif").html(this.publicSet.settingsALL["lang"]["share-conn"] ?? "You can share your current connected config using the buttons below");
                    $("#box-notif").css("display", "flex");
                    $("#href-box-notif").on("click", () => {
                        navigator.clipboard.writeText(this.publicSet.settingsALL["public"]["quickConnectC"].replace("vibe,;,", "").replace(",;,", "://"));
                        window.showMessageUI(this.publicSet.settingsALL["lang"]["copied"])
                    });
                    $("#href-box-notif").html(this.publicSet.settingsALL["lang"]["copy"] ?? "Copy");
                    $("#close-box-notif").html(this.publicSet.settingsALL["lang"]["cancel"]);

                    $("#href-box-notif, #close-box-notif").on("click", () => {
                        $("#box-notif").css("display", "none");
                    });
                });
        } else {
            $("#ip-ping").attr("style", connectedInfo.ping > 1000 ? "color:red;" : "color:green;");
            $("#ip-ping").html(`${connectedInfo.ping}ms`);
            $(".connection, #ip-ping").removeClass("connected");
        }
    };
    KILLALLCORES(core) { // Terminates a process with the given core name on both Windows and Unix-based systems.
        core = core.toString().toLowerCase() + "-core";
        this.publicSet.log(`Killing ${core}...`);
        if (process.platform == "win32") {
            if (!core || typeof core !== "string") {
                this.publicSet.log("Error: Invalid process name.");
            } else {
                execFile("taskkill", ["/f", "/im", `${core}.exe`], (error, stdout, stderr) => {
                    if (error) {
                        this.publicSet.log(`Error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        this.publicSet.log(`stderr: ${stderr}`);
                        return;
                    }
                    this.publicSet.log(`stdout: ${stdout}`);
                });
            };
            exec("taskkill /F /IM reg.exe", (killError, killStdout, killStderr) => {
                if (killError) {
                    this.publicSet.log(`Error killing reg.exe: ${killError.message}`);
                    return;
                }
                this.publicSet.log("All reg.exe processes closed.");
            });
        }
        else if (process.platform) {
            if (!core || typeof core !== "string") {
                this.publicSet.log("Error: Invalid process name.");
            } else {
                execFile("killall", [core], (error, stdout, stderr) => {
                    if (error) {
                        this.publicSet.log(`Error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        this.publicSet.log(`stderr: ${stderr}`);
                        return;
                    }
                    this.publicSet.log(`stdout: ${stdout}`);
                });
            }
        }
    }
};
class fgCLI extends main {
    constructor() {
        super();
        this.scrollLogs = false;
    };
    init = async () => {
        $("#submit-command-line").on("click", () => {
            let commands = $("#command-line").val();
            commands.split("&&").forEach(command => {
                this.enterCommand(command);
            });
        });
        $("#command-line").on("keypress", (event) => {
            if (event.which === 13) {
                let commands = $("#command-line").val();
                commands.split("&&").forEach(command => {
                    this.enterCommand(command);
                });
            };
        });
        $("#HelpLogs").on("click", () => {
            this.enterCommand("help");
        });
        $("#ScrollLogs").on("click", () => {
            $("#ScrollLogs").attr("state", $("#ScrollLogs").attr("state") == "true" ? "false" : "true");
            this.scrollLogs = ($("#ScrollLogs").attr("state") === "true");
            window.scrollLogs = ($("#ScrollLogs").attr("state") === "true");
            window.scrollLogs == true ? $("#ScrollLogs").html("<i class='bx bx-pause'></i>") : $("#ScrollLogs").html("<i class='bx bx-play'></i>");
        });
    };
    async loadLang() {
        this.publicSet.reloadSettings();
        const response = await fetch(`../components/locales/${this.publicSet.settingsALL["public"]["lang"]}.json`);
        const translations = await response.json();
        return translations;
    }
    async enterCommand(command) {// Executes various user commands from Logs
        $("#command-line").val("");
        command = command.trimStart();
        let commandSplit = command.split(" ");
        let commandName = commandSplit[0];
        let commandArgs = commandSplit.slice(1);
        this.publicSet.reloadSettings();
        this.publicSet.settingsALL["lang"] = await this.loadLang();
        window.LogLOG("$ " + command, "command");
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
            case "cls":
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
                    this.publicSet.reloadSettings();
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
                this.publicSet.reloadSettings();
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
                if (proxy == "off") {
                    this.publicSet.offProxy(proxy);
                }
                break;
            case "about":
                window.LogLOG(this.publicSet.settingsALL["lang"]["about_app_html"], "info", "html");
                break;
            case "refresh":
                this.publicSet.reloadSettings();
                this.reloadServers();
                this.setPingBox();
                this.setSettings();
            default:
                window.LogLOG("Command not found");
                break;
        }
        this.scrollLogs == true ? $("#LogsContent").scrollTop($("#LogsContent")[0].scrollHeight) : '';
        $("#command-line").focus();
    };
    helpCommand() {
        window.LogLOG("Available commands:");
        window.LogLOG("&nbsp;&nbsp;&nbsp;connect - Connect to VPN with core selected(setting)", "info", "html");
        window.LogLOG("&nbsp;&nbsp;&nbsp;start - start [core] [args]", "info", "html");
        window.LogLOG("&nbsp;&nbsp;&nbsp;disconnect - Disconnect from VPN", "info", "html");
        window.LogLOG("&nbsp;&nbsp;&nbsp;ping - Get IP information", "info", "html");
        window.LogLOG("&nbsp;&nbsp;&nbsp;set - settings->set public core warp", "info", "html");
        window.LogLOG("&nbsp;&nbsp;&nbsp;show - settings->show public core", "info", "html");
        window.LogLOG("&nbsp;&nbsp;&nbsp;kill - only core selected mode->kill warp (/f)", "info", "html");
        window.LogLOG("&nbsp;&nbsp;&nbsp;refresh - refresh(isp servers, settings, ping, ...)", "info", "html");
        window.LogLOG("&nbsp;&nbsp;&nbsp;clear - Clear logs", "info", "html");
        window.LogLOG("&nbsp;&nbsp;&nbsp;exit - Exit application", "info", "html");
    };
};
// #endregion
const mainSTA = new main();
mainSTA.init();
const fgCLI_STA = new fgCLI();
fgCLI_STA.init();
// #region end components
window.messageQueue = [];
window.isMessageShowing = false;

window.reloadPing = () => {
    mainSTA.setPingBox();
};
window.setSettings = () => {
    mainSTA.setSettings();
};
window.startNewUser = () => {
    $("#start-box").css("display", "flex");
    $("#start-box").css("gap", "0.3em");
    $("#submit-start").on("click", () => {
        mainSTA.publicSet.settingsALL["public"]["isp"] = $("#selector-isp-start").val();
        if ($("#selector-mode-start").val() == "import") {
            $("#box-select-server-mini").trigger("click");
        };
        mainSTA.publicSet.settingsALL["public"]["lang"] = $("#selector-lang-start").val();
        mainSTA.publicSet.saveSettings();
        window.showMessageUI(mainSTA.publicSet.settingsALL["lang"]["mess-change-lang"], 5000);
        mainSTA.loadLang();
        mainSTA.publicSet.saveSettings();
        $("#start-box").hide();
        window.setSettings();
        window.showMessageUI(mainSTA.publicSet.settingsALL["lang"]["start_mess"])
        trackEvent("new_user", { isp: mainSTA.publicSet.settingsALL["public"]["isp"] });

    });
};
window.showMessageUI = (message, duration = 3000) => {
    window.messageQueue.push({ message, duration });
    if (typeof window.LogLOG === "function") window.LogLOG(message.toString());
    processMessageQueue();
    function processMessageQueue() {
        if (window.isMessageShowing || window.messageQueue.length === 0) return;

        const { message, duration } = window.messageQueue.shift();
        const $box = $("#message");
        const $text = $("#messageText");

        if ($box.length === 0 || $text.length === 0) {
            window.isMessageShowing = false;
            return;
        }

        $text.html(message);
        $box.addClass("show-message").fadeIn(200);
        window.isMessageShowing = true;

        setTimeout(() => {
            $box.fadeOut(300, () => {
                $box.removeClass("show-message");
                window.isMessageShowing = false;
                processMessageQueue();
            });
        }, duration);
    };
};
window.showModal = (mess = "", link = "", btnOpenLinkHTML = "بازش کن", btnCloseModalHTML = "الان حالش نیست") => {
    $("#text-box-notif").html(mess.replaceAll("\n", "<br />"));
    $("#box-notif").css("display", "flex");
    $("#href-box-notif").attr("href", link);
    $("#href-box-notif").html(btnOpenLinkHTML);
    $("#close-box-notif").html(btnCloseModalHTML);
    $("#href-box-notif, #close-box-notif").on("click", () => {
        $("#box-notif").css("display", "none");
    });
};
window.showBox = (text = "") => {
    $("#box").css("display", "flex");
    $("#text-box").html(text);
    $("#close-box").on("click", () => {
        $("#box").css("display", "none");
    });
};
window.promptMulti = ({
    title = "ورودی اطلاعات",
    fields = [{ name: "input1", label: "ورودی 1", defaultValue: "" }],
    returnName = false
}) => {
    return new Promise((resolve) => {
        const $promptBox = $("#prompt");
        const $promptTitle = $("#prompt-title");
        const $promptContent = $("#prompt-content");
        const $confirmBtn = $("#confirm-prompt");
        const $cancelBtn = $("#cancel-prompt");
        const $addFieldBtn = $("#add-field");

        $promptTitle.text(title);
        $promptContent.empty();

        const inputs = [];

        fields.forEach(({ name, label, defaultValue }, index) => {
            const $wrapper = $("<div>").addClass("input-wrapper");
            const $inputLabel = $("<label>").attr("for", `input-${index}`).text(label);
            const $inputField = $("<input>").attr({ type: "text", id: `input-${index}`, value: defaultValue, "data-name": name, class: "input input-alt" });

            $wrapper.append($inputLabel, $inputField);
            $promptContent.append($wrapper);
            inputs.push($inputField);
        });

        $promptBox.removeClass("hidden");
        inputs[0].focus();

        $addFieldBtn.off().on("click", () => {
            const index = inputs.length;
            const fieldName = `input${index + 1}`;
            const $wrapper = $("<div>").addClass("input-wrapper");
            const $inputLabel = $("<label>").attr("for", `input-${index}`).text(`ورودی ${index + 1}`);
            const $inputField = $("<input>").attr({ type: "text", id: `input-${index}`, "data-name": fieldName });

            $wrapper.append($inputLabel, $inputField);
            $promptContent.append($wrapper);

            inputs.push($inputField);
            $inputField.focus();
        });

        const closePrompt = (values) => {
            resolve(values);
            $promptBox.addClass("hidden");
        };

        $confirmBtn.off().on("click", () => {
            let values;
            if (returnName) {
                values = {};
                inputs.forEach(input => values[$(input).attr("data-name")] = $(input).val());
            } else {
                values = inputs.map(input => $(input).val());
            }
            closePrompt(values);
        });

        $cancelBtn.off().on("click", () => closePrompt(null));

        inputs.forEach(($input, index) => {
            $input.on("keydown", (event) => {
                if (event.key === "Enter" && index === inputs.length - 1) $confirmBtn.click();
                if (event.key === "Escape") closePrompt(null);
            });
        });
    });
};
window.showTestResultUI = async () => {
    window.showMessageUI("TESTING...");
    const result = await mainSTA.Tools.testSystemCompatibility();
    let html = `
        <h3 style="text-align:center;">🧪 نتیجه تست سیستم و هسته‌ها</h3>
        <p>🖥️ سیستم عامل: <b>${result.os}</b> | معماری: <b>${result.arch}</b></p>
        <p>📁 مسیر هسته‌ها: <code>${result.coresPath}</code></p>
        <p>⚙️ پشتیبانی از پراکسی سیستمی: <b>${result.proxyTest.success}</b></p>
        <p>📡 DNS ست شده: <b style="color:${result.dnsTest.success ? 'green' : 'red'}">${result.dnsTest.success}</b></p>
        <p>🧩 پراکسی ست شده: <b style="color:${result.proxyTest.success ? 'green' : 'red'}">${result.proxyTest.success}</b></p>
        <h4>🌀 Vibe-Core</h4>
        <p>📦 وجود فایل: <b style="color:${result.coresExist.vibe ? 'green' : 'red'}">${result.coresExist.vibe}</b></p>
        <p>▶️ اجرای واقعی:${result.runTest.vibe.success} | کد خروج: ${result.runTest.vibe.exitCode}</p>
        <h4>🌐 Warp-Core</h4>
        <p>📦 وجود فایل: <b style="color:${result.coresExist.warp ? 'green' : 'red'}">${result.coresExist.warp}</b></p>
        <p>▶️ اجرای واقعی: ${result.runTest.warp.success} | کد خروج: ${result.runTest.warp.exitCode}</p>
`;
    $("#system-check-result-value").html(html);
    $("#system-check-result").toggle();
};
// #endregion
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
        mainSTA.publicSet.log("import config from deep link -> " + link.split("freedom-guard://")[1]);

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
ipcRenderer.on("open-section", (event, section) => {
    if (section == "home") {
        $("#box-select-server").hide();
        $("#setting-app").hide();
    }
    if (section == "settings") {
        $("#setting-app").toggle();
    }
    else if (section == "browser") {
        ipcRenderer.send("load-browser");
    }
    else if (section == "servers") {
        $("#box-select-server").toggle();
    }
});
// #endregion