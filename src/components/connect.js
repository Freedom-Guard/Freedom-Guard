
// Start Code
// #region vars
var childProcess = null;
var isp = "other";
var StatusGuard = false;
var AssetsPath = path.join(__dirname, "assets");
var settingWarp = {
    proxy: "127.0.0.1:8086",
    gool: false,
    scan: false,
    endpoint: "",
    cfon: false,
    cfonc: "IR",
    ipver: 4,
    warpver: "",
    warpkey: "",
    scanrtt: "",
    verbose: false,
    cache: "",
    wgconf: "",
    config: "",
    configAuto: "",
    reserved: "",
    dns: "",
    tun: false,
    startup: "warp",
    isp: "other",
    core: "auto",
    testUrl: "https://x.com",
    timeOutWarpAuto: 30000,
    timeOutVibeAuto: 45000,
    timeOutWarp: 60000,
    timeOutVibe: 60000,
    "configfg": "https://raw.githubusercontent.com/Freedom-Guard/Freedom-Guard/main/config/default.json"
};
var argsWarp = [""];
var argsVibe = [""];
var settingVibe = {
    "status": false,
    "config": "auto",
    "fragment": false,
    "fragment-size": "",
    "dns-direct": "",
    "dns-remote": "",
    "tun": false
};
var testproxystat = false;
var countryIP = "";
var filterBypassStat = false;
var links = [];

