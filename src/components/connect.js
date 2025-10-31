const { spawn, exec, execFile, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { notify } = require('node-notifier');
const axios = require('axios');
const geoip = require('geoip-lite');
const { trackEvent } = require("@aptabase/electron/renderer");
const { Tools, getConfigPath, writeFile, readFile } = require("./tools");

class PublicSet {
    constructor() {
        this.connectedUI = false;
        this.axios = axios;
        this.geoip = geoip;
        this.path = path;
        this.setTimeout = setTimeout;
        this.status = false;
        this.connected = false;
        this.Process = {
            "vibe": null, "flex": null, "grid": null, "warp": null,
            "vibeAuto": null, "flexAuto": null, "gridAuto": null, "warpAuto": null,
            "setupAuto": null, "setup": null
        };
        this.mainDir = path.join(__dirname, "/../../");
        this.coresDir = path.join(__dirname, "/../../", "src", "main", "cores").replace("app.asar", "");
        this.coresPath = '';
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
                timeout: 60000,
                hiddifyConfigJSON: null
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
            "masque": {
                endpoint: undefined
            },
            "setupGrid": {},
            "public": {
                proxy: "127.0.0.1:8086",
                configAuto: "https://raw.githubusercontent.com/Freedom-Guard/Freedom-Guard/main/config/index.json",
                configAutoMode: "remote",
                configManual: "",
                core: "auto",
                dns: ["8.8.8.8"],
                protocol: "auto",
                testUrl: "https://1.1.1.1/cdn-cgi/trace",
                type: "system",
                isp: "other",
                importedServers: ["freedom-guard://core=auto#Auto Server***flag=ir"],
                ispServers: [],
                timeout: 60000,
                freedomLink: false,
                quickConnect: false,
                quickConnectC: "",
                lang: "en",
                auto_conn_after_runs: false
            },
            "lang": {}
        };
        this.supported = {
            vibe: ["ss", "http", "vless", "vmess", "trojan", "hysteria", "shadowtls", "tuic", "socks", "wireguard", "hy2"],
            warp: ["warp"],
            grid: ["grid"],
            flex: ["flex"],
            masque: ["masque"],
            other: ["freedom-guard://"]
        };
        this.Tools = new Tools();
        this.init();
    }

    async init() {
        this.prepareCores();
        await this.reloadSettings();
    }

    prepareCores() {
        const platformDir = process.platform === 'darwin'
            ? (process.arch === 'arm64' ? '/mac/arm64/' : '/mac/amd64/')
            : `/${process.platform}/`;

        let baseCorePath = path.join(
            __dirname.includes('app.asar') ? __dirname.replace('app.asar', '') : __dirname,
            '..', '..', 'src', 'main', 'cores', platformDir
        );

        if (process.platform === "linux" || process.platform === "darwin") {
            const destDir = getConfigPath();
            const cores = [
                { dir: "vibe", file: "vibe-core" },
                { dir: "warp", file: "warp-core" },
                { dir: "masque", file: "masque-plus" },
                { dir: "masque", file: "usque" }
            ];

            for (const core of cores) {
                const destPath = path.join(destDir, core.dir, core.file);
                const sourcePath = path.join(baseCorePath, core.dir, core.file);
                fs.mkdirSync(path.dirname(destPath), { recursive: true });
                if (!fs.existsSync(destPath)) {
                    fs.copyFileSync(sourcePath, destPath);
                    fs.chmodSync(destPath, 0o755);
                }
            }

            this.coresPath = destDir;
        } else {
            this.coresPath = baseCorePath;
        }

    }

    saveSettings(settingsSave = this.settingsALL) {
        writeFile('freedom-guard.json', JSON.stringify(settingsSave), "cache");
        this.settingsALL = settingsSave;
    }

    async reloadSettings() {
        try {
            this.settingsALL = JSON.parse(readFile('freedom-guard.json', "cache"));
        } catch (error) {
            this.saveSettings();
            this.log(`Settings file not found or corrupted, resetting to default: ${error}`);
        }
    }

    async getIP_Ping() {
        const responseFunc = { ip: "", ping: "", country: "unknown", filternet: true };
        try {
            const startTime = Date.now();
            const ipResponse = await this.axios.get("https://api.ipify.org?format=json", { timeout: 3000 });
            responseFunc.ip = ipResponse.data.ip;
            responseFunc.ping = Date.now() - startTime;
            responseFunc.country = this.geoip.lookup(ipResponse.data.ip)?.country || "unknown";

            try {
                await this.axios.get(this.settingsALL.public.testUrl, { timeout: 3000 });
                responseFunc.filternet = false;
                this.log("Filternet is not active.");
            } catch (err) {
                this.log("Filternet check failed, assuming active.");
            }
        } catch (error) {
            this.log(`Error retrieving IP and ping: ${error}`);
        }
        return responseFunc;
    }

    log(text = "", type = 'log') {
        if (typeof window !== 'undefined' && window.LogLOG) {
            if (type === "clear") {
                window.LogLOG("", "clear");
                console.clear();
            } else if (type === "showmess") {
                window.showMessageUI(text);
                window.LogLOG(text);
                console.log(text);
            } else {
                window.LogLOG(text);
                console.log(text);
            }
        } else {
            console.log(text);
        }
    }

    connectedVPN(core) {
        this.log(`Connected to ${core}.`);
        if (this.connectedUI) {
            return;
        }
        notify({
            title: 'Connected!',
            message: (this.settingsALL.lang.connected_mess_notif || "Connected to [core]").replace("[core]", core),
            image: path.join(this.mainDir, 'src/assets/icon/ico.png'),
            icon: path.join(this.mainDir, 'src/assets/icon/ico.png'),
            sound: true,
            wait: true,
            appID: 'Freedom Guard'
        });
        trackEvent("connected", {
            core: this.settingsALL.public.core,
            isp: this.settingsALL.public.isp
        });
        if (typeof window !== 'undefined' && window.connectedUI) {
            window.connectedUI();
        }
        this.connectedUI = true;
    };

    setProxy(proxy, type = "socks5") {
        this.log(`[Proxy] Setting proxy: Type: ${type}, Address: ${proxy}`);
        this.Tools.setProxy(this.Tools.returnOS(), proxy);
        this.log("[Proxy] Proxy set successfully.");
    };

    offProxy() {
        this.Tools.offProxy(this.Tools.returnOS());
    };

    sleep(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    };

    disconnectedUI() {
        if (typeof window !== 'undefined' && window.disconnectedUI) {
            window.disconnectedUI();
        }
    };

    async resetSettings() {
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
                timeout: 60000,
                hiddifyConfigJSON: null
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
            "masque": {
                endpoint: undefined
            },
            "setupGrid": {},
            "public": {
                proxy: "127.0.0.1:8086",
                configAuto: "https://raw.githubusercontent.com/Freedom-Guard/Freedom-Guard/main/config/index.json",
                configAutoMode: "remote",
                configManual: "",
                core: "auto",
                dns: ["8.8.8.8"],
                protocol: "auto",
                testUrl: "https://1.1.1.1/cdn-cgi/trace",
                type: "system",
                isp: "other",
                importedServers: ["freedom-guard://core=auto#Auto Server***flag=ir"],
                ispServers: [],
                timeout: 45000,
                freedomLink: false,
                quickConnect: false,
                quickConnectC: "",
                lang: "en",
                auto_conn_after_runs: false
            },
            "lang": {}
        };
        this.saveSettings();
        if (typeof window !== 'undefined' && window.showMessageUI) {
            window.showMessageUI("⚙️ Settings have been restored to default. Restarting the application... ✅", 5000);
        }
        await this.sleep(5000);
        if (typeof location !== 'undefined') {
            location.reload();
        }
    };

    isValidJSON(str) {
        try {
            const parsed = JSON.parse(str);
            return typeof parsed === "object" && parsed !== null;
        } catch (e) {
            return false;
        }
    };

    async importConfig(config) {
        try {
            config = String(config);
        } catch (e) {
            if (config === "") {
                if (typeof window !== 'undefined' && window.showMessageUI) {
                    window.showMessageUI(this.settingsALL.lang.config_empty);
                }
                return;
            }
        }

        this.log(config);
        let typeConfig = "warp";

        if (config === '') {
            this.settingsALL.public.configManual = config;
            this.saveSettings();
            if (typeof window !== 'undefined' && window.setHTML) {
                window.setHTML("#textOfServer", this.settingsALL.public.core + " Server + Customized");
            }
            return;
        }

        this.settingsALL.public.configManual = config;
        if (!this.settingsALL.public.importedServers.includes(config)) {
            this.settingsALL.public.importedServers.push(config);
        }

        if (this.isValidJSON(config)) {
            this.settingsALL.public.core = "vibe";
            typeConfig = "vibe";
            const vibeConfigPath = path.join(this.coresPath, "vibe", "config.json");
            writeFile(vibeConfigPath, JSON.stringify(JSON.parse(config)));
            this.settingsALL.vibe.config = `"${vibeConfigPath}"`;
        } else if (this.supported.vibe.some(protocol => config.startsWith(protocol))) {
            this.settingsALL.public.core = "vibe";
            typeConfig = "vibe";
            if (config.startsWith("http")) {
                this.settingsALL.vibe.config = config;
            } else {
                const vibeTxtConfigPath = path.join(this.coresPath, "vibe", "config.txt");
                writeFile(vibeTxtConfigPath, config);
                this.settingsALL.vibe.config = vibeTxtConfigPath;
            }
        } else if (this.supported.warp.some(protocol => config.startsWith(protocol))) {
            this.settingsALL.public.core = "warp";
            typeConfig = "warp";
            const optionsWarp = config.split("#")[0].replace("warp://", "").split("&");
            optionsWarp.forEach(option => {
                const [key, value] = option.split("=");
                if (key && value !== undefined) {
                    this.settingsALL.warp[key] = value;
                }
            });
            this.saveSettings();
            if (typeof window !== 'undefined' && window.setSettings) {
                window.setSettings();
            }
        } else if (this.supported.flex.some(protocol => config.startsWith(protocol))) {
        } else if (this.supported.grid.some(protocol => config.startsWith(protocol))) {
        } else if (this.supported.masque.some(protocol => config.startsWith(protocol))) {
            this.settingsALL.public.core = "masque";
            typeConfig = "masque";
            const optionsMasque = config.split("#")[0].replace("masque://", "").split("&");
            optionsMasque.forEach(option => {
                const [key, value] = option.split("=");
                if (key && value !== undefined) {
                    this.settingsALL.masque[key] = value;
                }
            });
            this.saveSettings();
            if (typeof window !== 'undefined' && window.setSettings) {
                window.setSettings();
            }
        } else if (this.supported.other.some(protocol => config.startsWith(protocol))) {
            const optionsFreedomGuard = config.replace("freedom-guard://", "").split("#")[0].split("&");
            typeConfig = "other";
            optionsFreedomGuard.forEach(option => {
                const [key, value] = option.split("=");
                if (key && value !== undefined) {
                    this.settingsALL.public[key] = value;
                }
            });
            this.saveSettings();
            if (typeof window !== 'undefined' && window.setSettings) {
                window.setSettings();
            }
        } else {
            this.log("Config not supported.");
            if (typeof window !== 'undefined' && window.showMessageUI) {
                window.showMessageUI(this.settingsALL.lang.config_not_supported);
            }
            return;
        }

        if (typeof window !== 'undefined' && window.setATTR && window.setHTML) {
            window.setATTR("#imgServerSelected", "src", `../svgs/${typeConfig === "warp" ? "warp.webp" : typeConfig === "vibe" ? "vibe.png" : "ir.svg"}`);
            window.setHTML("#textOfServer", config.includes("#") ? config.split("#").pop().trim().split("***")[0] : config.substring(0, 50));
        }
        this.saveSettings();
    }

    async deleteConfig(config) {
        this.settingsALL.public.importedServers = this.settingsALL.public.importedServers.filter(item => item !== config);
        this.saveSettings();
        if (typeof window !== 'undefined' && window.setHTML) {
            window.setHTML("#textOfServer", "Auto Server");
        }
    }

    async updateISPServers(isp = this.settingsALL.public.isp) {
        try {
            await this.reloadSettings();
            if (this.settingsALL.public.configAutoMode === "local") {
                this.settingsALL.public.ispServers = this.settingsALL.public.configAuto[isp];
                this.saveSettings();
                return true;
            }

            const serverISPUrl = this.settingsALL.public.configAuto;
            this.log(`Fetching ISP servers from URL: ${serverISPUrl}`);
            const response = await this.axios.get(serverISPUrl, { timeout: 10000 });

            let ispServers = [];
            let publicServers = [];
            try {
                ispServers = response.data[isp] || [];
                publicServers = response.data.PUBLIC || [];
            } catch (error) {
                this.log(`Error parsing ISP server JSON: ${error}`);
                if (typeof window !== 'undefined' && window.showMessageUI) {
                    window.showMessageUI("Invalid response format from server.");
                }
                return false;
            }

            this.log(`ISP selected: ${isp}`);
            this.settingsALL.public.ispServers = [...ispServers, ...publicServers];
            this.log(`ISP servers updated: ${this.settingsALL.public.ispServers.length} servers loaded`);

            if (this.settingsALL.public.ispServers.length === 0) {
                if (typeof window !== 'undefined' && window.showMessageUI) {
                    window.showMessageUI(this.settingsALL.lang.mess_not_found_isp_in_servers);
                }
                this.log(`ISP not found or no servers for: ${isp}`);
                return false;
            }
            this.saveSettings();

            this.log("ISP servers updated successfully");

            return true;
        } catch (error) {
            this.log(`Network or server error updating ISP servers: ${error.message}`);
            if (typeof window !== 'undefined' && window.showMessageUI) {
                window.showMessageUI(this.settingsALL.lang.message_repo_access_error);
            }
            if (this.settingsALL.public.ispServers && this.settingsALL.public.ispServers.length > 0) {
                this.log("Using existing ISP servers due to network error");
                return true;
            } else {
                this.log("Backup ISP servers are empty!");
                if (typeof window !== 'undefined' && window.showMessageUI) {
                    window.showMessageUI("Backup ISP servers are empty, cannot connect.");
                }
                return false;
            }
        }
    }

    notConnected(core = "") {
        this.log(`Failed to connect to ${core}.`);
        notify({
            title: this.connectedUI ? 'Freedom Guard Disconnected ❌' : 'Freedom Guard Connection Failed 🚫',
            message: this.connectedUI ? `Connection to ${core} was lost. Freedom Guard has been disconnected.` : `Unable to connect to ${core}. Freedom Guard is offline.`,
            image: path.join(this.mainDir, 'src/assets/icon/ico.png'),
            icon: path.join(this.mainDir, 'src/assets/icon/ico.png'),
            sound: true,
            wait: true,
            appID: 'Freedom Guard'
        });
        if (core === "Auto") {
            trackEvent("not_connected_auto", {
                isp: this.settingsALL.public.isp
            });
        } else {
            this.disconnectedUI();
        }
        this.offProxy();
        this.connectedUI = false;
    }

    addExt(name) {
        return process.platform === "win32" ? `${name}.exe` : name;
    }

    killAllCores(core, isCore = true) {
        const processName = core.toLowerCase() + (isCore ? "-core" : '');
        this.log(`Killing ${processName}...`);

        if (process.platform === "win32") {
            execFile("taskkill", ["/f", "/im", `${processName}.exe`], (error) => {
                if (error) {
                    this.log(`Error killing ${processName}.exe: ${error.message}`);
                } else {
                    this.log(`${processName}.exe killed successfully.`);
                }
            });
            exec("taskkill /F /IM reg.exe", { windowsHide: true }, (error) => {
                if (error) {
                    this.log(`Error killing reg.exe: ${error.message}`);
                } else {
                    this.log("All reg.exe processes closed.");
                }
            });
        } else if (process.platform === "linux" || process.platform === "darwin") {
            execFile("killall", [processName], (error) => {
                if (error) {
                    this.log(`Error killing ${processName}: ${error.message}`);
                } else {
                    this.log(`${processName} killed successfully.`);
                }
            });
        }
    }

    killGrid() {
        this.killAllCores("grid");
    }
    offGrid(type) {
        if (type == "tun") {
            try {
                this.Process.grid.kill();
            }
            catch { }
        }
        else {
            this.offProxy();
        }
    }
    dataOutGrid(data) {
        this.log(data);
        if (data.includes("CORE STARTED")) {
            window.showMessageUI("Grid mode is now enabled 🔐🟢🛰️");
        }
    }
    async setupGrid(proxy, type = 'proxy', typeTun = "tun", typeProxy = "socks5") {
        if (type === "tun") {
            const corePath = path.join(this.coresPath, "vibe", this.addExt("vibe-core"));
            const configGridPath = path.join(this.coresDir, "grid", "config.json");
            let configGrid = JSON.parse(readFile(configGridPath, "file"));
            this.log("grid started with:" + configGrid.toString());
            configGrid["outbounds"][2]["server_port"] = parseInt(proxy.split(":")[1]);
            writeFile(configGridPath, JSON.stringify(configGrid), "file");

            this.Process.grid = spawn(corePath, ["run", "-c", configGridPath, typeTun == "tun" ? "--tun" : "--system-proxy"]);
            this.Process.grid.on("close", (code) => {
                this.log(`GRID Tun exited with code ${code}.`);
                this.killVPN("grid");
                this.offProxy();
            });
            this.Process.grid.stderr.on("data", (data) => this.dataOutGrid("Grid output: " + data.toString()));
            this.Process.grid.stdout.on("data", (data) => this.dataOutGrid("Grid output: " + data.toString()));
            this.log("Grid started with config: " + JSON.stringify(configGrid, null, 2));
        } else if (type === 'system') {
            this.setProxy(proxy, typeProxy);
        }
    }
    killVPN(core) {
        try {
            this.Process[core].kill();
        }
        catch { }
    }
    resetVibeSettings() {
        return {
            "region": "other",
            "block-ads": false,
            "execute-config-as-is": false,
            "log-level": "warn",
            "resolve-destination": false,
            "ipv6-mode": "ipv4_only",
            "remote-dns-address": "udp://1.1.1.1",
            "remote-dns-domain-strategy": "",
            "direct-dns-address": "1.1.1.1",
            "direct-dns-domain-strategy": "",
            "mixed-port": 12334,
            "tproxy-port": 12335,
            "local-dns-port": 16450,
            "tun-implementation": "mixed",
            "mtu": 9000,
            "strict-route": true,
            "connection-test-url": "http://connectivitycheck.gstatic.com/generate_204",
            "url-test-interval": 600,
            "enable-clash-api": true,
            "clash-api-port": 16756,
            "enable-tun": false,
            "enable-tun-service": false,
            "set-system-proxy": true,
            "bypass-lan": false,
            "allow-connection-from-lan": false,
            "enable-fake-dns": false,
            "enable-dns-routing": true,
            "independent-dns-cache": true,
            "rules": [],
            "mux": {
                "enable": false,
                "padding": false,
                "max-streams": 8,
                "protocol": "h2mux"
            },
            "tls-tricks": {
                "enable-fragment": false,
                "fragment-size": "10-30",
                "fragment-sleep": "2-8",
                "mixed-sni-case": false,
                "enable-padding": false,
                "padding-size": "1-1500"
            },
            "warp": {
                "enable": false,
                "mode": "proxy_over_warp",
                "wireguard-config": "",
                "license-key": "",
                "account-id": "",
                "access-token": "",
                "clean-ip": "auto",
                "clean-port": 0,
                "noise": "1-3",
                "noise-size": "10-30",
                "noise-delay": "10-30",
                "noise-mode": "m6"
            },
            "warp2": {
                "enable": false,
                "mode": "proxy_over_warp",
                "wireguard-config": "",
                "license-key": "",
                "account-id": "",
                "access-token": "",
                "clean-ip": "auto",
                "clean-port": 0,
                "noise": "1-3",
                "noise-size": "10-30",
                "noise-delay": "10-30",
                "noise-mode": "m6"
            }
        };
    }
    startINIT() {
        this.reloadSettings();
        if ((this.settingsALL.public.newUser ?? true)) {
            window.startNewUser();
            this.settingsALL.public.newUser = false;
            this.saveSettings();
        }
    }
}

