import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupEventSub } from './twitch.js'
import fs from 'fs';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = 3000;
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CFG_FILE = path.join(__dirname, 'configs.json');
let alertConfigs = {};

// carrega arquivo inicial se existir
if (fs.existsSync(CFG_FILE)) {
  try { alertConfigs = JSON.parse(fs.readFileSync(CFG_FILE, 'utf-8')); }
  catch (e) { console.error("Erro lendo configs.json:", e); }
}

app.use(express.static(path.join(__dirname, '../overlay')));

app.use("/configs", express.json());

// rota configs
app.get("/configs", (req, res) => res.json(alertConfigs));

app.post("/configs", (req, res) => {
  console.log("📩 Recebi configs:", req.body);
  alertConfigs = req.body || {};
  fs.writeFileSync(CFG_FILE, JSON.stringify(alertConfigs, null, 2), "utf-8");
  io.emit("update-configs", alertConfigs);
  res.json({ success: true });
});

// rota eventsub SEM json, só raw
app.post('/twitch/eventsub', express.raw({ type: 'application/json' }), (req, res) => {
  const type = req.headers['twitch-eventsub-message-type'];
  const rawBody = req.body instanceof Buffer ? req.body.toString() : JSON.stringify(req.body);

  if (type === 'webhook_callback_verification') {
    const body = JSON.parse(rawBody);
    return res.status(200).send(body.challenge);
  }

  if (type === 'notification') {
    const body = JSON.parse(rawBody);
    console.log('Evento recebido:', body.event);
    io.emit('twitch-event', body.event);
  }

  res.status(200).end();
});

// Socket.IO
io.on('connection', socket => {
  console.log('socket connect:', socket.id);
  socket.emit('update-configs', alertConfigs);

  // opcional: para debug, permitir client enviar evento que rebroadcasta
  socket.on('send-twitch-event', (evt) => {
    io.emit('twitch-event', evt);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Servidor Express rodando na porta http://localhost:${PORT}`);
  // 👉 cria as assinaturas assim que o servidor sobe

  // setupEventSub();
});