//#endregion
// #region Libraries
const versionapp = "1.4.5";
const ipc = require('electron').ipcRenderer;
const axios = require('axios');
const geoip = require('geoip-lite');
const { trackEvent } = require('@aptabase/electron/renderer');
const Winreg = require('winreg');
const notifier = require('node-notifier');
const { spawn, exec, execSync } = require("child_process");
const { setTimeout } = require("timers/promises");
const { config } = require('process');
__dirname = path.join(__dirname.replace("app.asar", ""), "../../");
// #endregion
// #region Functions
var childProcess = null;
async function KillProcess(core = "warp") {
    exec('taskkill /IM ' + (core == "warp" ? "warp-plus.exe" : "HiddifyCli.exe") + ' /F /T'); // Windows
    exec("pkill -f warp-plus"); // Linux
    exec("pkill -f HiddifyCli"); // Linux
    try {
        if (childProcess != null) {
            if (process.platform === 'win32') {
                exec('taskkill /IM ' + (core == "warp" ? "warp-plus.exe" : "HiddifyCli.exe") + ' /F /T'); // Windows
            } else {
                childProcess.kill('SIGTERM'); // POSIX systems
            };
            childProcess.kill();
            childProcess = null;
        }
        console.log("Killed process...")
    }
    catch {
        console.error("error -> kill process")
    }
};
function changeISP(newisp) {
    console.log("NEW ISP IS: " + newisp)
    settingWarp["isp"] = newisp;
    saveSetting();
    Onloading();
};
async function checkDataOut(data, core) {
    /* for check Data Out --> process
    @param {string|Buffer} data - Data received from the core process (can be a string or buffer).
    @param {string} core - name of core
    @returns {void}
    * 
    */
    if (core == "warp") {
        if (data.toString().includes("serving proxy")) {
            if (process.platform == "linux" && !settingWarp["tun"]) {
                exec("bash " + path.join(__dirname, "assets", "bash", "set_proxy-gn.sh") + ` ${settingWarp["proxy"].replace(":", " ")}`);
                if (await testProxy() || !(settingWarp["core"] == "auto")) {
                    ConnectedWarp();
                    alert("Proxy is working on: " + settingWarp["proxy"]);
                    ConnectedWarp();
                }
            }
            else if (process.platform == "win32" && !settingWarp["tun"]) {
                console.log("Set proxy");
                setProxy(settingWarp["proxy"]);
                if (await testProxy()) {
                    ConnectedWarp();
                }
            }
        }
        if (data.includes("bind: Only one usage of each socket address")) {
            SetValueInput("bind-address-text", `127.0.0.1:${Math.floor(Math.random() * 6000)}`)
            disconnectVPN();
            global.setTimeout(() => {
                connect("warp")
            }, 5000);
            Showmess("")
        }
    }
    else if (core == "vibe") {
        if (data.toString().includes("CORE STARTED:")) {
            if (await testProxy()) {
                ConnectedVibe();
                global.setTimeout(() => {
                    testProxy();
                }, 5000);
            }
        }
    }
    console.log(data)
}
async function Run(nameFile, args, runa = 'user', exeCore = "warp") {
    /* for Running Process warp, scanner, vibe
    @param {string} nameFile - name of file
    @param {array} args - arguments for process
    @param {string} runa - run as admin or user
    @param {string} exeCore - warp or vibe or scanner
    @returns {void}
    * Kill old process
    * Run new process for linux or windows - Linux(Replace .exe)
    * define Events for Close, Data process
    */
    console.log("Runing New Process...");
    KillProcess("warp");
    KillProcess("warp");
    KillProcess("vibe");
    KillProcess("vibe");
    await testProxy();
    var exePath = `"${path.join(__dirname, "src", "main", "cores", exeCore, nameFile)}"`; // Adjust the path to your .exe file
    if (process.platform == "linux") {
        exePath = `"${path.join(__dirname, "src", "main", "cores", exeCore, nameFile.replace(".exe", ""))}"`; // Adjust the path to your .exe file
        exec("chmod +x " + exePath);
        if (runa == "admin") {
            childProcess = spawn(exePath, args, { shell: true, runAsAdmin: true });
        } else childProcess = spawn(exePath, args, { shell: true, runAsAdmin: true });
        console.log(exePath + " " + args);
    }
    else {
        if (runa == "admin") {
            childProcess = spawn(exePath, args, { shell: true, runAsAdmin: true });
        } else childProcess = spawn(exePath, args, { shell: true, runAsAdmin: true });
        console.log(exePath + " " + args);
    }
    childProcess.stdout.on('data', async (data) => {
        checkDataOut(data.toString(), exeCore);
    });
    childProcess.stderr.on('data', async (data) => {
        if (data instanceof Buffer) {
            data = data.toString(); // Convert Buffer to string
        }
        checkDataOut(data, exeCore);
    });
    childProcess.title = exeCore;
    childProcess.on('close', (code, name) => {
        console.log(`child process exited with code ${code + " | " + exeCore}`);
        if ((StatusGuard || settingVibe["status"]) && (settingWarp["core"] == "auto")) {
            sect == "main" ? disconnectVPN(mode = "try") : disconnectVPN();
        }
    });
};
function isValidURL(url) {
    const regex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(\/[^\s]*)?$/;
    return regex.test(url);
};
async function getWarpKey() {
    const response = await fetch("https://raw.githubusercontent.com/ircfspace/warpkey/main/plus/full");
    let responseText = await response.text();
    let keys = responseText.split("\n");
    let key = keys[Math.floor(Math.random() * keys.length)];
    SetValueInput("warp-key-text", key);
    settingWarp["warpkey"] = key;
    saveSetting();
}
async function FindBestEndpointWarp(type = 'find') {
    /* for Find best endpoint for warp and set it
    @param {string} type - type of searching
    @returns {void}
    * Run scanner
    * await 18s
    * if fg==on ? set best endpoint : return
    */
    try {
        process.nextTick(() => {
            type != "conn" ? Loading(18000, "Searching Endpoint...") : ("");
        });
        console.log("Finding Best Endpoint For Warp ....");
        if (process.platform == "linux") {
            Loading(0);
            alert("Scanner IP Endpoint not support in linux");
            return;
        }
        if (settingWarp["ipver"] == "") settingWarp["ipver"] = 4;
        Run("win_scanner.bat", ["-" + settingWarp["ipver"]], "admin", "scanner");
        await setTimeout(18000);
        console.log("Scanner End -> Set endpoint");
        Loading(0);
        SetServiceWarp("endpoint", read_file(path.join(__dirname, "src", "main", "cores", "scanner", "bestendpoint.txt")).replace(" ", "").replace("\n", "").replace("\r", ""));
        saveSetting();
        sect == "main" ? SetSettingWarp() : "";
        if (type == "conn" && StatusGuard == true) {
            StatusGuard = false;
            connectWarp();
        }
        if (type != "conn") {
            Showmess(2000, "Finded Best Endpoint");
        }
        else {
            sect == "main" ? Showmess(3000, "Finded Best Endpoint. Reconnecting") : ("");
        }
        return;
    } catch { };
};
async function testProxy() {
    /* for test SystemProxy, set ip, country and ping in pingbox
    if bypass and fg==on -> set on vpn
    @param {null} 
    @returns {void}
    * get ip and ping and country -> set for pingBox
    * test Bypass -> if bypass == on -> set on vpn
    * if bypass == on -> return true
    */
    console.log("Testing Proxy...");
    var startTime = Date.now();
    try {
        const testConnection = await axios.get('http://api.ipify.org?format=json', {
            timeout: 5000,
        });
        console.log('IP :', testConnection.data.ip);
        var endTime = Date.now(); // Capture the end time
        var pingTime = endTime - startTime; // Calculate the ping time
        if (pingTime < 1500) { pingTime = `<font color='green'>${pingTime}ms</font>`; } else { pingTime = `<font color='red'>${pingTime}ms</font>` };
        function getCountryFromIP(ip) {
            var geo = geoip.lookup(ip);
            if (geo) {
                countryIP = geo.country;
                return `<img src="${path.join(__dirname, "src", "svgs", countryIP.toLowerCase() + ".svg")}" width="40rem" style='margin:0.4rem 0.4rem 0.4rem 0rem;'/>`;
            } else {
                return '❓';
            }
        }
        var countryEmoji = getCountryFromIP(testConnection.data.ip);
        sect == "main" ? SetHTML("ip-ping-vibe", "" + countryEmoji + testConnection.data.ip + " | <b>" + pingTime + "</b>") : ("");
        testproxystat = true;
        try {
            var testBypass = await axios.get(settingWarp["testUrl"] ?? "https://x.com", {
                timeout: 5000, // Timeout in ms
            });
            console.log("Fliternet Bypassed");
            isConnected = StatusGuard || settingVibe["status"];
            sect == "main" ? addClass("ip-ping-warp", "connected") : ("");
            sect == "main" ? SetHTML("ip-ping-warp", `
                <div class="ip-ping-info">
                    <p class="ip-ping-item">
                        <span class="ip-icon">🌍</span> 
                        Country: ${countryEmoji}
                    </p>
                    <p class="ip-ping-item">
                        <span class="ip-icon">🔍</span> 
                        IP: <b>${testConnection.data.ip}</b>
                    </p>
                    <p class="ip-ping-item">
                        <span class="ip-icon">⚡</span> 
                        Ping: <b>${pingTime}</b>
                    </p>
                    <p class="ip-ping-item">
                        <span class="ip-icon">🚀</span> 
                        Bypass: <b>On</b>
                    </p>
                    <p id="connection-status" class="ip-status ${isConnected ? '' : 'disconnected'}">
                        ${isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                    </p>
                </div>
            `) : ("");
            if (StatusGuard || settingVibe["status"]) {
                ConnectedVibe(StatusGuard ? "warp" : "vibe");
            }
            filterBypassStat = true;
            return true;
        }
        catch {
            filterBypassStat = false;
            sect == "main" ? SetHTML("ip-ping-warp", "" + pingTime + "") : ("");
            return false;
        }
    } catch (error) {
        console.error('Error Test Connection:', error.message);
        sect == "main" ? SetHTML("ip-ping-vibe", "Not Connected To Internet") : ("");
        sect == "main" ? SetHTML("ip-ping-warp", "Not Connected To Internet") : ("");
        testproxystat = false;
        return false;
    }
};
const setProxy = async (proxy) => {
    /* for set Proxy only for windows
    @param {string} proxy - 127.0.0.1:8080 
    @returns {void}
    * set Proxy in registery windows
    */
    console.log("Set proxy...")
    const proxyKey = new Winreg({
        hive: Winreg.HKCU,
        key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'
    });
    proxyKey.set('ProxyEnable', Winreg.REG_DWORD, '1', (err) => {
        if (err) console.log('Error setting ProxyEnable:', err);
    });
    proxyKey.set('ProxyServer', Winreg.REG_SZ, proxy, (err) => {
        if (err) console.log('Error setting ProxyServer:', err);
    });
};
const offProxy = async (proxy) => {
    /* for unset Proxy only for windows
    @param {string} proxy - 127.0.0.1:8080 
    @returns {void}
    * unset Proxy in registery windows
    */
    console.log("Reset Proxy...");
    const proxyKey = new Winreg({
        hive: Winreg.HKCU,
        key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'
    });
    proxyKey.set('ProxyEnable', Winreg.REG_DWORD, '0', (err) => {
        if (err) console.log('Error setting ProxyEnable:', err);
    });
};
function Onloading() {
    /* for Onloading reload setting, configs Vibe
    @param {null}
    @returns {void}
    * reload settings from file
    */
    try {
        // Restore var settingWarp  from json
        settingWarp = JSON.parse(read_file("freedom-guard.json"))["warp"];
    }
    catch {
        saveSetting()
    }
    try {
        settingVibe = JSON.parse(read_file("freedom-guard.json"))["vibe"]; // Load Setting From File.json 
        configsVibeName = JSON.parse(read_file("freedom-guard.json"))["configsVibeName"]; // Load Setting From File.json 
        configsVibeLink = JSON.parse(read_file("freedom-guard.json"))["configsVibeLink"]; // Load Setting From File.json 
    }
    catch {
        saveSetting();
    }
    if (settingVibe["config"] == "") {
        settingVibe["config"] = "auto";
    }
}
function setSystemTrayON() {
    ipc.send("set-on-fg");
}
function setSystemTrayOFF() {
    ipc.send("set-off-fg");
}
// #endregion
// #region Connection
function ConnectedVibe(stat = "normal") {
    console.log("Connected Vibe");
    // function runed when the proxy is connected
    sect == "main" ? SetAttr("changeStatus-vibe", "style", "box-shadow:0px 0px 50px 10px rgba(98, 255, 0, 0.7);") : ("")
    sect == "main" ? SetAttr("changeStatus-vibe", "style", "animation:;") : ("")
    sect == "main" ? SetHTML("status-vibe-conn", "🚀 Connected") : ('');
    sect == "main" ? SetAnim("ChangeStatus", "Load") : ("");
    sect == "main" ? addClass("ChangeStatus", "connected") : ("");
    sect == "main" ? SetBorderColor("ChangeStatus", "#15ff00") : ("");
    if (stat == "normal") {
        NotifApp("🚀!Connected To Vibe!🚀");
    }
    settingVibe["status"] = true;
    StatusGuard = true;
    RefreshLinks();
    setSystemTrayON();
}
function ConnectedWarp(stat = "normal") {
    console.log("Connected Warp");
    // function runed when the proxy is connected
    sect == "main" ? SetAttr("changeStatus-vibe", "style", "box-shadow:0px 0px 50px 10px rgba(98, 255, 0, 0.7);") : ("")
    sect == "main" ? SetAttr("changeStatus-vibe", "style", "animation:;") : ("")
    sect == "main" ? SetHTML("status-vibe-conn", "🚀 Connected") : ('');
    sect == "main" ? SetAnim("ChangeStatus", "null !important") : ("");
    sect == "main" ? SetBorderColor("ChangeStatus", "#15ff00") : ("");
    SetAnim("ChangeStatus", "Load");
    SetBorderColor("ChangeStatus", "#15ff00");
    if (stat == "normal") {
        sect == "main" ? Showmess(5000, "🚀!Connected To Warp!🚀") : ("");
        NotifApp("🚀!Connected To Warp!🚀");
    }
    StatusGuard = true;
    settingVibe["status"] = true;
    saveSetting();

    setSystemTrayON();
}
function disconnectVPN() {
    // function runed when the proxy is disconnected
    // Kill the HiddifyCli.exe process
    StatusGuard = false;
    settingVibe["status"] = false;
    console.log("Disconnecting VPN");
    KillProcess(core = "warp");
    KillProcess(core = "vibe");
    //Disable the proxy settings
    offProxy(settingWarp["proxy"]);
    //Remove the box shadow and animation from the vibe status element
    sect == "main" ? SetAttr("changeStatus-vibe", "style", "box-shadow:;") : ("")
    sect == "main" ? SetAttr("changeStatus-vibe", "style", "animation:;") : ("")
    //Set the vibe status to disconnected
    sect == "main" ? SetHTML("status-vibe-conn", "Disconnected") : ('');
    //Set the vibe setting to false
    sect == "main" ? SetAnim("ChangeStatus", "Connect 7s ease-in-out") : ("");
    sect == "main" ? SetAttr("ChangeStatus", "style", "border-color:;") : ("");
    if (process.platform == "linux") {
        exec("bash " + path.join(__dirname, "assets", "bash", "reset_proxy-gn.sh"));
    }
    else {
        offProxy(settingWarp["proxy"]);
    };
    sect == "main" ? SetAnim("ChangeStatus", "Connect 5s") : ("");
    global.setTimeout(() => {
        sect == "main" ? SetAnim("ChangeStatus", "") : ("");
    }, 600);
    sect == "main" ? removeClass("ChangeStatus", "connected") : ("");
    sect == "main" ? removeClass("ip-ping-warp", "connected") : ("");
    NotifApp("Disconnected Freedom Guard");
    testProxy();
    saveSetting();
    Onloading();
    setSystemTrayOFF();
}
async function connect(core = 'warp', config = 'auto', os = process.platform, num = 0, mode = 'normal') {
    if (document.getElementById("ChangeStatus").style.borderColor == "#15ff00") {
        offProxy();
        if (process.platform == "win32") {
            exec("taskkill /F /IM warp-plus.exe");
            exec("taskkill /F /IM HiddifyCli.exe");
        }
        else {
            exec("pkill -f warp-plus");
            exec("pkill -f Hiddify-Cli");
        }
        disconnectVPN();
        testProxy();
        SetBorderColor("ChangeStatus", "");
        return;
    }
    if (core == "warp") await connectWarp(num, mode = mode);
    else if (core == "vibe") await connectVibe(num, mode);
    else if (core == "auto") await connectAuto(num);
}
async function RefreshLinks() {
    try {
        reqRefreshLinks = new XMLHttpRequest();
        reqRefreshLinks.open('GET', settingWarp["configfg"], true);
        reqRefreshLinks.onload = function () {
            if (reqRefreshLinks.status >= 200 && reqRefreshLinks.status < 400) {
                links = JSON.parse(reqRefreshLinks.responseText);
                console.log("Links Refreshed");
                console.log(links);
                write_file("links.json", JSON.stringify(reqRefreshLinks.responseText));
            } else {
                try { links = JSON.parse(read_file("freedom-guard.json"))["links"]; } catch {
                    saveSetting();
                }
                console.log("Error Refreshing Links");
                Showmess("Error Refreshing Links")
            }
        }
        reqRefreshLinks.send();
    }
    catch { }
}
function importConfig(config = "") {
    if (config.startsWith("vless") || config.startsWith("vmess") || config.startsWith("trojan") || config.startsWith("ss") || config.startsWith("hysteria") || config.startsWith("shadowtls") || config.startsWith("tuic") || config.startsWith("socks") || config.startsWith("http") || config.startsWith("https") || config.startsWith("wireguard") || config.startsWith("hy2")) {
        settingWarp["core"] = "vibe";
        settingVibe["config"] = config;
    }
    else if (config.startsWith("vibe")) {
        config.replace("vibe://", "").split("&").forEach((item) => {
            settingVibe[item.split("=")[0]] = (item.split("=")[1] == 'true' ? true : item.split("=")[1] == 'false' ? false : item.split("=")[1]);
        });
    }
    else if (config.startsWith("freedom-guard")) {
        settingWarp["core"] = config.replace("freedom-guard://", "").split("&")[0].split("=")[1];
        config.replace("freedom-guard://", "").split("&").forEach((item) => {
            if (settingWarp["core"] == "vibe") {
                settingVibe[item.split("=")[0]] = item.split("=")[1];
            }
            else if (settingWarp["core"] == "warp") {
                settingWarp[item.split("=")[0]] = item.split("=")[1];
            }
            else if (settingWarp["core"] == "auto") {
                settingWarp[item.split("=")[0]] = item.split("=")[1];
            }
        });
    }
    else if (config.startsWith("warp")) {
        config.replace("warp://", "").split("&").forEach((item) => {
            console.log(item);
            settingWarp[item.split("=")[0]] = (item.split("=")[1] == 'true' ? true : item.split("=")[1] == 'false' ? false : item.split("=")[1]);
        });
    }
    else {
        alert("Config not supported");
    }
    settingWarp["configAuto"] = config;
    saveSetting();
    ResetArgsVibe();
    ResetArgsWarp();
}
var modeConn = "normal";
var number = 0;
async function connectAuto(num = 0, mode = 'normal') {
    modeConn = mode;
    number = num; // Number of try: connect
    await RefreshLinks();
    console.log("ISP IS " + settingWarp["isp"] + " | Start Auto Server");
    let configType = links[settingWarp["isp"]][num].split(",;,")[0];
    if (links[settingWarp["isp"]] == undefined) settingWarp["isp"] = "other";
    if (links[settingWarp["isp"]].length < num) { disconnectVPN(); return true };
    let configText = links[settingWarp["isp"]][num].split(",;,")[1];
    importConfig(configText);
    await setTimeout(500);
    settingWarp["core"] = "auto";
    ResetArgsVibe();
    ResetArgsWarp();
    connect(configType, num = num, mode = modeConn);
}
async function NotifApp(body, title = "Freedom Guard", icon = './ico.png') {
    notifier.notify(
        {
            title: title,
            message: body,
            icon: path.join(__dirname, "src", "assets", "icon", './ico.png'),
            appID: " ",
            sound: true,
            wait: true,
            appIcon: path.join(__dirname, "src", "assets", "icon", './ico.png'),
            reply: true
        },
        function (err, response, metadata) { }
    );
    notifier.on('click', function (notifierObject, options, event) { });
    notifier.on('timeout', function (notifierObject, options) { });
}
async function connectVibe(num = number, mode = 'normal') {
    if (sect == "main") {
        if (mode == "try") {
            settingVibe["status"] = false;
        }
    }
    if (document.getElementById("ChangeStatus").style.borderColor == "#15ff00") {
        offProxy();
        if (process.platform == "win32") {
            exec("taskkill /F /IM warp-plus.exe");
            exec("taskkill /F /IM HiddifyCli.exe");
        }
        else {
            exec("pkill -f warp-plus");
            exec("pkill -f Hiddify-Cli");
        }
        testProxy();
        SetBorderColor("ChangeStatus", "");
        return;
    }
    if (settingVibe["status"] == false && settingWarp["core"] == "auto") {
        console.log("Connecting to vibe auto mode...");
        if (process.platform == "linux") {
            exec("bash " + path.join(__dirname, "assets", "bash", "reset_proxy-gn.sh"));
        }
        else {
            offProxy(settingWarp["proxy"]);
        };
        sect == "main" ? SetAnim("ChangeStatus", "Connect 7s infinite") : ("");
        ResetArgsVibe(config);
        Run("HiddifyCli.exe", argsVibe, "admin", core = "vibe");
        settingVibe["status"] = true;
        await setTimeout(settingWarp["timeOutVibeAuto"] ?? 40000);
        console.log("Testing vibe...")
        if (await testProxy()) {
            Showmess(5000, "⚡Connected Vibe⚡");
            trackEvent("connected-vibe-auto");
            if (sect === "main") {
                SetAnim("ChangeStatus", "Load");
                SetBorderColor("ChangeStatus", "#15ff00");
                ConnectedVibe();
            }
            else {
                console.log("trying vibe...");
                StatusGuard = false;
                settingVibe["status"] = false;
                connectAuto(number + 1, mode = 'try'); // Increment the connection attempt number
            }
        }
    }
    // this is For Connect To Freedom-Vibe
    else if (settingVibe["status"] == false && settingWarp["core"] == "vibe" && StatusGuard == false) {
        console.log("Connecting to vibe custom mode...");
        settingVibe["status"] = true;
        StatusGuard = true;
        if (process.platform == "linux") {
            exec("bash " + path.join(__dirname, "assets", "bash", "reset_proxy-gn.sh"));
        }
        else {
            offProxy(settingWarp["proxy"]);
        };
        sect == "main" ? SetAnim("ChangeStatus", "Connect 7s infinite") : ("");
        sect == "main" ? SetAnim("changeStatus-vibe", "changeStatus-vibe-animation 5s infinite") : ("");
        if (settingVibe["config"] == "auto" || settingVibe["config"] == "") {
            var configs = [
                "https://raw.githubusercontent.com/ALIILAPRO/v2rayNG-Config/main/sub.txt",
                "https://raw.githubusercontent.com/yebekhe/TVC/main/subscriptions/xray/normal/mix",
                "https://raw.githubusercontent.com/AzadNetCH/Clash/main/AzadNet_META_IRAN-Direct.yml",
                "https://raw.githubusercontent.com/ircfspace/warpsub/main/export/warp",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Warp_sub.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub1.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub2.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub3.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub4.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub5.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub6.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub7.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub8.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub9.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub10.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub11.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub12.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub13.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub14.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub15.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub16.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub17.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub18.txt",
                "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Splitted-By-Protocol/vless.txt",
            ]
        }
        else {
            var configs = [settingVibe["config"] == "auto" ? "https://raw.githubusercontent.com/ALIILAPRO/v2rayNG-Config/main/sub.txt" : settingVibe["config"]];
            let config = settingVibe["config"];
            if (config.startsWith("vless") || config.startsWith("vmess") || config.startsWith("trojan") || config.startsWith("ss") || config.startsWith("hysteria") || config.startsWith("shadowtls") || config.startsWith("tuic") || config.startsWith("socks") || config.startsWith("wireguard") || config.startsWith("hy2")) {
                write_file(path.join(__dirname, "config.txt"), btoa(unescape(encodeURIComponent(settingVibe["config"]))));
                configs = [`"${path.join(__dirname, "config.txt")}"`];
            }
        }
        for (var config of configs) {
            ResetArgsVibe(config);
            Run("HiddifyCli.exe", argsVibe, "admin", core = "vibe");
            settingVibe["status"] = true;
            StatusGuard = true;
            await setTimeout(settingWarp["timeOutVibe"] ?? 60000);
            await testProxy();
            if (settingVibe["status"] == true) {
                if (await testProxy()) {
                    trackEvent("connected-vibe");
                    ConnectedVibe();
                    break;
                }
                else {
                    Showmess(5000, "Next Config...");
                    if (settingWarp["core"] == "auto") {
                        connectAuto(number + 1, mode = 'try');
                    }
                }
            }
            else break;
        }
    }
    else {
        settingVibe["status"] = false;
        StatusGuard = false;
        console.log("Diconnecting Vibe...")
        disconnectVPN();
        saveSetting();
    }
};
async function timeout(promise, ms) {
    const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('Timeout exceeded')), ms);
    });

    return Promise.race([promise, timeoutPromise]);
};
async function connectWarp(num = 0, mode = 'normal') {
    if (document.getElementById("ChangeStatus").style.borderColor == "#15ff00") {
        offProxy();
        if (process.platform == "win32") {
            exec("taskkill /F /IM warp-plus.exe");
            exec("taskkill /F /IM HiddifyCli.exe");
        }
        else {
            exec("pkill -f warp-plus");
            exec("pkill -f Hiddify-Cli");
        }
        disconnectVPN();
        testProxy();
        SetBorderColor("ChangeStatus", "");
        return;
    }
    if (settingWarp["core"] == "auto" & !StatusGuard) {
        console.log("Starting warp server on Auto mode...")
        StatusGuard = true;
        if (sect === "main") {
            SetAnim("ChangeStatus", "Connect 7s infinite");
        }
        Run("warp-plus.exe", argsWarp, settingWarp["tun"] ? "admin" : "user", "warp");
        await setTimeout(settingWarp["timeOutWarpAuto"] ?? 45000);
        console.log("Start Testing warp...")
        if (await testProxy() && StatusGuard == true) {
            Showmess(5000, "Connected Warp");
            trackEvent("connected-warp-auto");
            if (sect === "main") {
                SetAnim("ChangeStatus", "Load");
                SetBorderColor("ChangeStatus", "#15ff00");
            }
        }
        else {
            console.log("trying warp...");
            StatusGuard = false;
            settingVibe["status"] = false
            connectAuto(number + 1, mode = 'try'); // Increment the connection attempt number
        }

    }
    else if (!StatusGuard && settingWarp["core"] == "warp") {
        console.log("Stating warp server on warp mode...")
        if (sect === "main") {
            SetAnim("ChangeStatus", "Connect 7s infinite");
        }

        // Start warp plus
        Run("warp-plus.exe", argsWarp, settingWarp["tun"] ? "admin" : "user", "warp");
        StatusGuard = true;
        await testProxy();
        console.log("Start Testing Warp...");
        await setTimeout(settingWarp["timeOutWarp"] ?? 60000);
        if (await testProxy()) {
            Showmess(5000, "Connected Warp");
            trackEvent("connected-warp");
            ConnectedWarp();
            if (sect === "main") {
                SetAnim("ChangeStatus", "Load");
                SetBorderColor("ChangeStatus", "#15ff00");
            }
        } else {
            console.log("Connection failed, trying again...");
            if (settingWarp["core"] == "auto") {
                connectAuto(number + 1, mode = 'try'); // Increment the connection attempt number
            }
        }

    } else {
        if (sect === "main") {
            SetAnim("ChangeStatus", "Connect 7s ease-in-out");
            SetAttr("ChangeStatus", "style", "border-color:;");
        }

        if (process.platform === "linux") {
            exec(`bash ${path.join(__dirname, "assets", "bash", "reset_proxy-gn.sh")}`);
        } else {
            offProxy(settingWarp["proxy"]);
        }

        if (sect === "main") {
            SetAnim("ChangeStatus", "Connect 5s");
        }

        global.setTimeout(() => {
            if (sect === "main") {
                SetAnim("ChangeStatus", "");
            }
        }, 600);
        StatusGuard = false;
        disconnectVPN();
    }
}