class ConnectAuto extends PublicSet {
    constructor() {
        super();
        this.processWarp = null;
        this.processVibe = null;
        this.processFlex = null;
        this.processGrid = null;
        this.processGridSetup = null;
        this.processMasque = null;
        this.argsWarp = [];
        this.argsVibe = [];
        this.argsFlex = [];
        this.argsGrid = [];
        this.argsGridSetup = [];
        this.argsMasque = [];
        this.settings = {
            "flex": {},
            "grid": {},
            "vibe": {},
            "warp": {},
            "masque": {},
            "public": { ...this.settingsALL.public }
        };
    }

    async connect() {
        this.log("Auto-connect sequence initiated.");
        await this.reloadSettings();
        this.settings.public = { ...this.settingsALL.public };

        if (!(await this.updateISPServers(this.settingsALL.public.isp))) {
            this.log("Auto-connect failed: Could not update ISP servers.");
            this.notConnected("Auto");
            return;
        }

        this.log("Starting Auto-connect process...");
        let quickConnectConfig = "";
        if (this.settingsALL.public.quickConnect && this.settingsALL.public.quickConnectC) {
            quickConnectConfig = this.settingsALL.public.quickConnectC;
        }

        if (quickConnectConfig && !this.settingsALL.public.ispServers.includes(quickConnectConfig)) {
            this.settingsALL.public.ispServers.unshift(quickConnectConfig);
        }

        this.log(`Available ISP servers for auto-connect: ${JSON.stringify(this.settingsALL.public.ispServers)}`);

        for (const server of this.settingsALL.public.ispServers) {
            if (this.connected) {
                this.connectedVPN("auto");
                this.settingsALL.public.quickConnectC = server;
                if (this.settingsALL.public.freedomLink) {
                    this.Tools.donateCONFIG(server);
                }
                this.saveSettings();
                return;
            }

            this.log("Attempting next server...");
            const [mode, configString] = server.split(",;,");
            if (!mode || !configString) {
                this.log(`Invalid server format: ${server}`);
                continue;
            }
            const cleanConfigString = configString.split("#")[0];

            this.log(`Trying mode: ${mode}, config: ${cleanConfigString}`);

            if (mode === "warp") {
                const options = cleanConfigString.replace("warp://", "").split("&");
                this.settings.warp = {};
                options.forEach(option => {
                    const [key, value] = option.split("=");
                    if (key && value !== undefined) {
                        this.settings.warp[key] = value;
                    }
                });
                try {
                    await this.connectWarp();
                }
                catch { }
            } else if (mode === "vibe") {
                this.settings.vibe.config = cleanConfigString;
                try {
                    await this.connectVibe();

                } catch { }
            }
            else if (mode === "masque") {
                const options = cleanConfigString.replace("masque://", "").split("&");
                this.settings.masque = {};
                options.forEach(option => {
                    const [key, value] = option.split("=");
                    if (key && value !== undefined) {
                        this.settings.masque[key] = value;
                    }
                });
                try {
                    await this.connectMasque();
                }
                catch { }
            }
        }

        if (!this.connected) {
            this.log("Auto-connect failed: All ISP servers attempted, no connection established.");
            this.notConnected("Auto");
        }
    }

