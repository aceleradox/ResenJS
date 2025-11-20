// server.js — RevoJS com aprovação de música

const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const PLAYLIST_DIR = path.join(__dirname, "playlists");
if (!fs.existsSync(PLAYLIST_DIR)) fs.mkdirSync(PLAYLIST_DIR);

const rooms = {}; // memória das salas

// --------------------------------------------
// CLI: remover playlist
// --------------------------------------------
if (process.argv[2] === "remove") {
  const room = process.argv[3];
  if (!room) {
    console.log("Uso: node server.js remove <room>");
    process.exit(0);
  }

  console.log(`Removendo playlist da sala '${room}' ...`);

  const dir = path.join(PLAYLIST_DIR, room);
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(f => fs.unlinkSync(path.join(dir, f)));
    fs.rmdirSync(dir);
  }

  if (rooms[room]) delete rooms[room];

  console.log("Playlist removida.");
  process.exit(0);
}

// --------------------------------------------
// Criar sala se não existir
// --------------------------------------------
function ensureRoom(room) {
  if (!rooms[room]) {
    rooms[room] = {
      playlist: [],
      index: 0
    };
  }
  return rooms[room];
}

// --------------------------------------------
// Extrair ID do YouTube
// --------------------------------------------
function extractYouTubeID(u) {
  if (!u) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(u)) return u;

  try {
    const url = new URL(u);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "");
    }

    if (url.hostname.includes("youtube.com")) {
      if (url.searchParams.get("v")) return url.searchParams.get("v");
      return url.pathname.split("/").pop();
    }
  } catch {}

  return null;
}

// --------------------------------------------
// Salvar playlist no disco
// --------------------------------------------
function savePlaylist(room) {
  const r = rooms[room];
  const dir = path.join(PLAYLIST_DIR, room);

  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  r.playlist.forEach((item, i) => {
    fs.writeFileSync(
      path.join(dir, `${i}.json`),
      JSON.stringify(item, null, 2)
    );
  });

  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const i = Number(f.split(".")[0]);
    if (i >= r.playlist.length) fs.unlinkSync(path.join(dir, f));
  });
}

// ----------------------------------------------------
// FILA DE APROVAÇÃO DE MÚSICAS
// ----------------------------------------------------
let approvalQueue = [];
let approving = false;

function processApprovalQueue() {
  if (approving || approvalQueue.length === 0) return;

  approving = true;
  const req = approvalQueue.shift(); // { socket, room, url, id }

  const { socket, room, url, id } = req;

  rl.question(
    `Pedido de música na sala "${room}":\n${url}\nAprovar? (s/n): `,
    answer => {
      if (answer.toLowerCase() === "s") {
        const r = ensureRoom(room);

        r.playlist.push({ url, id });
        savePlaylist(room);

        io.to(room).emit("playlist", r.playlist);

        if (r.playlist.length === 1) {
          io.to(room).emit("now", id);
        }

        socket.emit("addResult", { ok: true });
        console.log("Música aprovada.\n");
      } else {
        socket.emit("addResult", { ok: false });
        console.log("Música recusada.\n");
      }

      approving = false;
      processApprovalQueue();
    }
  );
}

// --------------------------------------------
// Socket.IO
// --------------------------------------------
io.on("connection", socket => {
  console.log("Cliente conectado.");

  socket.on("join", room => {
    const r = ensureRoom(room);
    socket.join(room);

    socket.emit("playlist", r.playlist);
    socket.emit("now", r.playlist[r.index]?.id || null);

    console.log(`Entrou na sala ${room}`);
  });

  // ----------------------------------------
  // AQUI A APROVAÇÃO DE MÚSICA
  // ----------------------------------------
  socket.on("add", ({ room, url }) => {
    const id = extractYouTubeID(url);
    if (!id) return;

    approvalQueue.push({ socket, room, url, id });
    processApprovalQueue();

    console.log(`[PEDIDO] ${url} (aguardando aprovação)`);
  });

  // ----------------------------------------
  socket.on("remove", ({ room, index }) => {
    const r = ensureRoom(room);

    r.playlist.splice(index, 1);
    if (r.index >= r.playlist.length) r.index = r.playlist.length - 1;

    savePlaylist(room);
    io.to(room).emit("playlist", r.playlist);
  });

  socket.on("play", room => io.to(room).emit("play"));
  socket.on("pause", room => io.to(room).emit("pause"));

  socket.on("next", room => {
    const r = ensureRoom(room);
    if (r.index < r.playlist.length - 1) r.index++;
    io.to(room).emit("now", r.playlist[r.index]?.id || null);
  });

  socket.on("prev", room => {
    const r = ensureRoom(room);
    if (r.index > 0) r.index--;
    io.to(room).emit("now", r.playlist[r.index]?.id || null);
  });
});

// --------------------------------------------
// iniciar servidor
// --------------------------------------------
const PORT = 3000;
server.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);
