// #region Libraries 
const { ipcRenderer, dialog, shell } = require('electron');
const { path } = require('path');
const { readFileSync } = require('fs');
const { connect, connectAuto, test, publicSet } = require('../components/connect');
let $ = require('jquery');
const { count } = require('console');
const { exec, execFile, spawn } = require('child_process');
window.$ = $;
const vesrionApp = "2.0.0";
let LOGS = [];
function connectedUI() {
    $("#ChangeStatus").addClass("connected");
    $("#ip-ping").trigger("click");
    $("#ChangeStatus").removeClass("connecting");
};
window.LogLOG = (log = "", type = "info") => {
    LOGS.push(log);
    $("#LogsContent").append(`<p class="log-item">${log}</p>`);
    if (type == "clear") { $("#LogsContent").html("Logs Cleared!") };
};
class main {
    constructor() {
        this.connect = new connect();
        this.connectAuto = new connectAuto();
        this.test = new test();
        this.path = require("path");
        this.publicSet = new publicSet();
    };
    init = async () => {
        this.publicSet.LOGLOG("App Started");
        await this.loading();
        this.addEvents();
        this.setSettings();
        this.reloadServer();
        this.setPingBox(await this.publicSet.getIP_Ping());
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
            this.publicSet.status = false;
            this.connect.killVPN(this.publicSet.settingsALL["public"]["core"]);
            this.connectAuto.killVPN();
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
        $("#menu-about").on('click', () => {
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
            $("#box-select-country").slideToggle();
            $("#box-select-country").toggleClass("show");
        });
        $("#menu-exit-app").on('click', () => {
            ipcRenderer.send("exit-app");
        });
        $("#ip-ping").on('click', async () => {
            this.setPingBox(await this.publicSet.getIP_Ping());
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
        process.nextTick(() => this.addEventsSetting());
    };
    addEventsSetting() {
        $("#core-guard-selected").on('change', () => {
            this.publicSet.settingsALL["public"]["core"] = $("#core-guard-selected").val(); this.publicSet.saveSettings();
            $("#warp, #vibe, #auto, #flex, #grid").slideUp();
            $(`#${this.publicSet.settingsALL["public"]["core"]}`).slideDown();
            this.addEventSect(this.publicSet.settingsALL["public"]["core"]);
        });
        $("#vpn-type-selected").on('change', () => {
            this.publicSet.settingsALL["public"]["type"] = $("#vpn-type-selected").val(); this.publicSet.saveSettings();
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

    };
    addEventSect(core) {
        if (core == "warp") {
            $("#endpoint-warp-value").on("input", () => {
                this.publicSet.settingsALL["warp"]["endpoint"] = $("#endpoint-warp-value").val(); this.publicSet.saveSettings();
            });
            $("#Gool").on("click", () => {
                this.publicSet.settingsALL["warp"]["gool"] = !this.publicSet.settingsALL["warp"]["gool"]; this.publicSet.saveSettings();
            });
            $("#Scan").on("click", () => {
                this.publicSet.settingsALL["warp"]["scan"] = !this.publicSet.settingsALL["warp"]["scan"]; this.publicSet.saveSettings();
            });
        }
        else if (core == "vibe") {

        }
        else if (core == "grid") {

        }
        else if (core == "flex") {

        }
    }
    setSettings() {
        this.publicSet.ReloadSettings();
        $("#core-guard-selected").val(this.publicSet.settingsALL["public"]["core"]);
        $("#vpn-type-selected").val(this.publicSet.settingsALL["public"]["type"]);
        $("#isp-guard-selected").val(this.publicSet.settingsALL["public"]["isp"]);
        $("#bind-address-text").val(this.publicSet.settingsALL["public"]["proxy"]);
        $("#conn-test-text").val(this.publicSet.settingsALL["public"]["testUrl"]);
        $("#endpoint-warp-value").val(this.publicSet.settingsALL["warp"]["endpoint"]);
        $("#Gool").val(this.publicSet.settingsALL["warp"]["gool"]);
        $("#Scan").val(this.publicSet.settingsALL["warp"]["scan"]);
        $("#warp, #vibe, #auto, #flex, #grid").slideUp();
        $(`#${this.publicSet.settingsALL["public"]["core"]}`).slideDown();
        this.addEventSect(this.publicSet.settingsALL["public"]["core"]);
    };
    reloadServer() {

    };
    async setPingBox() {
        let data = await this.publicSet.getIP_Ping();
        let countryEmoji = data.country ? `🌍 ${data.country}` : "🌍 Unknown";
        let isConnected = !data.filternet;
        let htmlContent = "";
        if (isConnected) {
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
                <p id="connection-status" class="ip-status ${isConnected ? '' : 'disconnected'}">
                    ${isConnected ? '🟢 Connected' : '🔴 Disconnected'}
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
            this.publicSet.connected = false;
        }
        $("#ip-ping").html(htmlContent);
        isConnected ? $("#ip-ping, #ChangeStatus").addClass("connected") : $("#ip-ping, #ChangeStatus").removeClass("connected");
    };
    KILLALLCORES(core) {
        core = core.toString().toLowerCase() + "-core";
        window.LogLOG(`Killing ${core}...`);
        if (process.platform == "win32") {
            if (!core || typeof core !== "string") {
                window.LogLOG("Error: Invalid process name.");
            } else {
                execFile("taskkill", ["/f", "/im", `${core}.exe`], (error, stdout, stderr) => {
                    if (error) {
                        window.LogLOG(`Error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        window.LogLOG(`stderr: ${stderr}`);
                        return;
                    }
                    window.LogLOG(`stdout: ${stdout}`);
                });
            }
        }
        else if (process.platform) {
            if (!core || typeof core !== "string") {
                window.LogLOG("Error: Invalid process name.");
            } else {
                execFile("killall", [core], (error, stdout, stderr) => {
                    if (error) {
                        window.LogLOG(`Error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        window.LogLOG(`stderr: ${stderr}`);
                        return;
                    }
                    window.LogLOG(`stdout: ${stdout}`);
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
            }
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
                    this.publicSet.saveSettisngs();
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
window.disconnect = () => {

}