    connectWarp() {
        return new Promise((resolve, reject) => {
            this.log("Starting warp for Auto-connect...");
            this.resetArgs("warp");

            setTimeout(async () => {
                try {
                    const corePath = path.join(this.coresPath, "warp", this.addExt("warp-core"));
                    this.log(`Spawning Warp process: ${corePath} ${this.argsWarp.join(' ')}`);

                    this.processWarp = spawn(corePath, this.argsWarp);
                    this.Process.warpAuto = this.processWarp;

                    this.processWarp.stderr.on("data", (data) => this.dataOutWarp(data.toString()));
                    this.processWarp.stdout.on("data", (data) => this.dataOutWarp(data.toString()));
                    this.processWarp.on("close", (code) => {
                        this.log(`Warp Auto process exited with code ${code}.`);
                        this.killVPN("warpAuto");
                        this.offProxy();
                        reject(false);
                    });

                    await this.sleep(this.settingsALL.warp.timeout);
                    for (let i = 0; i < 3 && !this.connected; i++) {
                        this.connected = !(await this.getIP_Ping()).filternet;
                        if (this.connected) break;
                        await this.sleep(1000);
                    }

                    if (this.connected) {
                        resolve(true);
                    } else {
                        this.log("Warp Auto-connect failed after multiple checks.");
                        this.killVPN("warpAuto");
                        this.offProxy();
                        reject(false);
                    }
                } catch (error) {
                    this.log(`Error in Warp Auto-connect: ${error.message}`);
                    this.killVPN("warpAuto");
                    this.offProxy();
                    reject(false);
                }
            }, 1000);
        });
    }

