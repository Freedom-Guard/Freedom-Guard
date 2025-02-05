let configAUTO = {
    "MCI": {

    },
    "PISHGAMAN": {

    },
    "IRANCELL": {

    },
    "other": {

    }
}
document.getElementById("add-config-btn").addEventListener("click", () => {
    let configValue = document.getElementById("config").value;
    let isp = document.getElementById("selector-isp-value").value;
    let core = document.getElementById("selector-core-value").value;
    if (configValue != "" && isp != "" && core != "") {
        configAUTO[isp] = core + ",;," + configValue;
    }
    document.getElementById('preview').innerHTML = JSON.stringify(configAUTO);
});
document.getElementById("download-config").addEventListener("click", () => {
    const fileName = "configAUTO.json";
    const jsonData = JSON.stringify(configAUTO, null, 4);
    if (window && window.process && window.process.type) {
        const { dialog } = require("electron");
        const fs = require("fs");
        const ipcRenderer = require("electron").ipcRenderer;
        ipcRenderer.send("export-settings", jsonData);
    } else {
        let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonData);
        let downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", fileName);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        document.body.removeChild(downloadAnchorNode);
    }
});
function closeToPlus() {
    try {
        const { ipcRenderer } = require('electron');
        const path = require('path');
        ipcRenderer.send("load-file", path.join("src", "plus/index.html"));
    } catch (error) {
        console.error("Error loading plus/index.html:", error);
    }
}
document.getElementById("back").addEventListener("click", closeToPlus);
