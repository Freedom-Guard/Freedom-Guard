const { ipcRenderer } = require("electron");
const mm = require("music-metadata-browser");
const fs = require("fs");
const path = require("path");

let previousSongs = [];
const fileInput = document.getElementById("add-music-file");
const playButton = document.getElementById("playButton");
const audioPlayer = document.getElementById("audioPlayer");
const progressBar = document.getElementById("progressBar");
const volumeControl = document.getElementById("volumeControl");
const currentTimeLabel = document.getElementById("currentTime");
const totalTimeLabel = document.getElementById("totalTime");
const volumeLabel = document.getElementById("volumeLabel");
const albumArt = document.getElementById("album-art");
const artistName = document.getElementById("artist-name");
const songTitle = document.getElementById("song-title");
const previousSongsList = document.getElementById("previousSongsList");

let isPlaying = false;
let currentSongIndex = null;

// مسیر ذخیره‌سازی فایل‌های قبلی
const previousSongsFilePath = path.join(__dirname, "previousSongs.json");

// خواندن لیست آهنگ‌های قبلی
if (fs.existsSync(previousSongsFilePath)) {
  previousSongs = JSON.parse(fs.readFileSync(previousSongsFilePath, "utf8"));
  updatePreviousSongsList();
}

// انتخاب فایل جدید
fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  const filePath = file.path;
  audioPlayer.src = filePath;

  try {
    // استخراج متادیتا
    const metadata = await mm.parseBlob(file);
    const { title, artist } = metadata.common;
    const albumCover = metadata.common.picture ? metadata.common.picture[0] : null;

    // به‌روزرسانی اطلاعات آهنگ
    songTitle.textContent = title || "عنوان ناشناس";
    artistName.textContent = artist || "هنرمند ناشناس";

    const songData = {
      title: title || "عنوان ناشناس",
      artist: artist || "هنرمند ناشناس",
      url: filePath,
      albumCover: albumCover ? arrayBufferToBase64(albumCover.data) : null,
    };

    previousSongs.push(songData);
    updatePreviousSongsList();

    // نمایش کاور آلبوم
    if (albumCover) {
      const base64String = arrayBufferToBase64(albumCover.data);
      albumArt.src = `data:${albumCover.format};base64,${base64String}`;
    } else {
      albumArt.src = "Freedom_Player.png";
    }
  } catch (error) {
    console.error("خطا در خواندن متادیتا:", error);
    songTitle.textContent = "عنوان ناشناس";
    artistName.textContent = "هنرمند ناشناس";
    albumArt.src = "Freedom_Player.png";
  }

  audioPlayer.addEventListener("loadedmetadata", () => {
    totalTimeLabel.textContent = formatTime(audioPlayer.duration);
    progressBar.max = audioPlayer.duration;
  });
});

// پخش یا توقف آهنگ
playButton.addEventListener("click", () => {
  if (isPlaying) {
    audioPlayer.pause();
    playButton.innerHTML = "<i class='bx bx-play'></i>";
  } else {
    audioPlayer.play();
    playButton.innerHTML = "<i class='bx bx-pause'></i>";
  }
  isPlaying = !isPlaying;
});

// به‌روزرسانی زمان
audioPlayer.addEventListener("timeupdate", () => {
  currentTimeLabel.textContent = formatTime(audioPlayer.currentTime);
  progressBar.value = audioPlayer.currentTime;
});

// تغییر نوار پیشرفت
progressBar.addEventListener("input", (event) => {
  audioPlayer.currentTime = event.target.value;
});

// کنترل حجم صدا
volumeControl.addEventListener("input", (event) => {
  audioPlayer.volume = event.target.value;
  volumeLabel.textContent = Math.round(event.target.value * 100) + "%";
});

// تبدیل ArrayBuffer به Base64
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

// به‌روزرسانی لیست آهنگ‌ها
function updatePreviousSongsList() {
  fs.writeFileSync(previousSongsFilePath, JSON.stringify(previousSongs, null, 2));
  previousSongsList.innerHTML = "";
  previousSongs.forEach((song, index) => {
    const songElement = document.createElement("div");
    songElement.classList.add("previous-song");

    const albumArtElement = document.createElement("img");
    albumArtElement.src = song.albumCover
      ? `data:image/jpeg;base64,${song.albumCover}`
      : "Freedom_Player.png";
    songElement.appendChild(albumArtElement);

    const songInfoElement = document.createElement("p");
    songInfoElement.textContent = `${song.title} - ${song.artist}`;
    songElement.appendChild(songInfoElement);

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-button");
    deleteButton.textContent = "حذف";
    deleteButton.addEventListener("click", () => {
      deleteSong(index);
    });

    songElement.appendChild(deleteButton);
    songElement.addEventListener("click", () => {
      currentSongIndex = index;
      playSong(song);
    });

    previousSongsList.appendChild(songElement);
  });
}

// حذف آهنگ
function deleteSong(index) {
  previousSongs.splice(index, 1);
  updatePreviousSongsList();
  if (index === currentSongIndex) {
    audioPlayer.pause();
    songTitle.textContent = "عنوان ناشناس";
    artistName.textContent = "هنرمند ناشناس";
    albumArt.src = "Freedom_Player.png";
  }
}

// پخش آهنگ
function playSong(song) {
  audioPlayer.src = song.url;
  audioPlayer.play();
  songTitle.textContent = song.title;
  artistName.textContent = song.artist;

  if (song.albumCover) {
    albumArt.src = `data:image/jpeg;base64,${song.albumCover}`;
  }

  isPlaying = true;
  playButton.innerHTML = "<i class='bx bx-pause'></i>";

  audioPlayer.addEventListener("loadedmetadata", () => {
    totalTimeLabel.textContent = formatTime(audioPlayer.duration);
    progressBar.max = audioPlayer.duration;
  });
}

// فرمت زمان
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
document.getElementById("back").addEventListener("click", () => {
  try {
    const ipc = require('electron').ipcRenderer;
    ipc.send("load-file", path.join("src", "plus/index.html"));
  }
  catch { }
})