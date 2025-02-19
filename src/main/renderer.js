// #region Libraries 
const { ipcRenderer, dialog, shell } = require('electron');
const { remote } = require('electron');
const { path } = require('path');
const { readFileSync } = require('fs');
const { connect, connectAuto, test, publicSet } = require('../components/connect');
let $ = require('jquery');
const { count } = require('console');
const { exec, execFile, spawn } = require('child_process');
const { on } = require('events');
window.$ = $;
const vesrionApp = "2.0.0";
let LOGS = [];
window.LogLOG = (log = "", type = "info") => {
    LOGS.push(log);
    $("#LogsContent").append(`<p class="log-item">${log}</p>`);
    if (type == "clear") { $("#LogsContent").html("Logs Cleared!") };
    $("#LogsContent").scrollTop($("#LogsContent")[0].scrollHeight);
};
window.diconnectedUI = () => {
    $("#ChangeStatus").removeClass("connecting");
    mainSTA.publicSet.status = false;
    mainSTA.publicSet.connected = false;
    mainSTA.connect.killVPN(mainSTA.publicSet.settingsALL["public"]["core"]);
    mainSTA.connectAuto.killVPN();
};
window.connectedUI = () => {
    $("#ChangeStatus").addClass("connected");
    $("#ip-ping").trigger("click");
    $("#ChangeStatus").removeClass("connecting");
    mainSTA.publicSet.status = true;
    mainSTA.publicSet.connected = true;
};
window.setHTML = (selector, text) => {
    $(selector).html(text);
};
class main {
    constructor() {
        this.connect = new connect();
        this.connectAuto = new connectAuto();
        this.test = new test();
        this.path = require("path");
        this.axios = require('axios');
        this.publicSet = new publicSet();
    };
    init = async () => {
        this.publicSet.LOGLOG("App Started");
        await this.loading();
        this.addEvents();
        this.setSettings();
        this.reloadServers();
        this.setPingBox();
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

    connectVPN() {

    };
    killVPN() {

    };
    onConnect() {

    };
    openLink(href) {
        shell.openExternal(href);
    }
    addEvents() {
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
        $('#menu-freedom-plus').on('click', () => {
            ipcRenderer.send("load-file", "./src/plus/index.html")
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
            $("#more-options-content").fadeToggle(300);
            $("#more-options-content").toggleClass("active");
        });
        $("#close-about").on('click', () => {
            $("#about-app").hide();
        });
        $("#box-select-country-mini").on('click', () => {
            $("#box-select-country").slideToggle("slow");
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
            $("#Logs").slideToggle("slow");
        });
        $("#ClearLogs").on("click", () => {
            window.LogLOG("", "clear");
        });
        $("#CopyLogs").on("click", () => {
            let logs = LOGS.join("\n");
            navigator.clipboard.writeText(logs);
        });
        $("#menu-kill-all").on("click", () => {
            this.KILLALLCORES('warp');
            this.KILLALLCORES('flex');
            this.KILLALLCORES('grid');
            this.KILLALLCORES('vibe');
            this.publicSet.offProxy();
            this.setPingBox();
        });
        $("#add-server-btn").on("click", () => {
            let settingApp = $("#setting-app");
            settingApp.show().animate({ right: "0px" }, 700);
            $("#config-value").focus();
        });
        process.nextTick(() => this.addEventsSetting());
    };
    addEventsSetting() {
        $("#core-guard-selected").on('change', () => {
            this.publicSet.settingsALL["public"]["core"] = $("#core-guard-selected").val(); this.publicSet.saveSettings();
            $("#warp, #vibe, #auto, #flex, #grid").slideUp();
            $(`#${this.publicSet.settingsALL["public"]["core"]}`).slideDown();
            this.publicSet.settingsALL["public"]["core"] == "warp" ? $("#vpn-type-selected").val("system") : '';
            this.addEventSect(this.publicSet.settingsALL["public"]["core"]);
        });
        $("#reset-setting-btn").on("click", () => {
            this.publicSet.resetSettings();
        });
        $("#config-fg-value").on("input", () => {
            this.publicSet.settingsALL["public"]["configAuto"] = $("#config-fg-value").val(); this.publicSet.saveSettings();
        });
        $("#submit-config").on("click", async () => {
            await this.publicSet.importConfig($("#config-value").val());
            this.setSettings();
            this.reloadServers();
        });
        $("#vpn-type-selected").on('change', () => {
            if (!(this.publicSet["settingsALL"]["public"]["core"] != "vibe" && $("#vpn-type-selected").val() == "tun")) {
                this.publicSet.settingsALL["public"]["type"] = $("#vpn-type-selected").val(); this.publicSet.saveSettings();
            } else {
                alert("tun mode only for Freedom vibe");
                $("#vpn-type-selected").val("system");
            }
        });
        $("#bind-address-text").on('change', () => {
            this.publicSet.settingsALL["public"]["proxy"] = $("#bind-address-text").val(); this.publicSet.saveSettings();
        });
        $("#isp-guard-selected").on('change', () => {
            this.publicSet.settingsALL["public"]["isp"] = $("#isp-guard-selected").val(); this.publicSet.saveSettings();
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
    };
    addEventSect(core) {
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
            $("#config-vibe-value").on("input", () => {
                this.publicSet.settingsALL["public"]["configManual"] = $("#config-vibe-value").val();
                this.publicSet.settingsALL["vibe"]["config"] = $("#config-vibe-value").val();
                this.publicSet.saveSettings();
            });
        }
        else if (core == "grid") {

        }
        else if (core == "flex") {

        }
    }
    setSettings() {
        this.publicSet.ReloadSettings();
        this.reloadServers();
        $("#core-guard-selected").val(this.publicSet.settingsALL["public"]["core"]);
        $("#vpn-type-selected").val(this.publicSet.settingsALL["public"]["type"]);
        $("#isp-guard-selected").val(this.publicSet.settingsALL["public"]["isp"]);
        $("#bind-address-text").val(this.publicSet.settingsALL["public"]["proxy"]);
        $("#config-value").val(this.publicSet.settingsALL["public"]["configManual"]);
        this.publicSet.settingsALL["public"]["core"] == "vibe" ? $("#config-vibe-value").val(this.publicSet.settingsALL["public"]["configManual"]) : '';
        window.setHTML("#textOfCfon", this.publicSet.settingsALL["public"]["configManual"].includes("#") ? this.publicSet.settingsALL["public"]["configManual"].split("#").pop().trim() : this.publicSet.settingsALL["public"]["configManual"].substring(0, 50) == "" ? "Auto Server" : this.publicSet.settingsALL["public"]["configManual"].substring(0, 50));
        $("#conn-test-text").val(this.publicSet.settingsALL["public"]["testUrl"]);
        $("#endpoint-warp-value").val(this.publicSet.settingsALL["warp"]["endpoint"]);
        $("#selector-ip-version-warp").val(this.publicSet.settingsALL["warp"]["ipv"] ?? "IPV4");
        $("#scan-rtt-value").val(this.publicSet.settingsALL["warp"]["scanrtt"]);
        $("#warp-key-value").val(this.publicSet.settingsALL["warp"]["key"]);
        $("#Gool").prop("checked", this.publicSet.settingsALL["warp"]["gool"]);
        $("#Scan").prop("checked", this.publicSet.settingsALL["warp"]["scan"]);
        $("#reserved-status").prop("checked", this.publicSet.settingsALL["warp"]["reserved"]);
        $("#verbose-status").prop("checked", this.publicSet.settingsALL["warp"]["verbose"]);
        $("#test-url-warp-status").prop("checked", this.publicSet.settingsALL["warp"]["testUrl"]);
        $("#dns-warp-value").val(this.publicSet.settingsALL["warp"]["dns"]);
        $("#warp, #vibe, #auto, #flex, #grid").slideUp();
        $(`#${this.publicSet.settingsALL["public"]["core"]}`).slideDown();
        this.addEventSect(this.publicSet.settingsALL["public"]["core"]);
    };
    async reloadServers() {
        this.publicSet.ReloadSettings();
        await this.publicSet.updateISPServers();
        let ispServers = this.publicSet.settingsALL["public"]["ispServers"];
        let importedServers = this.publicSet.settingsALL["public"]["importedServers"];
        let box = document.getElementById("box-select-country");
        box.innerHTML = `
        <button class="btn" style="border-top-right-radius: 0;border-bottom-left-radius: 0;margin-bottom:0.5em;" id="add-server-btn">
            Add Server
        </button>`;
        $("#add-server-btn").on("click", () => {
            let settingApp = $("#setting-app");
            settingApp.show().animate({ right: "0px" }, 700);
            $("#config-value").focus();
        });
        importedServers.forEach(server => {
            let name = server.includes("#") ? server.split("#").pop().trim() : server.substring(0, 50);
            let div = document.createElement("div");
            div.className = "country-option";
            div.title = server;
            div.innerHTML = `<img src="../svgs/glob.svg" alt="${name}"><p>${name}</p>`;
            div.addEventListener("click", async () => {
                await this.publicSet.importConfig(server);
                this.setSettings();
            });
            div.addEventListener("contextmenu", async () => {
                const userConfirmed = await ipcRenderer.invoke("submit-dialog", "آیا مطمئن هستید که می‌خواهید کانفیگ را حذف کنید؟");
                if (!userConfirmed) return;
                this.publicSet.LOGLOG("delete config -> " + server)
                try {
                    if (!server) return;

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
            });

            box.appendChild(div);

        });
        box.innerHTML += "<h2 style='margin:0.7em;'>ISP Servers</h2>";
        ispServers.forEach(server => {
            server = server.replace("vibe,;,", "").replace(",;,", "://");
            let name = server.includes("#") ? server.split("#").pop().trim() : server.substring(0, 50);
            let div = document.createElement("div");
            div.className = "country-option";
            div.title = server;
            div.innerHTML = `<img src="../svgs/glob.svg" alt="${name}"><p>${name}</p>`;
            div.addEventListener("click", async () => {
                await this.publicSet.importConfig(server);
                this.setSettings();
            });
            div.addEventListener("contextmenu", async () => {
                const userConfirmed = await ipcRenderer.invoke("submit-dialog", "آیا مطمئن هستید که می‌خواهید کانفیگ را حذف کنید؟");
                if (!userConfirmed) return;
                this.publicSet.LOGLOG("delete config -> " + server)
                try {
                    if (!server) return;

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
            });

            box.appendChild(div);

        });
    };
    async setPingBox() {
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
    KILLALLCORES(core) {
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
    async enterCommand(command) {
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
                break;
            case "update":
            // update isp, servers (not ready)
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