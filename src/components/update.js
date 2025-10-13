const fs = require('fs').promises;
const fsSync = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const { shell, ipcRenderer } = require('electron');
const { getConfigPath } = require("./tools");

async function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fsSync.createWriteStream(destPath);
        const request = https.get(url, (response) => {
            if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
                const redirectUrl = response.headers.location;
                if (!redirectUrl) {
                    reject(new Error('Redirect بدون location'));
                    return;
                }
                file.close();
                return downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
            }

            if (response.statusCode !== 200) {
                reject(new Error(`دانلود ناموفق. Status: ${response.statusCode}`));
                return;
            }

            const total = parseInt(response.headers['content-length'], 10) || 0;
            let downloaded = 0;
            let lastPercent = 0;

            response.on('data', (chunk) => {
                downloaded += chunk.length;
                if (total) {
                    const percent = Math.floor((downloaded / total) * 100);
                    if (percent >= lastPercent + 0.1) {
                        lastPercent = percent;
                        $('#progress-bar').css({ width: `${percent}%` }).text(`${percent}%`);
                    }
                } else {
                    $('#progress-bar').css({ width: '100%' }).text('در حال دانلود...');
                }
            });

            response.pipe(file);

            file.on('finish', () => {
                file.close(() => resolve());
            });
        });

        request.on('error', (err) => {
            fsSync.unlink(destPath, () => { });
            reject(err);
        });

        file.on('error', (err) => {
            fsSync.unlink(destPath, () => { });
            reject(err);
        });
    });
}

async function isFileLocked(filePath) {
    try {
        await fs.access(filePath, fsSync.constants.R_OK | fsSync.constants.W_OK);
        return false;
    } catch (err) {
        return true;
    }
}

async function handleDownload(url) {
    const fileName = path.basename(url);
    const userDataPath = getConfigPath();
    const filePath = path.join(userDataPath, fileName);

    await fs.mkdir(userDataPath, { recursive: true }).catch(() => { });
    $('#progress-container').css("display", "flex");
    $('#progress-bar').css({ width: '0%' }).text('0%');

    try {
        await downloadFile(url, filePath);

        if (await isFileLocked(filePath)) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            if (await isFileLocked(filePath)) {
                await fs.unlink(filePath);
                throw new Error('فایل قفل شده و حذف شد.');
            }
        }

        await fs.access(filePath, fsSync.constants.R_OK);

        await shell.openPath(filePath);

        $('#box-notif').hide();

        setTimeout(() => {
            ipcRenderer.send('exit-app');
        }, 3000);
    } catch (err) {
        window.showMessageUI(`خطا: ${err.message}`);
        if (await fs.access(filePath).catch(() => false)) {
            await fs.unlink(filePath).catch(() => { });
        }
        throw err;
    } finally {
        $('#progress-container').css("display", "none");
    }
}

async function checkForUpdate(currentVersion) {
    try {
        const response = await fetch('https://raw.githubusercontent.com/Freedom-Guard/Freedom-Guard/main/config/desktop.json', { timeout: 10000000 });
        if (!response.ok) {
            throw new Error(`خطا در دریافت داده: ${response.status}`);
        }
        const data = await response.json();
        const remoteVersion = data.version;
        const isUpdateAvailable = currentVersion.localeCompare(remoteVersion, undefined, { numeric: true }) < 0;

        if (!isUpdateAvailable) {
            window.showMessageUI('نسخه شما به‌روز است.');
            return;
        }

        const buttons = [
            {
                text: 'دانلود و نصب آخرین نسخه',
                action: async () => {
                    const platform = process.platform;
                    const fileExtension = platform === 'win32' ? 'freedom-guard-win-x64.exe' :
                        platform === 'linux' ? 'freedom-guard-linux-x86_64.AppImage' :
                            'freedom-guard-mac-x64.dmg';
                    const url = `https://github.com/Freedom-Guard/Freedom-Guard/releases/latest/download/${fileExtension}`;
                    await handleDownload(url);
                }
            },
            {
                text: 'باز کردن وبسایت',
                action: () => window.open(data.url, '_blank')
            },
            {
                text: 'انصراف',
                action: () => $('#box-notif').hide()
            }
        ];

        window.showModal(data.messText || 'نسخه جدید موجود است. آیا مایل به بروزرسانی هستید؟', buttons);
    } catch (err) {
        window.showMessageUI(`خطا در بررسی آپدیت: ${err.message}`);
    }
}

async function cleanupOldFiles() {
    const userDataPath = getConfigPath();
    const files = await fs.readdir(userDataPath).catch(() => []);
    for (const file of files) {
        if (file.includes('freedom-guard')) {
            const filePath = path.join(userDataPath, file);
            if (!(await isFileLocked(filePath))) {
                await fs.unlink(filePath).catch(() => { });
            } else {
                await new Promise(resolve => setTimeout(resolve, 2000));
                if (!(await isFileLocked(filePath))) {
                    await fs.unlink(filePath).catch(() => { });
                }
            }
        }
    }
}

module.exports = { checkForUpdate, cleanupOldFiles };