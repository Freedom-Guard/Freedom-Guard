const { rejects } = require('assert');
const { spawn, exec, execSync } = require('child_process');
const fs = require('fs');
const { notify } = require('node-notifier');
const { type } = require('os');
const { resolve } = require('path');
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
            "vibe": {},
            "warp": {
                gool: false,
                scan: false,
                endpoint: "",
                reserved: false,
                dns: "",
                verbose: false,
                scanrtt: "",
                ipv: "",
                key: "",
                timeout: 60000,
            },
            "setupGrid":
            {
                "inbounds": [
                    {
                        "type": "socks",
                        "tag": "socks-in",
                        "listen": "127.0.0.1:40000"
                    }
                ],
                "outbounds": [
                    {
                        "type": "socks5",
                        "tag": "warp-out",
                        "server": "127.0.0.1",
                        "port": 8086
                    },
                    {
                        "type": "tun",
                        "interface_name": "sign-tun",
                        "mtu": 1500,
                        "stack": "gvisor",
                        "auto_route": true,
                        "auto_detect_interface": true
                    }
                ],
                "route": {
                    "auto_detect_interface": true,
                    "rules": [
                        {
                            "type": "field",
                            "inbound": "socks-in",
                            "outbound": "tun"
                        }
                    ]
                }
            },
            "public": {
                proxy: "127.0.0.1:8086",
                configAuto: "",
                configManual: "",
                core: "auto",
                dns: ["8.8.8.8"],
                protocol: "auto",
                testUrl: "https://1.1.1.1/cdn-cgi/trace",
                type: "system",
                isp: "other"
            }
        };
    };
    saveSettings(settingsSave = this.settingsALL) {
        write_file('freedom-guard.json', JSON.stringify(settingsSave));
        this.settingsALL = settingsSave;
    };
    ReloadSettings() {
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
        connectedUI();
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
            alert(`Proxy ${type} with ${this.settingsALL["public"]["core"]}: ${this.settingsALL["public"]["proxy"]} ==== Please set this proxy on your system.`)
        }
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
        }
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
        await this.sleep(60000);
        if (!this.connected) {
            this.killVPN("warp");
            this.LOGLOG("warp not connected!");
            this.notConnected("warp");
        };
    };
    connectVibe() {
        return new Promise((resolve, reject) => {
        });
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
    ResetArgs() {
        this.ReloadSettings();
        let settingWarp = this.settingsALL["warp"];
        if (settingWarp["gool"]) {
            this.argsWarp.push("--gool");
        };
        if (settingWarp["scan"]) {
            this.argsWarp.push("--scan");
        };
        if (settingWarp["endpoint"] != "") {
            this.argsWarp.push("--endpoint");
            this.argsWarp.push(settingWarp["endpoint"]);
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
    };
    DataoutWarp(data = "") {
        this.LOGLOG(data);
        if (data.toString().includes("serving")) {
            this.ReloadSettings();
            this.connectedVPN("warp");
            this.connected = true;
            this.setupGrid(this.settingsALL["public"]["proxy"], this.settingsALL["public"]["type"], "socks5");
        }
    };
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