    connectMasque() {
        return new Promise((resolve, reject) => {
            this.log("Starting masque-plus for Auto-connect...");
            this.resetArgs("masque");

            setTimeout(async () => {
                try {
                    const corePath = path.join(this.coresPath, "masque", this.addExt("masque-plus"));
                    this.log(`Spawning Masque process: ${corePath} ${this.argsWarp.join(' ')}`);

                    this.processMasque = spawn(corePath, this.argsWarp);
                    this.Process.masqueAuto = this.processMasque;

                    this.processMasque.stderr.on("data", (data) => this.dataOutMasque(data.toString()));
                    this.processMasque.stdout.on("data", (data) => this.dataOutMasque(data.toString()));
                    this.processMasque.on("close", (code) => {
                        this.log(`Masque Auto process exited with code ${code}.`);
                        this.killVPN("masqueAuto");
                        this.offGrid();
                        reject(false);
                    });

                    await this.sleep(this.settingsALL.warp.timeout);
                    for (let i = 0; i < 3 && !this.connected; i++) {
                        this.connected = !(await this.getIP_Ping()).filternet;
                        if (this.connected) break;
                        await this.sleep(1000);
                    }

                    if (this.connected) {
                        resolve(true);
                    } else {
                        this.log("Masque Auto-connect failed after multiple checks.");
                        this.killVPN("masqueAuto");
                        this.offGrid();
                        reject(false);
                    }
                } catch (error) {
                    this.log(`Error in Masque Auto-connect: ${error.message}`);
                    this.killVPN("masqueAuto");
                    this.offGrid();
                    reject(false);
                }
            }, 1000);
        });
    }

