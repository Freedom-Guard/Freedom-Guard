const { spawn, exec, execFile, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { notify } = require('node-notifier');
const axios = require('axios');
const geoip = require('geoip-lite');
const { trackEvent } = require("@aptabase/electron/renderer");

trackEvent("app_started");

function getConfigPath() {
    let baseDir;
    if (process.platform === "win32") {
        baseDir = path.join(process.env.APPDATA, "Freedom Guard");
    } else if (process.platform === "darwin") {
        baseDir = path.join(os.homedir(), "Library", "Application Support", "Freedom Guard");
    } else {
        baseDir = path.join(os.homedir(), ".config", "Freedom Guard");
    }

    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
    }
    return baseDir;
}

const readFile = (filePath, type = "file") => {
    const fullPath = type === "file" ? filePath : path.join(getConfigPath(), filePath);
    return fs.readFileSync(fullPath, 'utf8');
};

const writeFile = (filePath, output, type = 'file') => {
    const fullPath = type === "file" ? filePath : path.join(getConfigPath(), filePath);
    fs.writeFileSync(fullPath, output);
};

class PublicSet {
    constructor() {
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
                importedServers: ["freedom-guard://core=auto#Auto Server"],
                ispServers: [],
                timeout: 60000,
                freedomLink: false,
                quickConnect: false,
                quickConnectC: "",
                lang: "en",
            },
            "lang": {}
        };
        this.supported = {
            vibe: ["ss", "http", "vless", "vmess", "trojan", "hysteria", "shadowtls", "tuic", "socks", "wireguard", "hy2"],
            warp: ["warp"],
            grid: ["grid"],
            flex: ["flex"],
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
            const vibeDestPath = path.join(destDir, "vibe", 'vibe-core');
            const warpDestPath = path.join(destDir, "warp", 'warp-core');

            fs.mkdirSync(path.dirname(vibeDestPath), { recursive: true });
            fs.mkdirSync(path.dirname(warpDestPath), { recursive: true });

            const vibeSourcePath = path.join(baseCorePath, "vibe", "vibe-core");
            const warpSourcePath = path.join(baseCorePath, "warp", "warp-core");

            if (!fs.existsSync(vibeDestPath)) {
                fs.copyFileSync(vibeSourcePath, vibeDestPath);
                fs.chmodSync(vibeDestPath, 0o755);
            }
            if (!fs.existsSync(warpDestPath)) {
                fs.copyFileSync(warpSourcePath, warpDestPath);
                fs.chmodSync(warpDestPath, 0o755);
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
        notify({
            title: 'Connected!',
            message: (this.settingsALL.lang.connected_mess_notif || "Connected to [core]").replace("[core]", core),
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
    }

    setProxy(proxy, type = "socks5") {
        this.log(`[Proxy] Setting proxy: Type: ${type}, Address: ${proxy}`);
        this.Tools.setProxy(this.Tools.returnOS(), proxy);
        this.log("[Proxy] Proxy set successfully.");
    }

    offProxy() {
        this.Tools.offProxy(this.Tools.returnOS());
    }

    sleep(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    disconnectedUI() {
        if (typeof window !== 'undefined' && window.disconnectedUI) {
            window.disconnectedUI();
        }
    }

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
                importedServers: ["freedom-guard://core=auto#Auto Server"],
                ispServers: [],
                timeout: 45000,
                freedomLink: false,
                quickConnect: false,
                quickConnectC: "",
                lang: "en",
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
    }

    isValidJSON(str) {
        try {
            const parsed = JSON.parse(str);
            return typeof parsed === "object" && parsed !== null;
        } catch (e) {
            return false;
        }
    }

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
            window.setHTML("#textOfServer", config.includes("#") ? config.split("#").pop().trim() : config.substring(0, 50));
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
            this.log(`ISP servers updated: ${JSON.stringify(this.settingsALL.public.ispServers)}`);

            if (this.settingsALL.public.ispServers.length === 0) {
                if (typeof window !== 'undefined' && window.showMessageUI) {
                    window.showMessageUI(this.settingsALL.lang.mess_not_found_isp_in_servers);
                }
                this.log(`ISP not found or no servers for: ${isp}`);
                return false;
            }
            this.saveSettings();
            return true;
        } catch (error) {
            this.log(`Network or server error updating ISP servers: ${error}`);
            if (typeof window !== 'undefined' && window.showMessageUI) {
                window.showMessageUI(this.settingsALL.lang.message_repo_access_error);
            }
            if (this.settingsALL.public.ispServers && this.settingsALL.public.ispServers.length > 0) {
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
            title: 'Connection Failed',
            message: `Failed to connect to ${core}`,
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
    }

    addExt(name) {
        return process.platform === "win32" ? `${name}.exe` : name;
    }

    killAllCores(core) {
        const processName = `${core.toLowerCase()}-core`;
        this.log(`Killing ${processName}...`);

        if (process.platform === "win32") {
            execFile("taskkill", ["/f", "/im", `${processName}.exe`], (error) => {
                if (error) {
                    this.log(`Error killing ${processName}.exe: ${error.message}`);
                } else {
                    this.log(`${processName}.exe killed successfully.`);
                }
            });
            exec("taskkill /F /IM reg.exe", (error) => {
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

    setupGrid(proxy, type = 'proxy', typeProxy = "socks5") {
        if (type === "tun") {
        } else if (type === 'system') {
            this.setProxy(proxy, typeProxy);
        }
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
        const flagFilePath = path.join(getConfigPath(), "one.one");
        try {
            readFile("one.one", "cache");
        } catch {
            writeFile("one.one", "is not new user.", "cache");
            if (typeof window !== 'undefined' && window.startNewUser) {
                window.startNewUser();
            }
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
                await this.connectWarp();
            } else if (mode === "vibe") {
                this.settings.vibe.config = cleanConfigString;
                await this.connectVibe();
            }
        }

        if (!this.connected) {
            this.log("Auto-connect failed: All ISP servers attempted, no connection established.");
            this.notConnected("Auto");
        }
    }

    async connectWarp() {
        this.log("Starting warp for Auto-connect...");
        this.resetArgs("warp");
        await this.sleep(1000);

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
        });

        await this.sleep(this.settingsALL.warp.timeout);
        for (let i = 0; i < 3 && !this.connected; i++) {
            this.connected = !(await this.getIP_Ping()).filternet;
            if (this.connected) break;
            await this.sleep(1000);
        }

        if (!this.connected) {
            this.log("Warp Auto-connect failed after multiple checks.");
            this.killVPN("warpAuto");
            this.offProxy();
        }
    }

    async connectVibe() {
        this.log("Starting vibe for Auto-connect...");
        this.resetArgs("vibe");
        await this.sleep(1000);

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
        });

        await this.sleep(this.settingsALL.vibe.timeout);
        for (let i = 0; i < 3 && !this.connected; i++) {
            this.connected = !(await this.getIP_Ping()).filternet;
            if (this.connected) break;
            await this.sleep(1000);
        }

        if (!this.connected) {
            this.log("Vibe Auto-connect failed after multiple checks.");
            this.killVPN("vibeAuto");
            this.offProxy();
        }
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

            if (this.settingsALL.public.type === "tun") {
                this.argsVibe.push("--tun");
            } else {
                this.argsVibe.push("--system-proxy");
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
                this.argsWarp.push("--cfon", "--country", warpSettings.cfon === "true" ? this.Tools.getRandomCountryCode() : warpSettings.cfon);
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
}

class Connect extends PublicSet {
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
            case 'grid':
                await this.connectGrid();
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

    async connectVibe() {
        await this.resetArgs("vibe");
        await this.sleep(1000);

        const corePath = path.join(this.coresPath, "vibe", this.addExt("vibe-core"));
        const effectiveCorePath = process.platform === 'darwin' && process.arch === 'arm64'
            ? corePath.replace('/amd64/', '/arm64/')
            : corePath;

        this.log(`Spawning Vibe process: ${effectiveCorePath} ${this.argsVibe.join(' ')}`);

        this.processVibe = spawn(effectiveCorePath, this.argsVibe);
        this.Process.vibe = this.processVibe;

        this.processVibe.stderr.on("data", (data) => this.dataOutVibe(data.toString()));
        this.processVibe.stdout.on("data", (data) => this.dataOutVibe(data.toString()));
        this.processVibe.on("close", (code) => {
            this.log(`Vibe process exited with code ${code}.`);
            this.killVPN("vibe");
            this.notConnected("vibe");
            this.offProxy();
        });

        await this.sleep(this.settingsALL.vibe.timeout);
        if (!this.connected) {
            this.log("Vibe manual connection failed after timeout.");
            this.killVPN("vibe");
            this.notConnected("vibe");
            this.offProxy();
        }
    }

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
                this.argsWarp.push("--cfon", "--country", warpSettings.cfon === "true" ? this.Tools.getRandomCountryCode() : warpSettings.cfon);
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
            if (!vibeConfig.startsWith("http") && !vibeConfig.startsWith('"') && !vibeConfig.startsWith("'")) {
                const vibeConfigPath = path.join(this.coresPath, "vibe", "config.txt");
                writeFile(vibeConfigPath, vibeConfig);
                vibeConfig = vibeConfigPath;
            }
            this.argsVibe.push(vibeConfig.replace(/^"|"$/g, '').replace(/^'|'$/g, ''));

            if (this.settingsALL.public.type === "tun") {
                this.argsVibe.push("--tun");
            } else {
                this.argsVibe.push("--system-proxy");
            }

            if (this.settingsALL.vibe.hiddifyConfigJSON && this.settingsALL.vibe.hiddifyConfigJSON != "null") {
                const hiddifyConfigPath = path.join(this.coresPath, "vibe", "hiddify.json");
                writeFile(hiddifyConfigPath, JSON.stringify(this.settingsALL.vibe.hiddifyConfigJSON));
                this.argsVibe.push("--hiddify", hiddifyConfigPath);
            }
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

    async dataOutVibe(data) {
        this.log(`Vibe Output: ${data}`);
        if (data.includes("CORE STARTED")) {
            await this.reloadSettings();
            if (this.settingsALL.public.freedomLink) {
                this.Tools.donateCONFIG(this.settingsALL.vibe.config);
            }
            this.connectedVPN("vibe");
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

class Tools {
    constructor() {
        this.exec = exec;
        this.execSync = execSync;
        this.https = require('https');

        this.coresPath = path.join(
            __dirname.includes('app.asar') ? __dirname.replace('app.asar', '') : __dirname,
            '..', '..', 'src', 'main', 'cores',
            process.platform === 'darwin'
                ? (process.arch === 'arm64' ? '/mac/arm64/' : '/mac/amd64/')
                : `/${process.platform}/`
        );
    }

    log(text = "", type = 'log') {
        if (typeof window !== 'undefined' && window.LogLOG) {
            if (type === "clear") {
                window.LogLOG("", "clear");
                console.clear();
            } else {
                window.LogLOG(text);
                console.log(text);
            }
        } else {
            console.log(text);
        }
    }

    setProxy(osType, proxy) {
        if (osType === "win32") {

            const applyWindowsProxy = () => {
                exec(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f`, (err) => {
                    if (err) {
                        console.log(`❌ Error setting ProxyEnable: ${err.message}`);
                        return;
                    }

                    exec(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d ${proxy} /f`, (err2) => {
                        if (err2) {
                            console.log(`❌ Error setting ProxyServer: ${err2.message}`);
                            return;
                        }

                        exec('RUNDLL32.EXE user32.dll,UpdatePerUserSystemParameters', (error) => {
                            if (error) {
                                console.log(`❌ Error applying proxy settings: ${error.message}`);
                            } else {
                                console.log('✅ Proxy settings applied successfully.');
                            }
                        });

                        exec("taskkill /F /IM reg.exe", (killError) => {
                            if (killError) {
                                console.log(`Error killing reg.exe: ${killError.message}`);
                            } else {
                                console.log("All reg.exe processes closed.");
                            }
                        });
                    });
                });
            };

            applyWindowsProxy();

        } else if (osType === "macOS") {
            const setMacProxy = (proxyAddr) => {
                exec(`osascript -e 'do shell script "networksetup -listallnetworkservices" with administrator privileges'`, (err, stdout) => {
                    if (err) {
                        this.log(`Error retrieving network services on macOS: ${err.message}`);
                        return;
                    }
                    const services = stdout.split('\n').slice(1).filter(service => service.trim() && !service.includes('*'));
                    services.forEach(service => {
                        exec(`osascript -e 'do shell script "networksetup -setsocksfirewallproxy \\"${service}\\" ${proxyAddr.split(':')[0]} ${proxyAddr.split(':')[1]}" with administrator privileges'`, (err) => {
                            if (err) this.log(`Error setting SOCKS5 proxy on ${service}: ${err.message}`);
                            else this.log(`[Proxy] SOCKS5 proxy set successfully on ${service}.`);
                        });
                        exec(`osascript -e 'do shell script "networksetup -setsocksfirewallproxystate \\"${service}\\" on" with administrator privileges'`, (err) => {
                            if (err) this.log(`Error enabling SOCKS5 proxy on ${service}: ${err.message}`);
                            else this.log(`[Proxy] SOCKS5 proxy enabled successfully on ${service}.`);
                        });
                    });
                });
            }
            setMacProxy(proxy);
        } else {
            const [host, port] = proxy.split(':');
            const commands = {
                "GNOME": [
                    `gsettings set org.gnome.system.proxy mode 'manual'`,
                    `gsettings set org.gnome.system.proxy.http host '${host}'`,
                    `gsettings set org.gnome.system.proxy.http port ${port}`,
                    `gsettings set org.gnome.system.proxy.https host '${host}'`,
                    `gsettings set org.gnome.system.proxy.https port ${port}`,
                    `gsettings set org.gnome.system.proxy.ftp host '${host}'`,
                    `gsettings set org.gnome.system.proxy.ftp port ${port}`,
                    `gsettings set org.gnome.system.proxy.socks host '${host}'`,
                    `gsettings set org.gnome.system.proxy.socks port ${port}`
                ],
                "KDE": [
                    `kwriteconfig5 --file kioslaverc --group 'Proxy Settings' --key 'ProxyType' 1`,
                    `kwriteconfig5 --file kioslaverc --group 'Proxy Settings' --key 'httpProxy' 'socks5://${proxy}'`,
                    `kwriteconfig5 --file kioslaverc --group 'Proxy Settings' --key 'httpsProxy' 'socks5://${proxy}'`,
                    `kwriteconfig5 --file kioslaverc --group 'Proxy Settings' --key 'ftpProxy' 'socks5://${proxy}'`,
                    `kwriteconfig5 --file kioslaverc --group 'Proxy Settings' --key 'socksProxy' 'socks5://${proxy}'`
                ],
                "XFCE": [
                    `xfconf-query -c xfce4-session -p /general/ProxyMode -s manual`,
                    `xfconf-query -c xfce4-session -p /general/ProxyHTTPHost -s '${host}'`,
                    `xfconf-query -c xfce4-session -p /general/ProxyHTTPPort -s ${port}`,
                    `xfconf-query -c xfce4-session -p /general/ProxyHTTPSHost -s '${host}'`,
                    `xfconf-query -c xfce4-session -p /general/ProxyHTTPSPort -s ${port}`,
                    `xfconf-query -c xfce4-session -p /general/ProxySocksHost -s '${host}'`,
                    `xfconf-query -c xfce4-session -p /general/ProxySocksPort -s ${port}`
                ],
                "CINNAMON": [
                    `gsettings set org.cinnamon.settings-daemon.plugins.proxy mode 'manual'`,
                    `gsettings set org.cinnamon.settings-daemon.plugins.proxy.http host '${host}'`,
                    `gsettings set org.cinnamon.settings-daemon.plugins.proxy.http port ${port}`,
                    `gsettings set org.cinnamon.settings-daemon.plugins.proxy.https host '${host}'`,
                    `gsettings set org.cinnamon.settings-daemon.plugins.proxy.https port ${port}`,
                    `gsettings set org.cinnamon.settings-daemon.plugins.proxy.socks host '${host}'`,
                    `gsettings set org.cinnamon.settings-daemon.plugins.proxy.socks port ${port}`
                ],
                "MATE": [
                    `gsettings set org.mate.system.proxy mode 'manual'`,
                    `gsettings set org.mate.system.proxy.http host '${host}'`,
                    `gsettings set org.mate.system.proxy.http port ${port}`,
                    `gsettings set org.mate.system.proxy.https host '${host}'`,
                    `gsettings set org.mate.system.proxy.https port ${port}`,
                    `gsettings set org.mate.system.proxy.socks host '${host}'`,
                    `gsettings set org.mate.system.proxy.socks port ${port}`
                ],
                "DEEPIN": [
                    `dconf write /system/proxy/mode "'manual'"`,
                    `dconf write /system/proxy/http/host "'${host}'"`,
                    `dconf write /system/proxy/http/port ${port}`,
                    `dconf write /system/proxy/https/host "'${host}'"`,
                    `dconf write /system/proxy/https/port ${port}`,
                    `dconf write /system/proxy/socks/host "'${host}'"`,
                    `dconf write /system/proxy/socks/port ${port}`
                ],
                "LXQT": [
                    `lxqt-config-session set /network/proxy mode manual`,
                    `lxqt-config-session set /network/proxy/http ${proxy}`,
                    `lxqt-config-session set /network/proxy/https ${proxy}`,
                    `lxqt-config-session set /network/proxy/socks ${proxy}`
                ],
                "BUDGIE": [
                    `gsettings set com.solus-project.budgie-panel proxy-mode 'manual'`,
                    `gsettings set com.solus-project.budgie-panel proxy-host '${host}'`,
                    `gsettings set com.solus-project.budgie-panel proxy-port ${port}`
                ],
                "OPENBOX": [`echo "export http_proxy='http://${proxy}'" >> ~/.xprofile`, `echo "export https_proxy='http://${proxy}'" >> ~/.xprofile`, `echo "export all_proxy='socks5://${proxy}'" >> ~/.xprofile`],
                "I3WM": [`echo "export http_proxy='http://${proxy}'" >> ~/.xprofile`, `echo "export https_proxy='http://${proxy}'" >> ~/.xprofile`, `echo "export all_proxy='socks5://${proxy}'" >> ~/.xprofile`]
            };

            const desktopCommands = commands[osType];
            if (desktopCommands) {
                desktopCommands.forEach(cmd => {
                    exec(cmd, (err) => {
                        if (err) {
                            this.log(`Error executing proxy command for ${osType}: ${cmd} - ${err.message}`);
                        } else {
                            this.log(`Proxy command executed for ${osType}: ${cmd}`);
                        }
                    });
                });
            } else {
                this.log(`Unsupported Linux desktop environment: ${osType}. Please set proxy manually.`);
                if (typeof window !== 'undefined' && window.showMessageUI) {
                    window.showMessageUI(`[Proxy] Unsupported Linux desktop environment (${osType}). You need to set the proxy manually. A SOCKS5 proxy has been created: ${proxy}`, 15000);
                }
            }
        }
    }

    offProxy(osType) {
        this.log("[Proxy] Disabling proxy...");

        if (osType === "win32") {
            const disableWindowsProxy = () => {
                exec('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f', (err) => {
                    if (err) {
                        console.log(`❌ Error disabling ProxyEnable: ${err.message}`);
                        return;
                    }

                    exec('reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /f', (err2) => {
                        if (err2) {
                            console.log(`❌ Error deleting ProxyServer: ${err2.message}`);
                            return;
                        }

                        exec('RUNDLL32.EXE user32.dll,UpdatePerUserSystemParameters', (error) => {
                            if (error) {
                                console.log(`❌ Error applying proxy settings (disable): ${error.message}`);
                            } else {
                                console.log('✅ Proxy settings disabled successfully.');
                            }
                        });
                    });
                });
            };

            disableWindowsProxy();
        } else if (osType === "macOS") {
            const disableMacProxy = () => {
                exec(`osascript -e 'do shell script "networksetup -listallnetworkservices" with administrator privileges'`, (err, stdout) => {
                    if (err) {
                        this.log(`Error retrieving network services on macOS (disable proxy): ${err.message}`);
                        return;
                    }
                    const services = stdout.split('\n').slice(1).filter(service => service.trim() && !service.includes('*'));
                    services.forEach(service => {
                        exec(`osascript -e 'do shell script "networksetup -setsocksfirewallproxystate \\"${service}\\" off" with administrator privileges'`, (err) => {
                            if (err) this.log(`Error disabling SOCKS5 proxy on ${service}: ${err.message}`);
                            else this.log(`[Proxy] SOCKS5 proxy disabled successfully on ${service}.`);
                        });
                        exec(`osascript -e 'do shell script "networksetup -setwebproxystate \\"${service}\\" off" with administrator privileges'`, (err) => {
                            if (err) this.log(`Error disabling HTTP proxy on ${service}: ${err.message}`);
                        });
                        exec(`osascript -e 'do shell script "networksetup -setsecurewebproxystate \\"${service}\\" off" with administrator privileges'`, (err) => {
                            if (err) this.log(`Error disabling HTTPS proxy on ${service}: ${err.message}`);
                        });
                    });
                });
            };
            disableMacProxy();
        } else {
            const disableCommands = {
                "GNOME": [`gsettings set org.gnome.system.proxy mode 'none'`],
                "KDE": [`kwriteconfig5 --file kioslaverc --group 'Proxy Settings' --key 'ProxyType' 0`],
                "XFCE": [`xfconf-query -c xfce4-session -p /general/ProxyMode -s none`],
                "CINNAMON": [`gsettings set org.cinnamon.settings-daemon.plugins.proxy mode 'none'`],
                "MATE": [`gsettings set org.mate.system.proxy mode 'none'`],
                "DEEPIN": [`dconf write /system/proxy/mode "'none'"`],
                "LXQT": [`lxqt-config-session set /network/proxy mode none`],
                "BUDGIE": [`gsettings set com.solus-project.budgie-panel proxy-mode 'none'`],
                "OPENBOX": [`sed -i '/http_proxy/d' ~/.xprofile`, `sed -i '/https_proxy/d' ~/.xprofile`, `sed -i '/all_proxy/d' ~/.xprofile`],
                "I3WM": [`sed -i '/http_proxy/d' ~/.xprofile`, `sed -i '/https_proxy/d' ~/.xprofile`, `sed -i '/all_proxy/d' ~/.xprofile`]
            };

            const desktopCommands = disableCommands[osType];
            if (desktopCommands) {
                desktopCommands.forEach(cmd => {
                    exec(cmd, (err) => {
                        if (err) {
                            this.log(`Error executing proxy disable command for ${osType}: ${cmd} - ${err.message}`);
                        } else {
                            this.log(`Proxy disabled successfully on ${osType}.`);
                        }
                    });
                });
            } else {
                this.log(`[Proxy] Unsupported OS or desktop environment for automatic proxy disable: ${osType}`);
                if (typeof window !== 'undefined' && window.showMessageUI) {
                    window.showMessageUI(`[Proxy] Your OS or desktop environment (${osType}) isn't supported for automatic proxy disabling. You'll need to disable the proxy manually.`, 15000);
                }
            }
        }
    }

    setDNS(dns1, dns2, osType) {
        if (osType === "win32") {
            this.log(`[DNS] Setting DNS for Windows: Primary -> ${dns1}, Secondary -> ${dns2 || 'None'}`);
            exec(`netsh interface show interface`, (err, stdout) => {
                if (err) {
                    this.log(`Error retrieving interfaces on Windows: ${err.message}`);
                    return;
                }
                const interfaces = stdout
                    .split('\n')
                    .slice(3)
                    .map(line => line.trim().match(/(?:\S+\s+){3}(.+)/))
                    .filter(match => match && match[1])
                    .map(match => match[1].replace(/\r$/, ''));

                interfaces.forEach(iface => {
                    exec(`netsh interface ip set dns "${iface}" static ${dns1} primary`, (err) => {
                        if (err) this.log(`Error setting primary DNS on ${iface}: ${err.message}`);
                        else this.log(`Primary DNS set on ${iface}`);
                    });

                    if (dns2) {
                        exec(`netsh interface ip add dns "${iface}" ${dns2} index=2`, (err) => {
                            if (err) this.log(`Error setting secondary DNS on ${iface}: ${err.message}`);
                            else this.log(`Secondary DNS set on ${iface}`);
                        });
                    } else {
                        exec(`netsh interface ip delete dns "${iface}" ${dns1} all`, (err) => {
                            if (err) this.log(`Error clearing DNS on ${iface}: ${err.message}`);
                        });
                        exec(`netsh interface ip set dns "${iface}" static ${dns1} primary`, (err) => {
                            if (err) this.log(`Error resetting primary DNS on ${iface}: ${err.message}`);
                        });
                    }
                });
            });
        } else if (osType === "darwin") {
            exec(`networksetup -listallnetworkservices`, (err, stdout) => {
                if (err) {
                    this.log(`Error retrieving interfaces on macOS: ${err.message}`);
                    return;
                }
                const services = stdout.split('\n').slice(1).filter(service => service.trim() && !service.includes('*'));
                services.forEach(service => {
                    exec(`networksetup -setdnsservers "${service}" ${dns1} ${dns2 || 'Empty'}`, (err) => {
                        if (err) this.log(`Error setting DNS on ${service}: ${err.message}`);
                        else this.log(`DNS set on ${service}.`);
                    });
                });
            });
        } else {
            exec(`nmcli device status | awk '{print $1}' | tail -n +2`, (err, stdout) => {
                if (err) {
                    this.log(`Error retrieving interfaces on Linux: ${err.message}`);
                    return;
                }
                const interfaces = stdout.split('\n').filter(iface => iface.trim());
                interfaces.forEach(iface => {
                    const dnsServers = [dns1, dns2].filter(Boolean).join(' ');
                    exec(`nmcli con mod ${iface} ipv4.dns "${dnsServers}"`, (err) => {
                        if (err) this.log(`Error setting DNS on ${iface}: ${err.message}`);
                        else this.log(`DNS set for ${iface}.`);
                    });
                    exec(`nmcli con up ${iface}`, (err) => {
                        if (err) this.log(`Error applying DNS settings on ${iface}: ${err.message}`);
                    });
                });
            });
        }
    }

    getRandomCountryCode() {
        const countryCodes = ["AT", "AU", "BE", "BG", "CA", "CH", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GB", "HR", "HU", "IE", "IN", "IT", "JP", "LV", "NL", "NO", "PL", "PT", "RO", "RS", "SE", "SG", "SK", "US"];
        const randomIndex = Math.floor(Math.random() * countryCodes.length);
        return countryCodes[randomIndex];
    }

    returnOS() {
        const platform = process.platform;

        if (platform === "win32") {
            return "win32";
        }

        if (platform === "darwin") {
            return "macOS";
        }

        if (platform === "linux") {
            try {
                const desktopEnv = process.env.XDG_CURRENT_DESKTOP || process.env.DESKTOP_SESSION;
                if (desktopEnv) {
                    if (desktopEnv.includes("GNOME")) return "GNOME";
                    if (desktopEnv.includes("KDE")) return "KDE";
                    if (desktopEnv.includes("XFCE")) return "XFCE";
                    if (desktopEnv.includes("Cinnamon")) return "CINNAMON";
                    if (desktopEnv.includes("MATE")) return "MATE";
                    if (desktopEnv.includes("LXQt")) return "LXQT";
                    if (desktopEnv.includes("Budgie")) return "BUDGIE";
                    if (desktopEnv.includes("Deepin")) return "DEEPIN";
                    if (desktopEnv.includes("Pantheon")) return "PANTHEON";
                    if (desktopEnv.includes("Trinity")) return "TRINITY";
                }

                const runningProcesses = this.execSync("ps aux").toString().toLowerCase();
                if (runningProcesses.includes("i3")) return "I3WM";
                if (runningProcesses.includes("openbox")) return "OPENBOX";

            } catch (err) {
                this.log(`Error detecting Linux desktop environment: ${err.message}`);
            }
            return "linux-unknown";
        }

        return "unknown";
    }

    async downloadFile(url, destPath) {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(destPath);
            const request = this.https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download '${url}'. Status: ${response.statusCode}`));
                    return;
                }
                response.pipe(file);
                file.on("finish", () => {
                    file.close(() => {
                        fs.chmodSync(destPath, 0o755);
                        resolve();
                    });
                });
            });
            request.on("error", (err) => {
                fs.unlink(destPath, () => reject(err));
            });
            file.on("error", (err) => {
                fs.unlink(destPath, () => reject(err));
            });
        });
    }
    addExt(name) {
        return process.platform === "win32" ? `${name}.exe` : name;
    }
    async fetchAndInstallCores() {
        const platformBaseURL = process.platform === "darwin"
            ? (process.arch === 'arm64' ? 'mac/arm64' : 'mac/amd64')
            : process.platform;
        const baseURL = `https://raw.githubusercontent.com/Freedom-Guard/Freedom-Guard/main/src/main/cores/${platformBaseURL}`;

        const destDir = process.platform == "win32" ? this.coresPath : getConfigPath();

        const vibeDestPath = path.join(destDir, "vibe", this.addExt("vibe-core"));
        const warpDestPath = path.join(destDir, "warp", this.addExt("warp-core"));

        const vibeURL = `${baseURL}/vibe/${this.addExt("vibe-core")}`;
        const warpURL = `${baseURL}/warp/${this.addExt("warp-core")}`;

        try {
            fs.mkdirSync(path.dirname(vibeDestPath), { recursive: true });
            fs.mkdirSync(path.dirname(warpDestPath), { recursive: true });

            if (typeof window !== 'undefined' && window.showMessageUI) {
                window.showMessageUI("📥 Downloading warp-core...");
            }
            await this.downloadFile(warpURL, warpDestPath);

            if (typeof window !== 'undefined' && window.showMessageUI) {
                window.showMessageUI("📥 Downloading vibe-core...", 7500);
            }
            await this.downloadFile(vibeURL, vibeDestPath);

            if (typeof window !== 'undefined' && window.showMessageUI) {
                window.showMessageUI("✅ Core files installed successfully.");
            }
        } catch (err) {
            this.log(`❌ Error downloading core files: ${err.message}`);
            if (typeof window !== 'undefined' && window.showMessageUI) {
                window.showMessageUI(`❌ Error downloading core files: \n${err.message}`);
            }
        }
    }

    donateCONFIG(config) {
        if (typeof window !== 'undefined' && window.donateCONFIG) {
            window.donateCONFIG(config);
        } else {
            this.log("window.donateCONFIG is not defined.");
        }
    }
}

module.exports = { Connect, ConnectAuto, Test, PublicSet, Tools };