// client.js — RevoJS (versão final e compatível com o servidor atual)

// Elementos
const joinBtn = document.getElementById("join");
const joinScreen = document.getElementById("join-screen");
const playerScreen = document.getElementById("player-screen");
const roomInput = document.getElementById("room");

let socket = null;
let currentRoom = null;
let player = null;
let playerReady = false;

/* -----------------------------------------
   1) JOIN — conectar e mostrar player
------------------------------------------ */
joinBtn.onclick = () => {
  const room = roomInput.value.trim();
  if (!room) return alert("Digite uma room!");

  currentRoom = room;
  socket = io();

  socket.emit("join", currentRoom);

  joinScreen.style.display = "none";
  playerScreen.style.display = "block";

  setupSocketEvents();
  loadYouTubeAPI();

  console.log("Entrou na sala:", currentRoom);
};

/* -----------------------------------------
   2) SOCKET.IO — Eventos
------------------------------------------ */
function setupSocketEvents() {

  socket.on("playlist", (list) => {
    renderPlaylist(list);
  });

  socket.on("now", (videoId) => {
    document.getElementById("now").innerHTML =
      `<strong>Now:</strong> ${videoId || "-"}`;

    if (!videoId) return;

    // Se o player ainda não está pronto, espera
    if (!playerReady) {
      const wait = setInterval(() => {
        if (playerReady) {
          clearInterval(wait);
          player.loadVideoById(videoId);
        }
      }, 200);
      return;
    }

    player.loadVideoById(videoId);
  });

  socket.on("play", () => {
    if (playerReady) player.playVideo();
  });

  socket.on("pause", () => {
    if (playerReady) player.pauseVideo();
  });
}

/* -----------------------------------------
   3) YouTube Player API
------------------------------------------ */
function loadYouTubeAPI() {
  if (window.YT) return createPlayer();

  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.body.appendChild(tag);

  window.onYouTubeIframeAPIReady = createPlayer;
}

function createPlayer() {
  player = new YT.Player("player", {
    height: "250",
    width: "100%",
    videoId: "",
    events: {
      onReady: () => {
        playerReady = true;
        console.log("Player YouTube pronto.");
      }
    }
  });
}

/* -----------------------------------------
   4) Botões
------------------------------------------ */
document.getElementById("add").onclick = () => {
  const url = document.getElementById("url").value.trim();
  if (!url) return;

  socket.emit("add", { room: currentRoom, url });
  document.getElementById("url").value = "";
};

document.getElementById("play").onclick = () => {
  socket.emit("play", currentRoom);
};

document.getElementById("pause").onclick = () => {
  socket.emit("pause", currentRoom);
};

document.getElementById("next").onclick = () => {
  socket.emit("next", currentRoom);
};

document.getElementById("prev").onclick = () => {
  socket.emit("prev", currentRoom);
};

/* -----------------------------------------
   5) Render da Playlist
------------------------------------------ */
function renderPlaylist(list) {
  const ol = document.getElementById("playlist");
  ol.innerHTML = "";

  list.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "playlist-item";

    li.innerHTML = `
      ${item.url}
      <button class="remove-btn" data-index="${index}">X</button>
    `;

    ol.appendChild(li);
  });

  // Eventos dos botões "X"
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.onclick = () => {
      const index = Number(btn.getAttribute("data-index"));
      socket.emit("remove", { room: currentRoom, index });
    };
  });
}
