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
                configAuto: "https://raw.githubusercontent.com/Freedom-Guard/Freedom-Guard/main/config/default.json",
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
        }
    };
    saveSettings(settingsSave = this.settingsALL) {
        write_file('freedom-guard.json', JSON.stringify(settingsSave));
        this.settingsALL = settingsSave;
    };
    async ReloadSettings() {
        try {
            this.settingsALL = JSON.parse(read_file('freedom-guard.json'));
        } catch (error) { this.saveSettings(); }
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
            console.error("خطا در دریافت IP:", error);
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
        if (process.platform == "win32") {
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
                    console.error('Error setting proxy:', error);
                }
            };
            setProxy(proxy);
        }
        else if (process.platform == "linux") {
            alert(`Proxy ${type} with ${this.settingsALL["public"]["core"]}: ${this.settingsALL["public"]["proxy"]} ==== Please set this proxy on your system.`);
        };
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
                console.error('Error off proxy:', error);
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
                configAuto: "https://raw.githubusercontent.com/Freedom-Guard/Freedom-Guard/main/config/default.json",
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
    }
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
    connect() {
        this.LOGLOG("starting Auto...");
    }
    connectWarp() {

    }
    connectVibe() {
    }
    connectFlex() {
    }
    connectGrid() {
    }
    setupGrid(proxy, type = 'proxy') {
    };
    killVPN() {

    }
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
    addExt(name) {
        return process.platform == "win32" ? name + ".exe" : name;
    }
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
        });
        await this.sleep(this.settingsALL["warp"]["timeout"]);
        if (!this.connected) {
            this.killVPN("warp");
            this.LOGLOG("warp not connected!");
            this.notConnected("warp");
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
    }
    notConnected(core) {
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
module.exports = { connect, connectAuto, test, publicSet };