const { spawn, exec, execSync } = require('child_process');
const fs = require('fs');
read_file = function (path) {
    return fs.readFileSync(path, 'utf8');
}
write_file = function (path, output) {
    fs.writeFileSync(path, output);
}
class publicSet {
    constructor() {
        this.process = null;
        this.axios = require('axios');
        this.geoip = require('geoip-lite');
        this.settingsALL = {
            "flex": {},
            "grid": {},
            "vibe": {},
            "warp": {},
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
}
class connectAuto extends publicSet {
    constructor() {
        super();
        this.processWarp = null;
        this.processVibe = null;
        this.processFlex = null;
        this.processGrid = null;
        this.processGridSetup = null;
        this.settings = {
            "flex": {},
            "grid": {},
            "vibe": {},
            "warp": {},
            "public": this.settingsALL["public"]
        };
    };
    connect() {

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

    }
    connectWarp() {

    };
    connectVibe() {
    };
    connectFlex() {
    }
    connectGrid() {
    }
    setupGrid(proxy, type = 'proxy') {
    };
    ResetArgs() {

    }
    saveSettings() {
        super.saveSettings(this.settings);
    };
    ReloadSettings() {
        try {
            this.settings = JSON.parse(readFileSync('freedom-guard.json'));
        } catch (error) { this.saveSettings(); }
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
            "public": publicSet.settings
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