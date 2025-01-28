function append(text) {
    const display = document.getElementById("display");

    if (display.value === "Syntax Error") {
        display.value = "";
    }
    display.value += text;

    const length = display.value.length;
    display.style.fontSize = length > 8 ? `${Math.max(2, 35 / (length / 100))}%` : '4rem';
}

function closeToPlus() {
    try {
        const { ipcRenderer } = require('electron');
        const path = require('path');
        ipcRenderer.send("load-file", path.join("src", "plus/index.html"));
    } catch (error) {
        console.error("Error loading plus/index.html:", error);
    }
}

function calculate() {
    const display = document.getElementById("display");

    try {
        display.value = eval(display.value);
    } catch {
        display.value = "Syntax Error";
    }

    const length = display.value.length;
    display.style.fontSize = length > 8 ? `${Math.max(2, 35 / (length / 100))}%` : '4rem';
}

function clearDisplay() {
    document.getElementById("display").value = "";
}

function handleKeyPress(event) {
    const key = event.key;
    const validKeys = '0123456789+-*/.()';

    if (validKeys.includes(key)) {
        append(key);
    } else if (key === 'Enter') {
        calculate();
    } else if (key === 'Backspace') {
        const display = document.getElementById("display");
        display.value = display.value.slice(0, -1);
        const length = display.value.length;
        display.style.fontSize = length > 8 ? `${Math.max(2, 35 / (length / 100))}%` : '4rem';
    } else if (key === 'Escape') {
        clearDisplay();
    }
}

document.getElementById("back").addEventListener("click", closeToPlus);

document.addEventListener("keydown", handleKeyPress);