    connectVibe() {
        return new Promise((resolve, reject) => {
            this.log("Starting vibe for Auto-connect...");
            this.resetArgs("vibe");

            setTimeout(async () => {
                try {
                    const corePath = path.join(this.coresPath, "vibe", this.addExt("vibe-core"));
                    const effectiveCorePath = process.platform === 'darwin' && process.arch === 'arm64'
                        ? corePath.replace('/amd64/', '/arm64/')
                        : corePath;

                    this.log(`Spawning Vibe process: ${effectiveCorePath} ${this.argsVibe.join(' ')}`);

                    this.processVibe = spawn(effectiveCorePath, this.argsVibe);
                    this.Process.vibeAuto = this.processVibe;

                    this.processVibe.stderr.on("data", (data) => this.dataOutVibe(data.toString()));
                    this.processVibe.stdout.on("data", (data) => this.dataOutVibe(data.toString()));
                    this.processVibe.on("close", (code) => {
                        this.log(`Vibe Auto process exited with code ${code}.`);
                        this.killVPN("vibeAuto");
                        this.offProxy();
                        reject(false);
                    });

                    await this.sleep(this.settingsALL.vibe.timeout);
                    for (let i = 0; i < 3 && !this.connected; i++) {
                        this.connected = !(await this.getIP_Ping()).filternet;
                        if (this.connected) break;
                        await this.sleep(1000);
                    }

                    if (this.connected) {
                        resolve(true);
                    } else {
                        this.log("Vibe Auto-connect failed after 60 seconds.");
                        this.killVPN("vibeAuto");
                        this.offProxy();
                        reject(false);
                    }
                } catch (error) {
                    this.log(`Error in Vibe Auto-connect: ${error.message}`);
                    this.killVPN("vibeAuto");
                    this.offProxy();
                    reject(false);
                }
            }, 1000);
        });
    }


    connectFlex() {
    }

    connectGrid() {
    }

