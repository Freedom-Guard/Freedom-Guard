const { rejects } = require('assert');
const { spawn, exec, execSync } = require('child_process');
const { protocol } = require('electron');
const fs = require('fs');
const { notify } = require('node-notifier');
const { type } = require('os');
const { resolve } = require('path');
const { trackEvent } = require("@aptabase/electron/renderer");
trackEvent("app_started");
read_file = function (path) {
    return fs.readFileSync(path, 'utf8');
};
write_file = function (path, output) {
    fs.writeFileSync(path, output);
};
class publicSet {
    constructor() {
        this.axios = require('axios');
        this.geoip = require('geoip-lite');
        this.path = require('path');
        this.setTimeout = require('timers').setTimeout;
        this.Winreg = require('winreg');
        this.status = false;
        this.connected = false;
        this.Process = {
            "vibe": function kill() { },
            "flex": function kill() { },
            "grid": function kill() { },
            "warp": function kill() { },
            "vibeAuto": function kill() { },
            "flexAuto": function kill() { },
            "gridAuto": function kill() { },
            "warpAuto": function kill() { },
            "setupAuto": function kill() { },
            "setup": function kill() { }
        };
        this.mainDir = this.path.join(__dirname + "/../../");
        this.coresPath = this.path.join(__dirname.replace("app.asar", "") + "/../../", "src/main/cores/", process.platform);
        this.settingsALL = {
            "flex": {},
            "grid": {},
            "vibe": {
                config: "",
                typeConfig: "url/file",
                dnsDirect: "",
                dnsRemote: "",
                configFile: "",
                fragmentSize: "",
                fragment: "",
                fragmentSleep: "",
                timeout: 60000
            },
            "warp": {
                gool: false,
                scan: false,
                endpoint: "",
                reserved: false,
                dns: "",
                verbose: false,
                scanrtt: "",
                ipv: "IPV4",
                key: "",
                timeout: 60000,
                cfon: false,
                testUrl: false,
            },
            "setupGrid": {},
            "public": {
                proxy: "127.0.0.1:8086",
                configAuto: "https://raw.githubusercontent.com/Freedom-Guard/Freedom-Guard/main/config/index.json",
                configManual: "",
                core: "auto",
                dns: ["8.8.8.8"],
                protocol: "auto",
                testUrl: "https://1.1.1.1/cdn-cgi/trace",
                type: "system",
                isp: "other",
                importedServers: ["freedom-guard://core=auto#Auto Server"],
                ispServers: [],
                timeout: 60000
            }
        };
        this.supported = {
            vibe: ["ss", "http", "vless", "vmess", "trojan", "hysteria", "shadowtls", "tuic", "socks", "wireguard", "hy2"],
            warp: ["warp"],
            grid: ["grid"],
            flex: ["flex"],
            other: ["freedom-guard://"]
        };
        this.Tools = new Tools();
    };
    saveSettings(settingsSave = this.settingsALL) {
        write_file('freedom-guard.json', JSON.stringify(settingsSave));
        this.settingsALL = settingsSave;
    };
    async ReloadSettings() {
        try {
            this.settingsALL = JSON.parse(read_file('freedom-guard.json'));
        } catch (error) { this.saveSettings(); this.LOGLOG("settings file not found: saveSettings") }
    };
    async getIP_Ping() {
        let responseFunc = { ip: "", ping: "", country: "unknown", filternet: true };
        try {
            const time = Date.now();
            const response = await this.axios.get("https://api.ipify.org?format=json", { timeout: 3000 });

            responseFunc.ip = response.data.ip;
            responseFunc.ping = Date.now() - time;
            responseFunc.country = this.geoip.lookup(response.data.ip)?.country || "unknown";
            try {
                const testResponse = await this.axios.get(this.settingsALL["public"]["testUrl"], { timeout: 3000 });
                responseFunc.filternet = false;
                this.LOGLOG("filternet is not active!");
            } catch (err) {
                this.LOGLOG("filternet check failed, assuming active!");
            }

        } catch (error) {
            this.LOGLOG("خطا در دریافت IP:", error);
        }
        return responseFunc;
    };
    LOGLOG(text = "", type = 'log') {
        if (type == "clear") {
            window.LogLOG("", "clear");
            console.clear();
        }
        else {
            window.LogLOG(text);
            console.log(text);
        }
    };
    connectedVPN(core) {
        this.LOGLOG("connected " + core);
        notify({
            title: 'Connected!',
            message: `Proxy has been set to ${this.settingsALL["public"]["proxy"]}`,
            icon: this.path.join(this.mainDir, 'src/assets/icon/ico.png'),
            sound: true,
            wait: true,
            appID: 'Freedom Guard'
        });
        trackEvent("connected", {
            core: this.settingsALL["public"]["core"],
            isp: this.settingsALL["public"]["isp"]
        })
        window.connectedUI();
    };
    setProxy(proxy, type = "socks5") {
        this.LOGLOG("setting proxy...");
        this.Tools.setProxy(this.Tools.returnOS(), proxy);
        this.LOGLOG("proxy -> " + proxy);
        // else if (process.platform == "linux") {
        //     alert(`Proxy ${type} with ${this.settingsALL["public"]["core"]}: ${this.settingsALL["public"]["proxy"]} ==== Please set this proxy on your system.`);
        // };
    };
    offProxy() {
        const setRegistryValue = (key, name, type, value) => {
            return new Promise((resolve, reject) => {
                key.set(name, type, value, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        };
        const offProxy = async () => {
            const regKey = new this.Winreg({
                hive: this.Winreg.HKCU,
                key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'
            });

            try {
                await setRegistryValue(regKey, 'ProxyEnable', this.Winreg.REG_DWORD, 0);
            } catch (error) {
                this.LOGLOG('Error off proxy:', error);
            }
        };
        offProxy();
    }
    async sleep(time) {
        return new Promise((resolve) => {
            this.setTimeout(resolve, time);
        });
    };
    diconnectedUI() {
        window.diconnectedUI();
    };
    resetSettings() {
        this.settingsALL = {
            "flex": {},
            "grid": {},
            "vibe": {
                config: "",
                typeConfig: "url/file",
                dnsDirect: "",
                dnsRemote: "",
                configFile: "",
                fragmentSize: "",
                fragment: "",
                fragmentSleep: "",
                timeout: 60000
            },
            "warp": {
                gool: false,
                scan: false,
                endpoint: "",
                reserved: false,
                dns: "",
                verbose: false,
                scanrtt: "",
                ipv: "IPV4",
                key: "",
                timeout: 60000,
                cfon: false,
                testUrl: false,
            },
            "setupGrid": {},
            "public": {
                proxy: "127.0.0.1:8086",
                configAuto: "https://raw.githubusercontent.com/Freedom-Guard/Freedom-Guard/main/config/index.json",
                configManual: "",
                core: "auto",
                dns: ["8.8.8.8"],
                protocol: "auto",
                testUrl: "https://1.1.1.1/cdn-cgi/trace",
                type: "system",
                isp: "other",
                importedServers: ["freedom-guard://core=auto#Auto Server"],
                ispServers: [],
                timeout: 45000
            },

        };
        this.saveSettings();
        alert("settings deafult!");
        location.reload();
    };
    async importConfig(config) {
        try { config = config.toString() } catch { if (config == "") { alert("config is empty!"); return; } };
        this.LOGLOG(config);
        this.settingsALL["public"]["configManual"] = config;
        if (!(this.settingsALL["public"]["importedServers"].some(server => config == server))) {
            this.settingsALL["public"]["importedServers"].push(config)
        }
        if (this.supported["vibe"].some(protocol => config.startsWith(protocol))) {
            this.settingsALL["public"]["core"] = "vibe";
            if (!(config.startsWith("http"))) {
                write_file(this.path.join(this.coresPath, "vibe", "config.txt"), (config));
                this.settingsALL["vibe"]["config"] = this.path.join(this.coresPath, "vibe", "config.txt");
            }
            else {
                this.settingsALL["vibe"]["config"] = config;
            };
        }
        else if (this.supported["warp"].some(protocol => config.toString().startsWith(protocol))) {
            this.settingsALL["public"]["core"] = "warp";
            let optionsWarp = config.replace("warp://", "").split("&");
            optionsWarp.forEach(option => {
                this.settingsALL["warp"][option.split("=")[0]] = option.split("=")[1];
            });
            this.saveSettings();
            window.setSettings();
        }
        else if (this.supported["flex"].some(protocol => config.toString().startsWith(protocol))) {

        }
        else if (this.supported["grid"].some(protocol => config.toString().startsWith(protocol))) {

        }
        else if (this.supported["other"].some(protocol => config.toString().startsWith(protocol))) {
            let optionsFreedomGuard = config.replace("freedom-guard://", "").split("#")[0].split("&");
            optionsFreedomGuard.forEach(option => {
                this.settingsALL["public"][option.split("=")[0]] = option.split("=")[1];
            });
            this.saveSettings();
            window.setSettings();
        }
        else {
            this.LOGLOG("config -> not supported");
            alert("config -> not supported");
            return;
        };
        window.setHTML("#textOfCfon", config.includes("#") ? config.split("#").pop().trim() : config.substring(0, 50));
        this.saveSettings();
    };
    async deleteConfig(config) {
        this.settingsALL["public"]["importedServers"] = this.settingsALL["public"]["importedServers"].filter(item => item !== config);
        this.saveSettings();
        window.setHTML("#textOfCfon", "Auto Server");
    };
    async updateISPServers(isp = this.settingsALL["public"]["isp"]) {
        try {
            await this.ReloadSettings();
            let serverISP = this.settingsALL["public"]["configAuto"].toString();
            this.LOGLOG("serverISP URL: " + serverISP);
            let response = await this.axios.get(serverISP, { timeout: 10000 });
            let responseServerISP = [];
            await this.sleep(500);
            try {
                responseServerISP = response.data[isp];
            } catch (error) {
                this.LOGLOG("Error parsing JSON: " + error + response);
                alert("Invalid response format from server.");
                return false;
            }

            if (!responseServerISP || typeof responseServerISP !== "object") {
                alert("Invalid ISP data received.");
                this.LOGLOG("Invalid ISP data received.");
                return false;
            }
            this.LOGLOG("ISP SELECTED: " + isp);
            this.LOGLOG("isp servers updated: " + JSON.stringify(responseServerISP));
            this.settingsALL["public"]["ispServers"] = responseServerISP;
            this.saveSettings();
            return true;
        } catch (error) {
            this.LOGLOG("Network or server error:", error);
            alert("Cannot access the repository. Please check your connection. used backup");
            if (this.settingsALL["public"]["ispServers"] != []) {
                return true;
            }
            else {
                this.LOGLOG("backup is empty!");
                alert("backup is empty!");
            }
            this.saveSettings();
            return false;
        }
    };
    notConnected(core = "") {
        this.LOGLOG("not connected " + core);
        notify({
            title: 'Connection Failed',
            message: `Failed to connect to ${core}`,
            icon: this.path.join(this.mainDir, 'src/assets/icon/ico.png'),
            sound: true,
            wait: true,
            appID: 'Freedom Guard'
        });
        this.diconnectedUI();
        this.offProxy();
    };
    addExt(name) {
        return process.platform == "win32" ? name + ".exe" : name;
    };
    startINIT() {
        try {
            let test = read_file("one.one");
        }
        catch {
            write_file("one.one", "is not new user.");
            window.startNewUser();
        };
    };
}
class connectAuto extends publicSet {
    constructor() {
        super();
        this.processWarp = null;
        this.processVibe = null;
        this.processFlex = null;
        this.processGrid = null;
        this.processGridSetup = null;
        this.argsWarp = [];
        this.argsVibe = [];
        this.argsFlex = [];
        this.argsGrid = [];
        this.argsGridSetup = [];
        this.settings = {
            "flex": {},
            "grid": {},
            "vibe": {},
            "warp": {},
            "public": this.settingsALL["public"]
        };
    };
    async connect() {
        this.LOGLOG("I'm still alive ;)");
        this.ReloadSettings();
        if (!(await this.updateISPServers(this.settingsALL["public"]["isp"]))) {
            this.LOGLOG("not connected auto -> isp servers");
            this.notConnected("Auto");
            return;
        }
        this.LOGLOG("starting Auto...");
        try {
            this.LOGLOG("isp servers: " + this.settingsALL["public"]["ispServers"]);
            for (let server of this.settingsALL["public"]["ispServers"]) {
                let mode = server.split(",;,")[0];
                server = server.split(",;,")[1];
                if (this.connected) {
                    this.connectedVPN("auto");
                    return;
                }
                else {
                    this.LOGLOG("not connected -> next server...");
                };
                this.LOGLOG(mode + " -> " + server);
                if (mode == "warp") {
                    server.split("&").forEach(option => {
                        this.settings["warp"][option.split("=")[0]] = option.split("=")[1];
                    });
                    await this.connectWarp();
                }
                else if (mode == "vibe") {
                    this.settings["vibe"]["config"] = server;
                    await this.connectVibe();
                };
            };
            if (!this.connected) {
                this.LOGLOG("not connected auto -> isp servers");
                this.notConnected("auto");
                return;
            };
        }
        catch {
            this.LOGLOG("not connected auto -> isp servers");
            this.notConnected("auto");
            return;
        };

    }
    async connectWarp() {
        this.LOGLOG("starting warp on Auto...");
        this.ResetArgs("warp");
        await this.sleep(3000);
        this.LOGLOG(this.path.join(this.coresPath, "warp", this.addExt("warp-core")) + this.argsWarp);
        this.processWarp = spawn(this.path.join(this.coresPath, "warp", this.addExt("warp-core")), this.argsWarp);
        this.processWarp.stderr.on("data", (data) => {
            this.DataoutWarp(data instanceof Buffer ? data.toString() : data);
        });
        this.processWarp.stdout.on("data", (data) => {
            this.DataoutWarp(data instanceof Buffer ? data.toString() : data);
        });
        this.processWarp.on("close", () => {
            this.killVPN("warp");
            this.LOGLOG("warp Auto closed!");
            this.offProxy();
        });
        await this.sleep(this.settingsALL["warp"]["timeout"]);
        this.connected = !((await this.getIP_Ping())["filternet"]);
        this.connected = !((await this.getIP_Ping())["filternet"]);
        this.connected = !((await this.getIP_Ping())["filternet"]);
        if (!this.connected) {
            this.killVPN("warp");
            this.LOGLOG("warp Auto not connected!");
            this.offProxy();
        };
    };
    async connectVibe() {
        this.LOGLOG("starting vibe on Auto...");
        this.ResetArgs("vibe");
        this.processVibe = spawn(this.path.join(this.coresPath, "vibe", this.addExt("vibe-core")), this.argsVibe);
        this.processVibe.stderr.on("data", (data) => {
            this.DataoutVibe(data instanceof Buffer ? data.toString() : data);
        });
        this.processVibe.stdout.on("data", (data) => {
            this.DataoutVibe(data instanceof Buffer ? data.toString() : data);
        });
        this.processVibe.on("close", () => {
            this.killVPN("vibe");
            this.LOGLOG("vibe Auto closed!");
            this.offProxy();
        });
        await this.sleep(this.settingsALL["vibe"]["timeout"]);
        this.connected = !((await this.getIP_Ping())["filternet"]);
        this.connected = !((await this.getIP_Ping())["filternet"]);
        this.connected = !((await this.getIP_Ping())["filternet"]);
        if (!this.connected) {
            this.killVPN("vibe");
            this.LOGLOG("vibe Auto not connected!");
            this.offProxy();
        };
        await this.sleep(3000);
    };
    async ResetArgs(core) {
        if (core == "vibe") {
            this.argsVibe = [];
            this.argsVibe.push("run");
            this.argsVibe.push("--config");
            write_file(this.path.join(this.coresPath, "vibe", "config.txt"), (this.settings["vibe"]["config"]));
            this.settings["vibe"]["config"] = this.path.join(this.coresPath, "vibe", "config.txt");
            this.argsVibe.push(this.settings["vibe"]["config"]);
            if (this.settingsALL["public"]["type"] == "tun") {
                this.argsVibe.push("--tun");
            }
            else {
                this.argsVibe.push("--system-proxy");
            }
        }
        else if (core == "warp") {
            this.argsWarp = [];
            let settingWarp = this.settings["warp"];
            if (settingWarp["ipv"] != "IPV4" && settingWarp["ipv"]) {
                this.argsWarp.push("-" + settingWarp["ipv"] ? settingWarp["ipv"].split("")[-1] : "4")
            };
            if (settingWarp["gool"]) {
                this.argsWarp.push("--gool");
            };
            if (settingWarp["scan"]) {
                this.argsWarp.push("--scan");
                if (settingWarp["scanrtt"]) {
                    this.argsWarp.push("--rtt");
                    this.argsWarp.push(settingWarp["scanrtt"] ?? "1s");
                }
            };
            if (settingWarp["endpoint"] != "") {
                this.argsWarp.push("--endpoint");
                this.argsWarp.push(settingWarp["endpoint"]);
            };
            if (settingWarp["key"]) {
                this.argsWarp.push("--key");
                this.argsWarp.push(settingWarp["key"]);
            };
            if (settingWarp["dns"]) {
                this.argsWarp.push("--dns");
                this.argsWarp.push(settingWarp["dns"]);
            };
            if (settingWarp["cfon"]) {
                this.argsWarp.push("--cfon");
                this.argsWarp.push("--country");
                this.argsWarp.push(settingWarp["cfon"]);
            };
            if (this.settingsALL["public"]["type"] == "tun") {
                this.argsWarp.push("");
            };
            if (settingWarp["reserved"]) {
                this.argsWarp.push("--reserved");
                this.argsWarp.push("0,0,0");
            };
            if (settingWarp["verbose"]) {
                this.argsWarp.push("--verbose");
            };
            if (settingWarp["testUrl"]) {
                this.argsWarp.push("--test-url");
                this.argsWarp.push(this.settingsALL["public"]["testUrl"]);
            };
        }
    }
    connectFlex() {
    }
    connectGrid() {
    }
    setupGrid(proxy, type = 'system') {
        if (type == "tun") {
        }
        else if (type = 'system') {
            this.setProxy(proxy);
        };
    };
    killVPN(core) {
        this.LOGLOG("disconnecting... -> " + core);
        try {
            core == "warp" ? this.processWarp.kill() : '';
            core == "vibe" ? this.processVibe.kill() : '';
            core == "grid" ? this.processGrid.kill() : '';
            core == "flex" ? this.processFlex.kill() : '';
        }
        catch (error) {
            this.LOGLOG("error in killVPN: " + error);
        };
        this.status = false;
        this.connected = false;
        window.reloadPing();
    };
    connectFailed(from = "start") {
        // this.

    };
    DataoutVibe(data) {
        this.LOGLOG(data);
    };
    DataoutWarp(data = "") {
        this.LOGLOG(data);
        data = data.toString();
        if (data.includes("serving")) {
            this.ReloadSettings();
            this.connectedVPN("warp");
            this.connected = true;
            this.setupGrid(this.settingsALL["public"]["proxy"], this.settingsALL["public"]["type"], "socks5");
        }
    };
};
class connect extends publicSet {
    constructor() {
        super();
        this.processWarp = null;
        this.processVibe = null;
        this.processFlex = null;
        this.processGrid = null;
        this.processGridSetup = null;
        this.argsWarp = [];
        this.argsVibe = [];
        this.argsFlex = [];
        this.argsGrid = [];
        this.argsGridSetup = [];
        this.settings = this.settingsALL;
    }
    importAuto() {

    };
    connect() {
        this.ReloadSettings();
        this.LOGLOG("", 'clear');
        this.LOGLOG("starting connect... -> " + this.settingsALL["public"]["core"]);
        if (this.settingsALL["public"]["core"] == 'warp') {
            this.connectWarp();
        }
        else if (this.settingsALL["public"]["core"] == 'flex') {
            this.connectFlex();
        }
        else if (this.settingsALL["public"]["core"] == 'grid') {
            this.connectGrid();
        }
        else {
            this.connectVibe();
        };
    };
    async connectWarp() {
        this.ResetArgs('warp');
        await this.sleep(1000);
        this.LOGLOG(this.path.join(this.coresPath, "warp", this.addExt("warp-core")) + this.argsWarp);
        this.processWarp = spawn(this.path.join(this.coresPath, "warp", this.addExt("warp-core")), this.argsWarp);
        this.processWarp.stderr.on("data", (data) => {
            this.DataoutWarp(data instanceof Buffer ? data.toString() : data);
        });
        this.processWarp.stdout.on("data", (data) => {
            this.DataoutWarp(data instanceof Buffer ? data.toString() : data);
        });
        this.processWarp.on("close", () => {
            this.killVPN("warp");
            this.notConnected("warp");
            this.LOGLOG("warp closed!");
            this.offProxy();
        });
        await this.sleep(this.settingsALL["warp"]["timeout"]);
        if (!this.connected) {
            this.killVPN("warp");
            this.LOGLOG("warp not connected!");
            this.notConnected("warp");
            this.offProxy();
        };
    };
    async connectVibe() {
        this.ResetArgs("vibe");
        await this.sleep(1000);
        this.LOGLOG(this.path.join(this.coresPath, "vibe", this.addExt("vibe-core")) + " " + this.argsVibe);
        this.processVibe = spawn(this.path.join(this.coresPath, "vibe", this.addExt("vibe-core")), this.argsVibe);
        this.processVibe.stderr.on("data", (data) => {
            this.DataoutVibe(data instanceof Buffer ? data.toString() : data);
        });
        this.processVibe.stdout.on("data", (data) => {
            this.DataoutVibe(data instanceof Buffer ? data.toString() : data);
        });
        this.processVibe.on("close", () => {
            this.killVPN("vibe");
            this.notConnected("vibe");
            this.LOGLOG("vibe closed!");
            this.offProxy();
        });
        await this.sleep(this.settingsALL["vibe"]["timeout"]);
        if (!this.connected) {
            this.killVPN("vibe");
            this.LOGLOG("vibe not connected!");
            this.notConnected("vibe");
            this.offProxy();
        };
    };
    connectFlex() {
        return new Promise((resolve, reject) => {
        });
    }
    connectGrid() {
        return new Promise((resolve, reject) => {
        });
    }
    setupGrid(proxy, type = 'proxy', typeProxy) {
        if (type == "tun") {
        }
        else if (type = 'system') {
            this.setProxy(proxy);
        }
    };
    ResetArgs(core = "warp") {
        this.ReloadSettings();
        if (core == "warp") {
            this.argsWarp = [];
            let settingWarp = this.settingsALL["warp"];
            if (settingWarp["ipv"] != "IPV4") {
                this.argsWarp.push("-" + settingWarp["ipv"] ? settingWarp["ipv"].split("")[-1] : "4")
            };
            if (settingWarp["gool"]) {
                this.argsWarp.push("--gool");
            };
            if (settingWarp["scan"]) {
                this.argsWarp.push("--scan");
                if (settingWarp["scanrtt"]) {
                    this.argsWarp.push("--rtt");
                    this.argsWarp.push(settingWarp["scanrtt"] ?? "1s");
                }
            };
            if (settingWarp["endpoint"] != "") {
                this.argsWarp.push("--endpoint");
                this.argsWarp.push(settingWarp["endpoint"]);
            };
            if (settingWarp["key"]) {
                this.argsWarp.push("--key");
                this.argsWarp.push(settingWarp["key"]);
            };
            if (settingWarp["dns"]) {
                this.argsWarp.push("--dns");
                this.argsWarp.push(settingWarp["dns"]);
            };
            if (settingWarp["cfon"]) {
                this.argsWarp.push("--cfon");
                this.argsWarp.push("--country");
                this.argsWarp.push(settingWarp["cfon"]);
            };
            if (this.settingsALL["public"]["type"] == "tun") {
                this.argsWarp.push("");
            };
            if (settingWarp["reserved"]) {
                this.argsWarp.push("--reserved");
                this.argsWarp.push("0,0,0");
            };
            if (settingWarp["verbose"]) {
                this.argsWarp.push("--verbose");
            };
            if (settingWarp["testUrl"]) {
                this.argsWarp.push("--test-url");
                this.argsWarp.push(this.settingsALL["public"]["testUrl"]);
            };
        }
        else if (core == "vibe") {
            this.argsVibe = [];
            let settingVibe = this.settingsALL["vibe"];
            this.argsVibe.push("run")
            this.argsVibe.push("--config");
            this.argsVibe.push(settingVibe["config"]);
            if (this.settingsALL["public"]["type"] == "tun") {
                this.argsVibe.push("--tun");
            }
            else {
                this.argsVibe.push("--system-proxy");
            };
        }
    };
    saveSettings() {
        super.saveSettings(this.settings);
    };
    ReloadSettings() {
        try {
            this.settingsALL = JSON.parse(readFileSync('freedom-guard.json'));
        } catch (error) { this.saveSettings(); }
    };
    killVPN(core) {
        this.LOGLOG("disconnecting... -> " + core);
        try {
            core == "warp" ? this.processWarp.kill() : '';
            core == "vibe" ? this.processVibe.kill() : '';
            core == "grid" ? this.processGrid.kill() : '';
            core == "flex" ? this.processFlex.kill() : '';
        }
        catch (error) {
            this.LOGLOG("error in killVPN: " + error);
        };
        window.reloadPing();
    };
    DataoutWarp(data = "") {
        this.LOGLOG(data);
        data = data.toString();
        if (data.includes("serving")) {
            this.ReloadSettings();
            this.connectedVPN("warp");
            this.connected = true;
            this.setupGrid(this.settingsALL["public"]["proxy"], this.settingsALL["public"]["type"], "socks5");
        }
    };
    async DataoutVibe(data = "") {
        this.LOGLOG(data)
        data = data.toString();
        if (data.includes("CORE STARTED")) {
            this.ReloadSettings();
            this.connectedVPN("vibe");
            this.connected = true;
        }
    };
};
class test extends publicSet {
    constructor() {
        super();
        this.settings = {
            "flex": {},
            "grid": {},
            "vibe": {},
            "warp": {},
            "public": publicSet.settingsALL
        };
    }
    testWarp() {
    }
    testVibe() {
    }
    testFlex() {
    }
    testGrid() {
    }
    testAll() {
    };
};
class Tools {
    constructor() {
        this.exec = require("child_process").exec;
        this.Winreg = require("winreg");
    };
    LOGLOG(text = "", type = 'log') {
        if (type == "clear") {
            window.LogLOG("", "clear");
            console.clear();
        }
        else {
            window.LogLOG(text);
            console.log(text);
        }
    };
    setProxy(os, proxy) {
        if (os == "win32") {
            const setRegistryValue = (key, name, type, value) => {
                return new Promise((resolve, reject) => {
                    key.set(name, type, value, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            };
            const setProxy = async (proxy) => {
                const regKey = new this.Winreg({
                    hive: this.Winreg.HKCU,
                    key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'
                });

                try {
                    await setRegistryValue(regKey, 'ProxyEnable', this.Winreg.REG_DWORD, 1);
                    await setRegistryValue(regKey, 'ProxyServer', this.Winreg.REG_SZ, proxy);
                } catch (error) {
                    this.LOGLOG('Error setting proxy:', error);
                }
            };
            setProxy(proxy);
        } else {
            const exec = require('child_process').exec;

            const setGnomeProxy = (proxy) => {
                exec(`gsettings set org.gnome.system.proxy mode 'manual'`, (err) => {
                    if (err) this.LOGLOG('Error setting GNOME proxy mode:', err);
                });
                exec(`gsettings set org.gnome.system.proxy.http host '${proxy.split(':')[0]}'`, (err) => {
                    if (err) this.LOGLOG('Error setting GNOME proxy host:', err);
                });
                exec(`gsettings set org.gnome.system.proxy.http port ${proxy.split(':')[1]}`, (err) => {
                    if (err) this.LOGLOG('Error setting GNOME proxy port:', err);
                });
            };

            const setKdeProxy = (proxy) => {
                exec(`kwriteconfig5 --file kioslaverc --group 'Proxy Settings' --key 'ProxyType' 1`, (err) => {
                    if (err) this.LOGLOG('Error setting KDE proxy mode:', err);
                });
                exec(`kwriteconfig5 --file kioslaverc --group 'Proxy Settings' --key 'httpProxy' '${proxy}'`, (err) => {
                    if (err) this.LOGLOG('Error setting KDE proxy:', err);
                });
            };

            const setXfceProxy = (proxy) => {
                exec(`xfconf-query -c xfce4-session -p /general/ProxyMode -s manual`, (err) => {
                    if (err) this.LOGLOG('Error setting XFCE proxy mode:', err);
                });
                exec(`xfconf-query -c xfce4-session -p /general/ProxyHTTPHost -s '${proxy.split(':')[0]}'`, (err) => {
                    if (err) this.LOGLOG('Error setting XFCE proxy host:', err);
                });
                exec(`xfconf-query -c xfce4-session -p /general/ProxyHTTPPort -s ${proxy.split(':')[1]}`, (err) => {
                    if (err) this.LOGLOG('Error setting XFCE proxy port:', err);
                });
            };

            const setCinnamonProxy = (proxy) => {
                exec(`gsettings set org.cinnamon.settings-daemon.plugins.proxy mode 'manual'`, (err) => {
                    if (err) this.LOGLOG('Error setting Cinnamon proxy mode:', err);
                });
                exec(`gsettings set org.cinnamon.settings-daemon.plugins.proxy.http host '${proxy.split(':')[0]}'`, (err) => {
                    if (err) this.LOGLOG('Error setting Cinnamon proxy host:', err);
                });
                exec(`gsettings set org.cinnamon.settings-daemon.plugins.proxy.http port ${proxy.split(':')[1]}`, (err) => {
                    if (err) this.LOGLOG('Error setting Cinnamon proxy port:', err);
                });
            };

            const setMateProxy = (proxy) => {
                exec(`gsettings set org.mate.system.proxy mode 'manual'`, (err) => {
                    if (err) this.LOGLOG('Error setting MATE proxy mode:', err);
                });
                exec(`gsettings set org.mate.system.proxy.http host '${proxy.split(':')[0]}'`, (err) => {
                    if (err) this.LOGLOG('Error setting MATE proxy host:', err);
                });
                exec(`gsettings set org.mate.system.proxy.http port ${proxy.split(':')[1]}`, (err) => {
                    if (err) this.LOGLOG('Error setting MATE proxy port:', err);
                });
            };
            switch (os) {
                case "GNOME":
                    setGnomeProxy(proxy);
                    break;
                case "KDE":
                    setKdeProxy(proxy);
                    break;
                case "XFCE":
                    setXfceProxy(proxy);
                    break;
                case "CINNAMON":
                    setCinnamonProxy(proxy);
                    break;
                case "MATE":
                    setMateProxy(proxy);
                    break;
                default:
                    this.LOGLOG('Unsupported OS or desktop environment');
            }
        }
    };
    setDNS(dns1, dns2, os) {
        const exec = require('child_process').exec;
        const setWindowsDNS = (dns1, dns2) => {
            this.LOGLOG("setting dns for windows -> " + dns1 + " " + dns2);

            exec(`netsh interface show interface`, (err, stdout) => {
                if (err) {
                    this.LOGLOG('Error retrieving interfaces on Windows:', err);
                    return;
                }

                const interfaces = stdout
                    .split('\n')
                    .slice(3)
                    .map(line => line.trim().match(/(?:\S+\s+){3}(.+)/))
                    .filter(match => match)
                    .map(match => match[1]);

                interfaces.forEach(iface => {
                    if (!iface) return;

                    exec(`netsh interface ip set dns "${iface}" static ${dns1}`, (err) => {
                        if (err) this.LOGLOG(`Error setting primary DNS on ${iface}: ${err.message}`);
                        else this.LOGLOG(`Primary DNS set on ${iface}`);
                    });

                    if (dns2) {
                        exec(`netsh interface ip add dns "${iface}" ${dns2} index=2`, (err) => {
                            if (err) this.LOGLOG(`Error setting secondary DNS on ${iface}: ${err.message}`);
                            else this.LOGLOG(`Secondary DNS set on ${iface}`);
                        });
                    }
                });
            });
        };


        const setLinuxDNS = (dns1, dns2) => {
            exec(`nmcli device status | awk '{print $1}' | tail -n +2`, (err, stdout) => {
                if (err) {
                    this.LOGLOG('Error retrieving interfaces on Linux:', err);
                    return;
                }
                const interfaces = stdout.split('\n').filter(iface => iface.trim());
                interfaces.forEach(iface => {
                    exec(`nmcli con mod ${iface} ipv4.dns "${dns1} ${dns2 || ''}"`, (err) => {
                        if (err) this.LOGLOG(`Error setting DNS on ${iface}:`, err);
                    });
                    exec(`nmcli con up ${iface}`, (err) => {
                        if (err) this.LOGLOG(`Error applying DNS settings on ${iface}:`, err);
                    });
                });
            });
        };

        const setMacDNS = (dns1, dns2) => {
            exec(`networksetup -listallnetworkservices`, (err, stdout) => {
                if (err) {
                    this.LOGLOG('Error retrieving interfaces on macOS:', err);
                    return;
                }
                const interfaces = stdout.split('\n').slice(1);
                interfaces.forEach(iface => {
                    exec(`networksetup -setdnsservers "${iface}" ${dns1} ${dns2 || ''}`, (err) => {
                        if (err) this.LOGLOG(`Error setting DNS on ${iface}:`, err);
                    });
                });
            });
        };

        switch (os) {
            case "win32":
                setWindowsDNS(dns1, dns2);
                break;
            case "darwin":
                setMacDNS(dns1, dns2);
                break;
            default:
                setLinuxDNS(dns1, dns2);
                break;
        }
    }

    returnOS() {
        const platform = process.platform;
        if (platform == "win32") {
            return "win32";
        }
        else {
            const desktopEnv = process.env.XDG_CURRENT_DESKTOP || process.env.DESKTOP_SESSION || 'نامشخص';
            return desktopEnv;
        }
    }
}
module.exports = { connect, connectAuto, test, publicSet, Tools };