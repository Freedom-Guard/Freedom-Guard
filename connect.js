
// Start Code
// #region Libraries
__dirname = __dirname.replace("app.asar", "")
const geoip = require('geoip-lite');
const versionapp = "1.3.0";
const ipc = require('electron').ipcRenderer;
const { trackEvent } = require('@aptabase/electron/renderer');
const { spawn, exec } = require("child_process");
const { config } = require('process');
const Winreg = require('winreg');
// #endregion
// #region Functions
var childProcess = null;
function KillProcess(core = "warp") {
    if (childProcess != null) {
        if (process.platform === 'win32') {
            exec('taskkill /IM ' + (core == "warp" ? "warp-plus.exe" : "HiddifyCli.exe") + ' /F /T'); // Windows
        } else {
            childProcess.kill('SIGTERM'); // POSIX systems
        };
        childProcess.kill();
        childProcess = null;
    }
};
function changeISP(newisp) {
    console.log("NEW ISP IS: " + newisp)
    settingWarp["isp"] = newisp;
    saveSetting();
    Onloading();
};
async function Run(nameFile, args, runa, core) {
    console.log("Runing New Process...");
    KillProcess(core = core);
    console.log(path.join(__dirname, "main", "cores", core, nameFile) + " " + args);
    var exePath = `"${path.join(__dirname, "main", "cores", core, nameFile)}"`; // Adjust the path to your .exe file
    if (process.platform == "linux") {
        exePath = `"${path.join(__dirname, "main", "cores", core, nameFile.replace(".exe", ""))}"`; // Adjust the path to your .exe file
        exec("chmod +x " + exePath);
        if (runa == "admin") {
            childProcess = spawn(exePath, args, { shell: true, runAsAdmin: true });
        } else childProcess = spawn(exePath, args, { shell: true, runAsAdmin: true });
    }
    else {
        if (runa == "admin") {
            childProcess = spawn(exePath, args, { shell: true, runAsAdmin: true });
        } else childProcess = spawn(exePath, args, { shell: true, runAsAdmin: true });
    }
    childProcess.stdout.on('data', async (data) => {
        console.log(`stdout: ${data}`);
        if (data.toString().includes("serving proxy")) {
            if (process.platform == "linux" && !settingWarp["tun"]) {
                exec("bash " + path.join(__dirname, "assets", "bash", "set_proxy.sh") + ` ${settingWarp["proxy"].replace(":", " ")}`);
                if (await testProxy()) {
                    ConnectedWarp();
                }
            }
            else if (process.platform == "win32" && !settingWarp["tun"]) {
                console.log("set proxy");
                setProxy(settingWarp["proxy"]);
                if (await testProxy()) {
                    ConnectedWarp();
                }
            }
        }
        else if (data.toString().includes("CORE STARTED:")) {
            if (await testProxy()) {
                ConnectedVibe();
            }
        }
    });
    childProcess.stderr.on('data', async (data) => {
        if (data instanceof Buffer) {
            data = data.toString(); // Convert Buffer to string
        }
        console.error(`stderr: ${data}`);
        if (data.toString().includes("serving proxy")) {
            if (process.platform == "linux" && !settingWarp["tun"]) {
                exec("bash " + path.join(__dirname, "assets", "bash", "set_proxy.sh") + ` ${settingWarp["proxy"].replace(":", " ")}`);
                if (await testProxy()) {
                    ConnectedWarp();
                }
            }
            else if (process.platform == "win32" && !settingWarp["tun"]) {
                console.log("set proxy");
                setProxy(settingWarp["proxy"]);
                if (await testProxy()) {
                    ConnectedWarp();
                }
            }
        }
        else if (data.toString().includes("CORE STARTED:")) {
            ConnectedVibe();
        }
    });
    childProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        if ((StatusGuard || settingVibe["status"]) & settingWarp["core"] == "auto") {
            sect == "main" ? connectAuto(number + 1) : disconnectVPN("");
        }
        else if (settingVibe["config"] != "auto") {
            sect == "main" ? disconnectVPN(mode = "try") : disconnectVPN();
        }
    });
};
function isValidURL(url) {
    const regex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(\/[^\s]*)?$/;
    return regex.test(url);
};
function FindBestEndpointWarp(type = 'find') {
    console.log("Finding Best Endpoint For Warp ....");
    if (process.platform == "linux") {
        sect == "main" ? Loading(100, "Searching Endpoint ...") : ("");
        alert("Scanner IP Endpoint not support in linux");
        return;
    }
    if (settingWarp["ipver"] == "") settingWarp["ipver"] = 4;
    Run("win_scanner.bat", ["-" + settingWarp["ipver"]], "admin", "scanner");
    if (type != "conn") {
        sect == "main" ? Showmess(15000, "Searching Endpoint ...") : ("");
    }
    childProcess.on('exit', () => {
        sect == "main" ? SetValueInput("end-point-address", read_file(path.join(__dirname, "main", "cores", "scanner", "bestendpoint.txt"))).trim() : ("");
        OnEvent("end-point-address", "change");
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
    });
};
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};
async function testProxy() {
    console.log("Testing Proxy...");
    var startTime = Date.now();
    try {
        const testConnection = await axios.get('https://api.ipify.org?format=json', {
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
                return `<img src="${path.join(__dirname, "svgs", countryIP.toLowerCase() + ".svg")}" width="40rem" style='margin:1rem'>`
            } else {
                return '❓';
            }
        }
        var countryEmoji = getCountryFromIP(testConnection.data.ip);
        sect == "main" ? SetHTML("ip-ping-vibe", "" + countryEmoji + testConnection.data.ip + " | <b>" + pingTime + "</b>") : ("");
        sect == "main" ? SetHTML("ip-ping-warp", "" + countryEmoji + testConnection.data.ip + " | <b>" + pingTime + "</b>") : ("");
        testproxystat = true;
        try {
            var testBypass = await axios.get('https://x.com', {
                timeout: 5000, // Timeout in ms
            });
            console.log("Fliternet Bypassed");
            filterBypassStat = true;
            ConnectedVibe("warp");
            return true;
        }
        catch {
            filterBypassStat = false;
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
    try {
        // Restore var settingWarp  from json
        settingWarp = JSON.parse(read_file("warp.json"));
    }
    catch {
        saveSetting()
    }
    try {
        settingVibe = JSON.parse(read_file("vibe.json")); // Load Setting From File.json 
        configsVibeName = JSON.parse(read_file("configsVibeName.json")); // Load Setting From File.json 
        configsVibeLink = JSON.parse(read_file("configsVibeLink.json")); // Load Setting From File.json 
    }
    catch {
        saveSetting();
    }
    if (settingVibe["config"] == "") {
        settingVibe["config"] = "auto";
    }
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
    sect == "main" ? SetBorderColor("ChangeStatus", "#15ff00") : ("");
    if (stat == "normal") {
        sect == "main" ? Showmess(5000, "🚀!Connected To Vibe!🚀") : ("");
        trackEvent("connected-vibe");
    }
    settingVibe["status"] = true;
    StatusGuard = true;
    RefreshLinks();
}
function ConnectedWarp(stat = "normal") {
    console.log("Connected Warp");
    // function runed when the proxy is connected
    sect == "main" ? SetAttr("changeStatus-vibe", "style", "box-shadow:0px 0px 50px 10px rgba(98, 255, 0, 0.7);") : ("")
    sect == "main" ? SetAttr("changeStatus-vibe", "style", "animation:;") : ("")
    sect == "main" ? SetHTML("status-vibe-conn", "🚀 Connected") : ('');
    sect == "main" ? SetAnim("ChangeStatus", "null !important") : ("");
    sect == "main" ? SetBorderColor("ChangeStatus", "#15ff00") : ("");
    if (stat == "normal") {
        sect == "main" ? Showmess(5000, "🚀!Connected To Warp!🚀") : ("");
        trackEvent("connected-warp");
    }
    StatusGuard = true;
}
function disconnectVPN() {
    // function runed when the proxy is disconnected
    //Kill the HiddifyCli.exe process
    StatusGuard = false;
    settingVibe["status"] = false;
    console.log("Disconnecting VPN");
    KillProcess(core = "warp");
    KillProcess(core = "vibe");
    if (process.platform == "linux") {
        exec("pkill HiddifyCli");
    }
    else {
        exec("taskkill /IM " + "HiddifyCli.exe" + " /F");
    }
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
        exec("bash " + path.join(__dirname, "assets", "bash", "reset_proxy.sh"));
    }
    else {
        offProxy(settingWarp["proxy"]);
    };
    sect == "main" ? SetAnim("ChangeStatus", "Connect 5s") : ("");
    setTimeout(() => {
        sect == "main" ? SetAnim("ChangeStatus", "") : ("");
    }, 3500);
}
async function connect(core = 'warp', config = 'auto', os = process.platform, num) {
    if (core == "warp") await connectWarp(num);
    else if (core == "vibe") await connectVibe(num);
    else if (core == "auto") await connectAuto(num);
}
var number = 0
function RefreshLinks() {
    reqRefreshLinks = new XMLHttpRequest();
    reqRefreshLinks.open('GET', settingWarp["configfg"], true);
    reqRefreshLinks.onload = function () {
        if (reqRefreshLinks.status >= 200 && reqRefreshLinks.status < 400) {
            links = JSON.parse(reqRefreshLinks.responseText);
            console.log("Links Refreshed");
        } else {
            console.log("Error Refreshing Links");
        }
    }
    reqRefreshLinks.send();
}
async function connectAuto(num = 0) {
    number = num;
    RefreshLinks();
    console.log("ISP IS " + settingWarp["isp"] + " | Start Auto Server");
    if (settingWarp["isp"] == "MCI") {
        if (links["MCI"].lenght <= num) { disconnectVPN(); return true };
        const configType = links["MCI"][num].split(",")[0];
        if (configType == "warp") {
            settingWarp[links["MCI"][num].split(",")[1]] = links["MCI"][num].split(",")[2] == "true" ? true : links["MCI"][num].split(",")[2];
        } else if (configType == "vibe") {
            settingVibe["config"] = links["MCI"][num].split(",")[1];
        }
        ResetArgsVibe();
        ResetArgsWarp();
        await connect(configType, num = num);
    }
    else if (settingWarp["isp"] == ("IRANCELL")) {
        if (links["IRANCELL"].lenght <= num) { disconnectVPN(); return true };
        const configType = links["IRANCELL"][num].split(",")[0];
        if (configType == "warp") {
            settingWarp[links["IRANCELL"][num].split(",")[1]] = links["IRANCELL"][num].split(",")[2] == "true" ? true : links["IRANCELL"][num].split(",")[2];
        } else if (configType == "vibe") {
            settingVibe["config"] = links["IRANCELL"][num].split(",")[1];
        }
        ResetArgsVibe();
        ResetArgsWarp();
        await connect(configType, num = num);
    }
    else {
        if (links["other"].lenght <= num) { disconnectVPN(); return true };
        const configType = links["other"][num].split(",")[0];
        if (configType == "warp") {
            settingWarp[links["other"][num].split(",")[1]] = links["other"][num].split(",")[2] == "true" ? true : links["other"][num].split(",")[2];
        } else if (configType == "vibe") {
            settingVibe["config"] = links["other"][num].split(",")[1];
        }
        ResetArgsVibe();
        ResetArgsWarp();
        await connect(configType, num = num);
    }
}
async function connectVibe(num = number) {
    console.log("Start Vibe Server");
    // this is For Connect To Freedom-Vibe
    if (settingVibe["status"] == false) {
        KillProcess("vibe");
        if (process.platform == "linux") {
            exec("bash " + path.join(__dirname, "assets", "bash", "reset_proxy.sh"));
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
            var configs = [settingVibe["config"]];
            if (settingVibe["config"].startsWith("vless") || settingVibe["config"].startsWith("vmess") || settingVibe["config"].startsWith("trojan") || settingVibe["config"].startsWith("shadowsocks")) {
                write_file(path.join(__dirname, "config", "config.txt"), btoa(unescape(encodeURIComponent(settingVibe["config"]))));
                configs = [path.join(__dirname, "config", "config.txt")];
            }
        }
        for (var config of configs) {
            ResetArgsVibe(config);
            Run("HiddifyCli.exe", argsVibe, "admin", core = "vibe");
            await sleep(25000);
            settingVibe["status"] = true;
            if (settingVibe["status"] == true) {
                await sleep(5000);
                if (await testProxy()) {
                    ConnectedVibe();
                    break;
                }
                else {
                    Showmess(5000, "Next Config...");
                    if (settingWarp["core"] == "auto") {
                        connectAuto(num + 1);
                    }
                }
            }
            else break;
        }
    }
    else {
        settingVibe["status"] = false;
        disconnectVPN();
    }
};
async function connectWarp(num) {
    // Function Connect To Warp
    console.log("Start Warp Server");
    if (StatusGuard == false) {
        sect == "main" ? SetAnim("ChangeStatus", "Connect 7s infinite") : ("");
        // Start warp plus
        Run("warp-plus.exe", argsWarp, (settingWarp["tun"]) ? "admin" : "user", "warp");
        // Set System Proxy
        testProxy();
        StatusGuard = true;
        await sleep(10000);
        if (await testProxy() == true) {
            Showmess(5000, "Connected Warp");
            trackEvent("connected-warp");
            sect == "main" ? SetAnim("ChangeStatus", "Load") : ("");
            sect == "main" ? SetBorderColor("ChangeStatus", "#15ff00") : ("");
        }
        else {
            console.log("try again");
            if (StatusGuard == true) {
                Onloading();
                if (settingWarp["core"] == "auto") {
                    connectAuto(number + 1);
                } else {
                    FindBestEndpointWarp("conn");
                    Showmess(5000, "Finding Endpoint Warp ...")
                }
            }
            else {
                console.log("failed");
                disconnectVPN()
            }
        }
    } else {
        sect == "main" ? SetAnim("ChangeStatus", "Connect 7s ease-in-out") : ("");
        sect == "main" ? SetAttr("ChangeStatus", "style", "border-color:;") : ("");
        if (process.platform == "linux") {
            exec("bash " + path.join(__dirname, "assets", "bash", "reset_proxy.sh"));
        }
        else {
            offProxy(settingWarp["proxy"]);
        };
        sect == "main" ? SetAnim("ChangeStatus", "Connect 5s") : ("");
        setTimeout(() => {
            sect == "main" ? SetAnim("ChangeStatus", "") : ("");
            StatusGuard = false;
        }, 3500);
        disconnectVPN()
    }
};
// #endregion
// #region Reset Args
function ResetArgsVibe(config = "auto") {
    argsVibe = [];
    argsVibe.push("run");
    argsVibe.push("--config");
    argsVibe.push(config);
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
}, 500);
async function saveSetting() {
    // Save setting vibe & setting warp In vibe.json & warp.json
    try {
        write_file("vibe.json", JSON.stringify(settingVibe));
        write_file("warp.json", JSON.stringify(settingWarp));
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
    if (settingWarp["proxy"] != "127.0.0.1:8086" & settingWarp["proxy"] != "") {
        argsWarp.push("--bind");
        argsWarp.push(settingWarp["proxy"]);
    }
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
};
// #endregion
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
    reserved: "",
    dns: "",
    tun: false,
    startup: "warp",
    isp: "other",
    core: "auto",
    "configfg": "https://raw.githubusercontent.com/fwldom/Freedom-Guard/main/config/links.json"
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
var links = {
    MCI: {
        0: "vibe,https://raw.githubusercontent.com/yebekhe/TVC/main/subscriptions/xray/normal/mix",
        1: "vibe,https://raw.githubusercontent.com/ALIILAPRO/v2rayNG-Config/main/sub.txt",
        2: "vibe,https://raw.githubusercontent.com/AzadNetCH/Clash/main/AzadNet_META_IRAN-Direct.yml",
        3: "vibe,https://raw.githubusercontent.com/ircfspace/warpsub/main/export/warp",
        4: "vibe,https://raw.githubusercontent.com/yebekhe/TelegramV2rayCollector/main/sub/base64/mix",
        5: "vibe,https://raw.githubusercontent.com/yebekhe/TVC/main/subscriptions/xray/base64/vless",
        lenght: 6
    },
    IRANCELL: {
        0: "warp,auto,true",
        1: "warp,gool,true",
        2: "vibe,https://raw.githubusercontent.com/yebekhe/TVC/main/subscriptions/xray/normal/mix",
        3: "warp,endpoint,engage.cloudflareclient.com:2408",
        4: "vibe,https://raw.githubusercontent.com/AzadNetCH/Clash/main/AzadNet_META_IRAN-Direct.yml",
        5: "warp,scan,true",
        6: "vibe,https://raw.githubusercontent.com/ircfspace/warpsub/main/export/warp",
        7: "warp,reserved,true",
        lenght: 8
    },
    other: {
        0: "warp,auto",
        1: "warp,endpoint,engage.cloudflareclient.com:2408",
        2: "vibe,https://raw.githubusercontent.com/yebekhe/TVC/main/subscriptions/xray/normal/mix",
        3: "warp,gool,true",
        4: "warp,reserved,true",
        5: "vibe,https://raw.githubusercontent.com/AzadNetCH/Clash/main/AzadNet_META_IRAN-Direct.yml",
        6: "vibe,https://raw.githubusercontent.com/ircfspace/warpsub/main/export/warp",
        lenght: 7
    }
}
//#endregion
Onloading();
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
    Onloading
};
// End Code
