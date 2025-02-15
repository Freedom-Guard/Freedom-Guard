const fs = require('fs');
const axios = require('axios');
const path = require('path');
const https = require("https");
const ipc = require('electron').ipcRenderer;
__dirname = path.join(__dirname.replace("app.asar", ""));
fetch('listapps.json')
    .then(response => response.json())
    .then(data => {
        const appsList = document.getElementById('apps-list');
        const searchInput = document.getElementById('search');

        function displayApps(filteredApps) {
            appsList.innerHTML = '';
            for (let key in filteredApps) {
                const app = filteredApps[key];

                const appCard = document.createElement('div');
                appCard.classList.add('app-card');

                appCard.innerHTML = `
                    <img src="${app.icon}" alt="${app.name} Icon">
                    <h2>${app.name}</h2>
                    <p>${app.description}</p>
                `;
                appCard.addEventListener('click', () => {
                    runApp(app);
                });

                appsList.appendChild(appCard);
            }
        }
        displayApps(data);
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredApps = Object.keys(data)
                .filter(key => data[key].name.toLowerCase().includes(searchTerm))
                .reduce((res, key) => (res[key] = data[key], res), {});
            displayApps(filteredApps);
        });
        function runApp(app) {
            if (!fs.existsSync(path.join(__dirname, app.directory))) {
                fs.mkdirSync(path.join(__dirname, app.directory));
            };
            if (!fs.existsSync(path.join(__dirname, './apps'))) {
                fs.mkdirSync(path.join(__dirname, "./apps"));
            };
            var Files = [];
            for (let key in app["files"]) {
                Files[key] = app.files[key];
            }
            console.log(Files);
            downloadFiles(Files, app = app)
        }
    })
    .catch(error => console.error('Error loading apps:', error));


const downloadDialog = document.getElementById('download-dialog');
const downloadProgress = document.getElementById('download-progress');
const downloadStatus = document.getElementById('download-status');

function showDownloadDialog() {
    downloadDialog.style.display = 'flex';
}

function hideDownloadDialog() {
    downloadDialog.style.display = 'none';
}

async function checkAndDownloadFile(fileUrl, savePath) {
    return new Promise((resolve, reject) => {
        try {
            const file = fs.createWriteStream(savePath);
            https.get(fileUrl, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download file. Status code: ${response.statusCode}`));
                    return;
                }
                response.pipe(file);

                file.on("finish", () => {
                    file.close(() => {
                        console.log(`${savePath} Downloaded`);
                        resolve();
                    });
                });

                file.on("error", (err) => {
                    fs.unlink(savePath, () => reject(err));
                });
            }).on("error", (err) => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
}
async function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
read_file = function (path) {
    return fs.readFileSync(path, 'utf8');
};
write_file = function (path, output) {
    fs.writeFileSync(path, output);
};
function getFileNameFromUrl(url) {
    const parts = url.split('/');
    return parts[parts.length - 1];
}
async function downloadFiles(filesToDownload, app) {
    showDownloadDialog();

    let completed = 0;
    const totalFiles = filesToDownload.length;

    for (var file of filesToDownload) {
        console.log(file);
        await checkAndDownloadFile(file, path.join(__dirname, "./apps/", app.name, getFileNameFromUrl(file)));
        completed++;
        const progress = (completed / totalFiles) * 100;
        downloadProgress.value = progress;
        downloadStatus.innerText = `در حال دانلود: ${completed}/${totalFiles} فایل`;
        if (!fs.existsSync(path.join(__dirname, "./apps/", app.name, getFileNameFromUrl(file)))) {
            alert("Error Download Files Try Again");
            hideDownloadDialog();
            return;

        }
        if (completed === totalFiles) {
            downloadStatus.innerText = 'دانلود تکمیل شد!';
            setTimeout(() => {
                hideDownloadDialog();
                runApp(app);
            }, 1000);
        }
    }
}
function runApp(app) {
    if (fs.existsSync(path.join(__dirname, app.directory, "index.html")))
        ipc.send("load-file-plus", path.join(__dirname, app.directory, "index.html"));
    else alert("Error RUN APP")

}

function onLoad() {
}
onLoad();
function CloseToMain() {
    try {
        ipc.send("load-main-app");
    }
    catch { }
}
document.getElementById("back").addEventListener("click", function () {
    CloseToMain();
})