    resetArgs(core) {
        if (core === "vibe") {
            this.argsVibe = ["run", "--config"];
            let vibeConfig = this.settings.vibe.config;
            if (!vibeConfig.startsWith("http")) {
                const vibeConfigPath = path.join(this.coresPath, "vibe", "config.txt");
                writeFile(vibeConfigPath, vibeConfig);
                vibeConfig = vibeConfigPath;
            }
            this.argsVibe.push(vibeConfig);


            if (!this.settingsALL.vibe.hiddifyConfigJSON || this.settingsALL.vibe.hiddifyConfigJSON == "null") {
                this.settingsALL.vibe.hiddifyConfigJSON = this.resetVibeSettings();
            }
            this.settingsALL.vibe.hiddifyConfigJSON["mixed-port"] = parseInt(this.settingsALL.public.proxy.split(":")[1]) ?? 8086;

            if (this.settingsALL.public.type === "tun") {
                this.settingsALL.vibe.hiddifyConfigJSON["enable-tun"] = true;
                this.argsVibe.push("--tun");
            } else if (this.settingsALL.public.type === "system") {
                try { this.settingsALL.vibe.hiddifyConfigJSON["enable-tun"] = false; } catch { };
                this.argsVibe.push("--system-proxy");
            }
            else {
                try { this.settingsALL.vibe.hiddifyConfigJSON["set-system-proxy"] = false; } catch { };
            }

            if (this.settingsALL.vibe.hiddifyConfigJSON && this.settingsALL.vibe.hiddifyConfigJSON != "null") {
                const hiddifyConfigPath = path.join(this.coresPath, "vibe", "hiddify.json");
                writeFile(hiddifyConfigPath, JSON.stringify(this.settingsALL.vibe.hiddifyConfigJSON));
                this.argsVibe.push("--hiddify", hiddifyConfigPath);
            }

        } else if (core === "warp") {
            this.argsWarp = [];
            const warpSettings = this.settings.warp;

            if (this.settingsALL.public.proxy !== "127.0.0.1:8086") {
                this.argsWarp.push("--bind", this.settingsALL.public.proxy);
            }
            if (warpSettings.ipv === "IPV6") {
                this.argsWarp.push("-6");
            }
            if (warpSettings.gool) {
                this.argsWarp.push("--gool");
            }
            if (warpSettings.scan) {
                this.argsWarp.push("--scan");
                if (warpSettings.scanrtt) {
                    this.argsWarp.push("--rtt", warpSettings.scanrtt || "1s");
                }
            }
            if (warpSettings.endpoint) {
                this.argsWarp.push("--endpoint", warpSettings.endpoint);
            }
            if (warpSettings.key) {
                this.argsWarp.push("--key", warpSettings.key);
            }
            if (warpSettings.dns) {
                this.argsWarp.push("--dns", warpSettings.dns);
            }
            if (warpSettings.cfon) {
                this.argsWarp.push("--cfon", "--country", warpSettings.cfon === true ? this.Tools.getRandomCountryCode() : warpSettings.cfon);
            }
            if (this.settingsALL.public.type === "tun") {
            }
            if (warpSettings.reserved) {
                this.argsWarp.push("--reserved", "0,0,0");
            }
            if (warpSettings.verbose) {
                this.argsWarp.push("--verbose");
            }
            if (warpSettings.testUrl) {
                this.argsWarp.push("--test-url", this.settingsALL.public.testUrl);
            }
        }
        else if (core === "masque") {
            this.argsMasque = [];
            if (!this.settings.masque) {
                this.settings.masque = {};
            }
            if (this.settings.masque.endpoint) {
                this.argsMasque.push("--endpoint");
                this.argsMasque.push(this.settings.masque.endpoint);
            }
            else {
                this.argsMasque.push("--scan");
            }
            this.argsMasque.push("--bind");
            this.argsMasque.push(this.settingsALL.public.proxy);
            this.argsMasque.push("--renew");
        }
    }

    killVPN(core) {
        this.log(`Disconnecting from: ${core}...`);
        try {
            if (core === "warpAuto" && this.processWarp) {
                this.processWarp.kill();
                this.processWarp = null;
            } else if (core === "vibeAuto" && this.processVibe) {
                this.processVibe.kill();
                this.processVibe = null;
            } else if (core === "gridAuto" && this.processGrid) {
                this.processGrid.kill();
                this.processGrid = null;
            } else if (core === "flexAuto" && this.processFlex) {
                this.processFlex.kill();
                this.processFlex = null;
            }
            else if (core === "masqueAuto" && this.processMasque) {
                this.processMasque.kill();
                this.processMasque = null;
            }
            else if (core === "auto") {
                try {
                    this.processVibe.kill();
                } catch { };
                try {
                    this.processWarp.kill();
                } catch { };
            }
        } catch (error) {
            this.log(`Error in killVPN for ${core}: ${error}`);
        }
        this.status = false;
        this.connected = false;
        if (typeof window !== 'undefined' && window.reloadPing) {
            window.reloadPing();
        }
    }

    dataOutVibe(data) {
        this.log(`Vibe Output: ${data}`);
        if (data.includes("CORE STARTED")) {
            this.reloadSettings();
            this.connectedVPN("auto");
            this.connected = true;
        }
    }

    dataOutWarp(data) {
        this.log(`Warp Output: ${data}`);
        if (data.includes("serving")) {
            this.reloadSettings();
            this.connectedVPN("auto");
            this.connected = true;
            this.setupGrid(this.settingsALL.public.proxy, this.settingsALL.public.type, "socks5");
        }
    }

    dataOutMasque(data) {
        this.log(`Masque Output: ${data}`);
        if (data.includes("serving")) {
            this.reloadSettings();
            this.connectedVPN("auto");
            this.connected = true;
            this.setupGrid(this.settingsALL.public.proxy, "tun", this.settingsALL.public.type, "socks5");
        }
    }
}

class Connect extends PublicSet {
    constructor() {
        super();
        this.processWarp = null;
        this.processMasque = null;
        this.processVibe = null;
        this.processFlex = null;
        this.processGrid = null;
        this.processGridSetup = null;
        this.argsWarp = [];
        this.argsMasque = [];
        this.argsVibe = [];
        this.argsFlex = [];
        this.argsGrid = [];
        this.argsGridSetup = [];
    }

