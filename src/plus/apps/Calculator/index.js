function append(text) {
    if (document.getElementById("display").value == "Syntax Error") {
        document.getElementById("display").value = "";
    }
    document.getElementById("display").value += text;
    var inputField = document.getElementById('display');
    var length = inputField.value.length;
    inputField.style.fontSize = (length > 8 ? (35 / (length / 100)) + '%' : '4rem');
}
function CloseToPlus() {
    try {
    const ipc = require('electron').ipcRenderer;
        ipc.send("load-file","./plus/index.html");
    }
    catch {}
}
function calculate() {
    try {
        document.getElementById("display").value = eval(document.getElementById("display").value);
    }
    catch {
        document.getElementById("display").value = "Syntax Error"
    }
    var inputField = document.getElementById('display');
    var length = inputField.value.length;
    inputField.style.fontSize = (length > 8 ? (35 / (length / 100)) + '%' : '4rem');
}
function clearDisplay() {
    document.getElementById("display").value = "";
}
document.getElementById("back").addEventListener("click", function () {
    CloseToPlus();
})