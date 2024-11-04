// index.js
const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const playButton = document.getElementById('playButton');
  const pauseButton = document.getElementById('pauseButton');
  const audioPlayer = document.getElementById('audioPlayer');

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
      audioPlayer.src = URL.createObjectURL(file);
    }
  });

  playButton.addEventListener('click', () => {
    audioPlayer.play();
  });

  pauseButton.addEventListener('click', () => {
    audioPlayer.pause();
  });
});