    importAuto() {
    }

    async connect() {
        await this.reloadSettings();
        this.log("", 'clear');
        this.log(`Starting manual connection for: ${this.settingsALL.public.core}`);

        switch (this.settingsALL.public.core) {
            case 'warp':
                await this.connectWarp();
                break;
            case 'flex':
                await this.connectFlex();
                break;
            case 'masque':
                await this.connectMasque();
                break;
            case 'vibe':
            default:
                await this.connectVibe();
                break;
        }
    }

    async connectWarp() {
        await this.resetArgs('warp');
        await this.sleep(1000);

        const corePath = path.join(this.coresPath, "warp", this.addExt("warp-core"));
        this.log(`Spawning Warp process: ${corePath} ${this.argsWarp.join(' ')}`);

        this.processWarp = spawn(corePath, this.argsWarp);
        this.Process.warp = this.processWarp;

        this.processWarp.stderr.on("data", (data) => this.dataOutWarp(data.toString()));
        this.processWarp.stdout.on("data", (data) => this.dataOutWarp(data.toString()));
        this.processWarp.on("close", (code) => {
            this.log(`Warp process exited with code ${code}.`);
            this.killVPN("warp");
            this.notConnected("warp");
            this.offProxy();
        });

        await this.sleep(this.settingsALL.warp.timeout);
        if (!this.connected) {
            this.log("Warp manual connection failed after timeout.");
            this.killVPN("warp");
            this.notConnected("warp");
            this.offProxy();
        }
    }
    connectMasque() {
        return new Promise(async (resolve, reject) => {
            try {
                this.log("Starting masque for Manual-connect...");
                this.resetArgs("masque");

                const corePath = path.join(this.coresPath, "masque", this.addExt("masque-plus"));
                this.log(`Spawning Masque process: ${corePath} ${this.argsMasque.join(" ")}`);

                this.processMasque = spawn(corePath, this.argsMasque, {
                    cwd: path.dirname(corePath)
                });
                this.Process.masque = this.processMasque;

                this.processMasque.stderr.on("data", d => this.dataOutMasque(d.toString()));
                this.processMasque.stdout.on("data", d => this.dataOutMasque(d.toString()));
                this.processMasque.on("close", code => {
                    this.log(`Masque Manual process exited with code ${code}.`);
                    this.killVPN("masque");
                    this.notConnected("masque");
                    this.offGrid();
                    reject(false);
                });

                await this.sleep(this.settingsALL.warp.timeout);
                if (this.connected) {
                    this.connectedVPN("masque");
                    resolve(true);
                } else {
                    this.log("Masque manual connection failed after timeout.");
                    this.killVPN("masque");
                    this.notConnected("masque");
                    this.offGrid();
                    reject(false);
                }
            } catch (error) {
                this.log(`Error in Masque Manual-connect: ${error.message}`);
                this.killVPN("masque");
                this.notConnected("masque");
                this.offGrid();
                reject(false);
            }
        });
    };

    connectVibe() {
        return new Promise(async (resolve, reject) => {
            try {
                this.log("Starting vibe for connect...");
                this.resetArgs("vibe");
                this.settingsALL.public.quickConnectC = this.settingsALL.vibe.config;
                this.saveSettings();

                const corePath = path.join(this.coresPath, "vibe", this.addExt("vibe-core"));
                const effectiveCorePath = process.platform === "darwin" && process.arch === "arm64"
                    ? corePath.replace("/amd64/", "/arm64/")
                    : corePath;

                this.log(`Spawning Vibe process: ${effectiveCorePath} ${this.argsVibe.join(" ")}`);

                this.processVibe = spawn(effectiveCorePath, this.argsVibe);
                this.Process.vibe = this.processVibe;

                this.processVibe.stderr.on("data", d => this.dataOutVibe(d.toString()));
                this.processVibe.stdout.on("data", d => this.dataOutVibe(d.toString()));
                this.processVibe.on("close", code => {
                    this.log(`Vibe Core process exited with code ${code}.`);
                    this.killVPN("vibe");
                    this.notConnected("vibe");
                    this.offProxy();
                    reject(false);
                });

                await this.sleep(this.settingsALL.vibe.timeout);

                if (this.connected) {
                    this.connectedVPN("vibe");
                    resolve(true);
                } else {
                    this.log("Vibe manual connection failed after timeout.");
                    this.killVPN("vibe");
                    this.notConnected("vibe");
                    this.offProxy();
                    reject(false);
                }
            } catch (error) {
                this.log(`Error in Vibe manual connection: ${error.message}`);
                this.killVPN("vibe");
                this.notConnected("vibe");
                this.offProxy();
                reject(false);
            }
        });
    };

    async connectFlex() {
        return new Promise((resolve, reject) => {
            this.log("Flex connection initiated (not yet implemented).");
            reject(new Error("Flex connection not implemented."));
        });
    }

    async connectGrid() {
        return new Promise((resolve, reject) => {
            this.log("Grid connection initiated (not yet implemented).");
            reject(new Error("Grid connection not implemented."));
        });
    }