// #endregion
// #region Reset Args
function ResetArgsVibe(config = settingVibe["config"]) {
    argsVibe = [];
    argsVibe.push("run");
    config = settingVibe["config"];
    if (config.startsWith("vless") || config.startsWith("vmess") || config.startsWith("trojan") || config.startsWith("ss") || config.startsWith("hysteria") || config.startsWith("shadowtls") || config.startsWith("tuic") || config.startsWith("socks") || config.startsWith("wireguard") || config.startsWith("hy2")) {
        write_file(path.join(__dirname, "config.txt"), btoa(unescape(encodeURIComponent(settingVibe["config"]))));
        config = `"${path.join(__dirname, "config.txt")}"`;
    }
    argsVibe.push("--config " + config);
    if (settingVibe["fragment"] & settingVibe["fragment-size"] != "") {
        argsVibe.push("--fragment");
        argsVibe.push(settingVibe["fragment-size"]);
    }
    if (settingVibe["dns-direct"] != "") {
        argsVibe.push("--dns-direct");
        argsVibe.push(settingVibe["dns-direct"]);
    }
    if (settingVibe["dns-remote"] != "") {
        argsVibe.push("--dns-remote");
        argsVibe.push(settingVibe["dns-remote"]);
    }
    if (settingVibe["tun"]) {
        argsVibe.push("--tun");
    } else argsVibe.push("--system-proxy");
};
setInterval(() => {
    Onloading();
}, 5000);
async function saveSetting() {
    // Save setting vibe & setting warp In freedom-guard.json
    try {
        write_file("freedom-guard.json", JSON.stringify({
            "vibe": settingVibe,
            "warp": settingWarp,
            "links": links,
            "configsVibeLink": configsVibeLink,
            "configsVibeName": configsVibeName,
            "importedServers": importedServers
        }));
    }
    catch { };
    ResetArgsVibe();
    ResetArgsWarp();
};
read_file = function (path) {
    return fs.readFileSync(path, 'utf8');
}
write_file = function (path, output) {
    fs.writeFileSync(path, output);
}
function ResetArgsWarp() {
    argsWarp = [];
    if (settingWarp["gool"]) {
        argsWarp.push("--gool");
    }
    if (settingWarp["scan"]) {
        argsWarp.push("--scan");
    }
    if (settingWarp["cfon"] && settingWarp["cfonc"] != "IR" && settingWarp["cfonc"] != "") {
        argsWarp.push("--cfon");
        argsWarp.push(settingWarp["cfonc"]);
    }
    if (settingWarp["endpoint"] != "") {
        argsWarp.push("--endpoint");
        argsWarp.push(settingWarp["endpoint"]);

    }
    if (settingWarp["ipver"] != "" && settingWarp["ipver"] != 4) {
        argsWarp.push("-" + settingWarp["ipver"]);
    }
    if (settingWarp["warpkey"] != "") {
        argsWarp.push("--key");
        argsWarp.push(settingWarp["warpkey"]);

    }
    if (settingWarp["scanrtt"] != "") {
        argsWarp.push("--rtt");
        argsWarp.push(settingWarp["scanrtt"] + "s");
    }
    if (settingWarp["verbose"]) {
        argsWarp.push("--verbose");
    }
    if (settingWarp["cache"] != "") {
        argsWarp.push("--cache-dir");
        argsWarp.push(settingWarp["cache"]);
    }
    if (settingWarp["wgconf"] != "") {
        argsWarp.push("--wgconf");
        argsWarp.push(settingWarp["wgconf"]);
    }
    if (settingWarp["config"] != "") {
        argsWarp.push("--config");
        argsWarp.push(settingWarp["config"]);
    }
    if (settingWarp["reserved"]) {
        argsWarp.push("--reserved");
    }
    if (settingWarp["dns"] != "") {
        argsWarp.push("--dns");
        argsWarp.push(settingWarp["dns"]);
    }
    if (settingWarp["tun"]) {
        argsWarp.push("--tun-experimental");
    };
    if (settingWarp["proxy"] != "127.0.0.1:8086" & settingWarp["proxy"] != "") {
        argsWarp.push("--bind");
        argsWarp.push(settingWarp["proxy"]);
    }
};
// #endregion

module.exports = {
    connectVibe,
    connectWarp,
    settingVibe,
    settingWarp,
    AssetsPath,
    testProxy,
    testproxyStat: testproxystat,
    countryIP: countryIP,
    filterBypassStat: filterBypassStat,
    ResetArgsVibe,
    ResetArgsWarp,
    StatusGuard: StatusGuard,
    disconnectVibe: disconnectVPN,
    saveSetting,
    connectAuto,
    KillProcess,
    changeISP,
    connect,
    ConnectedVibe,
    FindBestEndpointWarp,
    setProxy,
    offProxy,
    Onloading,
    links,
    RefreshLinks,
    NotifApp,
    getWarpKey,
    disconnectVPN
};
// Onloading
Onloading();
RefreshLinks();
// End Code
