const { rejects } = require('assert');
const { spawn, exec, execSync } = require('child_process');
const fs = require('fs');
const { notify } = require('node-notifier');
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
        this.setTimeout = require("timers/promises");
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
            "public": {
                proxy: "127.0.0.1:8086",
                configAuto: "",
                configManual: "",
                core: "auto",
                dns: ["8.8.8.8"],
                protocol: "auto",
                testUrl: "https://one.one.one.one/cdn-cgi/trace",
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
        let responseFunc = { ip: "", ping: "", country: "unknow", filternet: false };
        try {
            const time = new Date().getTime();
            const response = await this.axios.get('https://api.ipify.org?format=json');
            responseFunc.ip = response.data.ip;
            responseFunc.ping = new Date().getTime() - time;
            try {
                responseFunc.country = this.geoip.lookup(response.data.ip).country;
                this.axios.get(this.settingsALL["public"]["testUrl"]).then((response) => {
                    responseFunc.filternet = true;
                });
            }
            catch { };
            return responseFunc;
        } catch (error) {
            console.error("خطا در دریافت IP:", error);
            return responseFunc;
        };
    };
    LOGLOG(text) {
        console.log(text);
    };
    connectedVPN(core) {
        this.LOGLOG("connected " + core);
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
        this.processWarp = spawn(this.path.join(this.coresPath, "warp", this.addExt("warp-core")), this.argsWarp);
        this.processWarp.stderr.on("data", (data) => {
            this.DataoutWarp(data instanceof Buffer ? data.toString() : data);
        });
        this.processWarp.stdout.on("data", (data) => {
            this.DataoutWarp(data instanceof Buffer ? data.toString() : data);
        });
        this.processWarp.on("close", () => {
            this.killVPN();
        });
        await this.setTimeout(this.settingsALL["warp"]["timeout"]);
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
    setupGrid(proxy, type = 'proxy') {
        return new Promise((resolve, reject) => {
        });
    };
    ResetArgs() {
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
        this.LOGLOG("disconnecting... -> " + core)
        core == "warp" ? this.processWarp.kill() : '';
        core == "vibe" ? this.processVibe.kill() : '';
        core == "grid" ? this.processGrid.kill() : '';
        core == "flex" ? this.processFlex.kill() : '';
    };
    DataoutWarp(data = "") {
        this.LOGLOG(data);
        if (data.toString().includes("serving")) {
            this.connectedVPN("warp");
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
module.exports = { connect, connectAuto, test, publicSet };