    async resetArgs(core = "warp") {
        await this.reloadSettings();
        if (core === "warp") {
            this.argsWarp = [];
            const warpSettings = this.settingsALL.warp;

            if (this.settingsALL.public.proxy !== "127.0.0.1:8086") {
                this.argsWarp.push("--bind", this.settingsALL.public.proxy);
            }
            if (warpSettings.ipv === "IPV6") {
                this.argsWarp.push("-6");
            }
            if (warpSettings.gool) {
                this.argsWarp.push("--gool");
            }
            if (warpSettings.scan) {
                this.argsWarp.push("--scan");
                if (warpSettings.scanrtt) {
                    this.argsWarp.push("--rtt", warpSettings.scanrtt || "1s");
                }
            }
            if (warpSettings.endpoint) {
                this.argsWarp.push("--endpoint", warpSettings.endpoint);
            }
            if (warpSettings.key) {
                this.argsWarp.push("--key", warpSettings.key);
            }
            if (warpSettings.dns) {
                this.argsWarp.push("--dns", warpSettings.dns);
            }
            if (warpSettings.cfon) {
                this.argsWarp.push("--cfon", "--country", warpSettings.cfon === true ? this.Tools.getRandomCountryCode() : warpSettings.cfon);
            }
            if (this.settingsALL.public.type === "tun") {
            }
            if (warpSettings.reserved) {
                this.argsWarp.push("--reserved", "0,0,0");
            }
            if (warpSettings.verbose) {
                this.argsWarp.push("--verbose");
            }
            if (warpSettings.testUrl) {
                this.argsWarp.push("--test-url", this.settingsALL.public.testUrl);
            }
        }
        else if (core === "vibe") {
            this.argsVibe = ["run", "--config"];
            let vibeConfig = this.settingsALL.vibe.config;
            this.argsVibe.push(vibeConfig.replace(/^"|"$/g, '').replace(/^'|'$/g, ''));

            if (!this.settingsALL.vibe.hiddifyConfigJSON || this.settingsALL.vibe.hiddifyConfigJSON == "null") {
                this.settingsALL.vibe.hiddifyConfigJSON = this.resetVibeSettings();
            }
            this.settingsALL.vibe.hiddifyConfigJSON["mixed-port"] = parseInt(this.settingsALL.public.proxy.split(":")[1]) ?? 8086;

            if (this.settingsALL.public.type === "tun") {
                this.settingsALL.vibe.hiddifyConfigJSON["enable-tun"] = true;
                this.argsVibe.push("--tun");
            } else if (this.settingsALL.public.type === "system") {
                try { this.settingsALL.vibe.hiddifyConfigJSON["enable-tun"] = false; } catch { };
                this.argsVibe.push("--system-proxy");
            }
            else {
                try { this.settingsALL.vibe.hiddifyConfigJSON["set-system-proxy"] = false; } catch { };
            }

            if (this.settingsALL.vibe.hiddifyConfigJSON && this.settingsALL.vibe.hiddifyConfigJSON != "null") {
                const hiddifyConfigPath = path.join(this.coresPath, "vibe", "hiddify.json");
                writeFile(hiddifyConfigPath, JSON.stringify(this.settingsALL.vibe.hiddifyConfigJSON));
                this.argsVibe.push("--hiddify", hiddifyConfigPath);
            }
        }
        else if (core === "masque") {
            this.argsMasque = [];
            if (!this.settingsALL.masque) {
                this.settingsALL.masque = {};
            }
            if (this.settingsALL.masque.endpoint) {
                this.argsMasque.push("--endpoint");
                this.argsMasque.push(this.settingsALL.masque.endpoint);
            }
            else {
                this.argsMasque.push("--scan");
            }
            this.argsMasque.push("--bind");
            this.argsMasque.push(this.settingsALL.public.proxy);
            this.argsMasque.push("--renew");
        }
    }

    saveSettings() {
        super.saveSettings(this.settingsALL);
    }

    reloadSettings() {
        super.reloadSettings();
    }

    killVPN(core) {
        this.log(`[Connection] Disconnecting from: ${core}...`);
        try {
            if (core === "warp" && this.processWarp) {
                this.processWarp.kill();
                this.processWarp = null;
            } else if (core === "vibe" && this.processVibe) {
                this.processVibe.kill();
                this.processVibe = null;
            } else if (core === "grid" && this.processGrid) {
                this.processGrid.kill();
                this.processGrid = null;
            } else if (core === "flex" && this.processFlex) {
                this.processFlex.kill();
                this.processFlex = null;
            } else if (core === "masque" && this.processMasque) {
                this.processMasque.kill();
                this.processMasque = null;
                this.killAllCores("usque", false)
            }
        } catch (error) {
            this.log(`[VPN] Error in killVPN: ${error}`);
        }
        if (typeof window !== 'undefined' && window.reloadPing) {
            window.reloadPing();
        }
    }

    dataOutWarp(data) {
        this.log(`Warp Output: ${data}`);
        if (data.includes("serving")) {
            this.reloadSettings();
            if (this.settingsALL.public.freedomLink) {
                this.Tools.donateCONFIG(JSON.stringify(this.settingsALL.warp));
            }
            this.connectedVPN("warp");
            this.connected = true;
            this.setupGrid(this.settingsALL.public.proxy, this.settingsALL.public.type, "socks5");
        }
    }

    dataOutMasque(data) {
        this.log(`Masque Output: ${data}`);
        if (data.includes("serving")) {
            this.reloadSettings();
            this.connectedVPN("masque");
            this.connected = true;
            this.setupGrid(this.settingsALL.public.proxy, "tun", this.settingsALL.public.type, "socks5");
        }
    }

    async dataOutVibe(data) {
        this.log(`Vibe Output: ${data}`);
        if (data.includes("CORE STARTED")) {
            await this.reloadSettings();
            if (this.settingsALL.public.freedomLink) {
                this.Tools.donateCONFIG(this.settingsALL.vibe.config);
            }
            this.connected = true;
        }
    }
}

class Test extends PublicSet {
    constructor() {
        super();
        this.settings = {
            "flex": {},
            "grid": {},
            "vibe": {},
            "warp": {},
            "public": { ...this.settingsALL.public }
        };
    }
    testWarp() {
        this.log("Testing Warp (not implemented).");
    }
    testVibe() {
        this.log("Testing Vibe (not implemented).");
    }
    testFlex() {
        this.log("Testing Flex (not implemented).");
    }
    testGrid() {
        this.log("Testing Grid (not implemented).");
    }
    testAll() {
        this.log("Testing all configurations (not implemented).");
    }
}


module.exports = { Connect, ConnectAuto, Test, PublicSet, Tools };