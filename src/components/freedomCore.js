const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const https = require("https");
const { getConfigPath } = require("./tools");

class FreedomCore {
    async fetchAndInstall() {
        const destDir = getConfigPath();
        const FcoreURL =
            "https://github.com/Freedom-Guard/Freedom-Core/releases/latest/download/" +
            (process.platform === "win32"
                ? "freedom-core-windows-x64.exe"
                : "freedom-core-linux-x64");
        const FcorePath = path.join(destDir, "fcore", this.addExt("freedom-core"));

        fs.mkdirSync(path.dirname(FcorePath), { recursive: true });

        if (!fs.existsSync(FcorePath)) {
            window.showMessageUI("Starting download...");
            await this.downloadFile(FcoreURL, FcorePath);
            window.showMessageUI("Download finished. Installing...");
            if (process.platform === "linux") fs.chmodSync(FcorePath, 0o755);
        }

        window.showMessageUI("Launching Freedom Core...");
        ipcRenderer.send("run-core", FcorePath);
        window.showMessageUI("Freedom Core STARTED, back to website");
    }

    addExt(name) {
        return process.platform === "win32" ? `${name}.exe` : name;
    }

    async downloadFile(url, destPath) {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(destPath);

            const request = https.get(url, (response) => {
                if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
                    const redirectUrl = response.headers.location;
                    if (!redirectUrl) {
                        reject(new Error(`Redirect without location for '${url}'`));
                        return;
                    }
                    file.close();
                    return this.downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download '${url}'. Status: ${response.statusCode}`));
                    return;
                }

                const total = parseInt(response.headers["content-length"], 10);
                let downloaded = 0;
                let lastPercent = 0;

                response.on("data", (chunk) => {
                    downloaded += chunk.length;
                    if (total) {
                        const percent = Math.floor((downloaded / total) * 100);
                        if (percent >= lastPercent + 10) {
                            lastPercent = percent - (percent % 10);
                            window.showMessageUI(`Downloading... ${lastPercent}%`);
                        }
                    }
                });

                response.pipe(file);

                file.on("finish", () => {
                    file.close(() => resolve());
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
}

module.exports = { FreedomCore };
