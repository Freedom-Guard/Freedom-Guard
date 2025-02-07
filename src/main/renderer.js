// #region Libraries 
const { ipcRenderer, dialog } = require('electron');
const { path } = require('path');
const { readFileSync } = require('fs');
const { connect, connectAuto, test, publicSet } = require('../components/connect');
let $ = require('jquery');
const { count } = require('console');
window.$ = $;
const vesrionApp = "2.0.0";
class main {
    constructor() {
        this.connect = new connect();
        this.connectAuto = new connectAuto();
        this.test = new test();
        this.publicSet = new publicSet();
    };
    init = async () => {
        await this.loading();
        this.addEvents();
        this.setSettings();
        this.reloadServer();
        this.setPingBox(await this.publicSet.getIP_Ping());
    };
    connectFG() {
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
    addEvents() {
        $('#menu-show, #menu-exit').on('click', () => {
            $('#menu').toggleClass('show');
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
        $("#warp, #vibe, #auto, #flex, #grid").slideUp();
        $(`#${this.publicSet.settingsALL["public"]["core"]}`).slideDown();
        this.addEventSect(this.publicSet.settingsALL["public"]["core"]);
    };
    reloadServer() {

    };
    setPingBox({ ip, ping, country, filternet }) {
        let countryEmoji = country ? `🌍 ${country}` : "🌍 Unknown";
        let isConnected = filternet;
        let htmlContent = "";
        if (isConnected) {
            htmlContent = `
                <p class="ip-ping-item">
                    <span class="ip-icon">🌍</span> 
                    Country: <b>${countryEmoji}</b>
                </p>
                <p class="ip-ping-item">
                    <span class="ip-icon">🔍</span> 
                    IP: <b>${ip || "Unknown"}</b>
                </p>
                <p class="ip-ping-item">
                    <span class="ip-icon">⚡</span> 
                    Ping: <b>${ping || "N/A"} ms</b>
                </p>
                <p class="ip-ping-item">
                    <span class="ip-icon">🚀</span> 
                    Bypass: <b>${filternet ? "On" : "Off"}</b>
                </p>
                <p id="connection-status" class="ip-status ${isConnected ? '' : 'disconnected'}">
                    ${isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                </p>
        `;
        } else {
            htmlContent = `
                <p class="ip-ping-item" style='margin:0;padding:0;'>
                    <b style='color:${ping > 1500 ? "red" : "green"};margin:0.5em 1em'>${ping}ms</b>
                </p>
                `
        }
        $("#ip-ping").html(htmlContent);
        isConnected ? $("#ip-ping").addClass("connected") : $("#ip-ping").removeClass("connected");
    };
};
const mainSTA = new main();
mainSTA.init();