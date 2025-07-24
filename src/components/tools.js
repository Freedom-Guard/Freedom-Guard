const { spawn, exec, execFile, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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
            this.prepareCores();
        }
    }
    async testSystemCompatibility() {
        const vibePath = path.join(this.coresPath, "vibe", this.addExt("vibe-core"));
        const warpPath = path.join(this.coresPath, "warp", this.addExt("warp-core"));
        const report = {
            os: process.platform,
            arch: process.arch,
            coresPath: this.coresPath,
            coresExist: {
                vibe: fs.existsSync(vibePath),
                warp: fs.existsSync(warpPath)
            },
            execTest: {
                vibe: { success: false, output: "", error: "" },
                warp: { success: false, output: "", error: "" }
            },
            runTest: {
                vibe: { success: false, exitCode: null, output: "", error: "" },
                warp: { success: false, exitCode: null, output: "", error: "" }
            },
            dnsTest: { success: false },
            proxyTest: { success: false },
            proxyOS: this.returnOS(),
            timestamp: Date.now()
        };

        if (report.coresExist.vibe) {
            try {
                const out = this.execSync(`"${vibePath}" -v`, { timeout: 3000 }).toString();
                report.execTest.vibe.success = true;
                report.execTest.vibe.output = out.trim();
            } catch (err) {
                report.execTest.vibe.error = err.message;
            }
            try {
                const vibeProcess = spawn(vibePath, ["run", "--config", vibePath], { timeout: 5000 });
                let output = "", error = "";
                vibeProcess.stdout.on("data", (data) => output += data.toString());
                vibeProcess.stderr.on("data", (data) => error += data.toString());
                const exitCode = await new Promise((resolve) => {
                    vibeProcess.on("close", (code) => resolve(code));
                    setTimeout(() => { try { vibeProcess.kill(); } catch { } }, 5000);
                });
                report.runTest.vibe.success = true;
                report.runTest.vibe.output = output.trim();
                report.runTest.vibe.error = error.trim();
                report.runTest.vibe.exitCode = exitCode;
            } catch (err) {
                report.runTest.vibe.error = err.message;
            }
        }

        if (report.coresExist.warp) {
            try {
                const out = this.execSync(`"${warpPath}" --version`, { timeout: 3000 }).toString();
                report.execTest.warp.success = true;
                report.execTest.warp.output = out.trim();
            } catch (err) {
                report.execTest.warp.error = err.message;
            }
            try {
                const warpProcess = spawn(warpPath, [], { timeout: 5000 });
                let output = "", error = "";
                warpProcess.stdout.on("data", (data) => output += data.toString());
                warpProcess.stderr.on("data", (data) => error += data.toString());
                const exitCode = await new Promise((resolve) => {
                    warpProcess.on("close", (code) => resolve(code));
                    setTimeout(() => { try { warpProcess.kill(); } catch { } }, 5000);
                });
                report.runTest.warp.success = true;
                report.runTest.warp.output = output.trim();
                report.runTest.warp.error = error.trim();
                report.runTest.warp.exitCode = exitCode;
            } catch (err) {
                report.runTest.warp.error = err.message;
            }
        }

        try {
            this.setDNS("1.1.1.1", "8.8.8.8", report.proxyOS);
            this.setDNS("", "", report.proxyOS);
            report.dnsTest.success = true;
        } catch (e) {
            report.dnsTest.success = false;
        }
        try {
            this.setProxy(report.proxyOS, "127.0.0.1:8086");
            this.offProxy(report.proxyOS);
            report.proxyTest.success = true;
        } catch (e) {
            report.proxyTest.success = false;
        }

        return report;
    }

    donateCONFIG(config) {
        if (typeof window !== 'undefined' && window.donateCONFIG) {
            window.donateCONFIG(config);
        } else {
            this.log("window.donateCONFIG is not defined.");
        }
    }
}

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
module.exports = {
    Tools,
    writeFile,
    readFile,
    getConfigPath
}