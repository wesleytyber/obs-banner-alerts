import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import fs from "fs";
import { setupEventSub } from "./twitch.js"; // seu módulo de EventSub adaptado
import dotenv from "dotenv";
dotenv.config();


// === CONFIGURAÇÃO BÁSICA ===
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = 8080;

// Twitch OAuth e EventSub
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = `https://isabell-collisional-climatically.ngrok-free.dev/auth/callback`;
const SCOPES = [
  "user:read:follows",
  "channel:read:subscriptions",
  "bits:read",
  "channel:read:goals"
].join(" ");

// Arquivos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CFG_FILE = path.join(__dirname, "configs.json");

// Estado
let alertConfigs = {};
let session = null; // guarda accessToken, broadcasterId e dados do usuário

// Carrega configs existentes
if (fs.existsSync(CFG_FILE)) {
  try {
    alertConfigs = JSON.parse(fs.readFileSync(CFG_FILE, "utf-8"));
  } catch (e) {
    console.error("Erro lendo configs.json:", e);
  }
}

// === MIDDLEWARES ===
app.use(express.json());

// === ROTAS ===

// Página inicial
app.get("/", (req, res) => {
  console.log("session =", session);
  if (!session) {
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=code&scope=${encodeURIComponent(SCOPES)}`;
    console.log("🔗 Redirecionando para login da Twitch:", authUrl);
    return res.redirect(authUrl);
  }
  res.sendFile(path.join(__dirname, "../overlay/index.html"));
});


app.use(express.static(path.join(__dirname, "../overlay")));

// Configs
app.get("/configs", (req, res) => res.json(alertConfigs));

app.post("/configs", (req, res) => {
  alertConfigs = req.body || {};
  fs.writeFileSync(CFG_FILE, JSON.stringify(alertConfigs, null, 2), "utf-8");
  io.emit("update-configs", alertConfigs);
  console.log("📩 Configs atualizadas:", alertConfigs);
  res.json({ success: true });
});

// OAuth callback
app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Nenhum code recebido");

  try {
    // 1️⃣ Troca code por User Access Token
    const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI
      })
    });
    const tokenData = await tokenRes.json();

    // 2️⃣ Pega dados do usuário
    const userRes = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-ID": CLIENT_ID,
        "Authorization": `Bearer ${tokenData.access_token}`
      }
    });
    const userData = await userRes.json();
    const BROADCASTER_ID = userData.data[0].id;

    // 3️⃣ Guarda sessão do usuário
    session = {
      accessToken: tokenData.access_token, // Token do usuário
      broadcasterId: BROADCASTER_ID,
      user: userData.data[0]
    };

    // 4️⃣ Obter App Access Token para EventSub
    const appTokenRes = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`,
      { method: "POST" }
    );
    const appTokenData = await appTokenRes.json();
    const APP_ACCESS_TOKEN = appTokenData.access_token;

    // 5️⃣ Cria assinaturas EventSub usando App Access Token
    await setupEventSub(
      APP_ACCESS_TOKEN, // ⚠️ App token aqui
      session.broadcasterId,
      CLIENT_ID,
      `${REDIRECT_URI.replace("/auth/callback", "")}/twitch/eventsub`,
      CLIENT_SECRET
    );

    res.send(`
  <html>
    <head>
      <meta charset="UTF-8">
      <title>Assinaturas Criadas</title>
      <style>
        body, html {
          height: 100%;
          margin: 0;
          display: flex;
          justify-content: center; /* centraliza horizontal */
          align-items: center;     /* centraliza vertical */
          font-family: Arial, sans-serif;
          text-align: center;
          background-color: #f5f5f5;
        }
        h3 {
          margin-bottom: 20px;
        }
        a {
          text-decoration: none;
          color: #007bff;
          font-weight: bold;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div>
        <h3>Assinaturas criadas para ${session.user.display_name} ✅</h3>
        <a href="/config.html">Voltar ao overlay</a>
      </div>
    </body>
  </html>
`);

  } catch (err) {
    console.error("Erro no callback:", err);
    res.status(500).send("Erro no fluxo OAuth.");
  }
});


// === FUNÇÕES DE EVENTSUB ===
function verifyTwitchSignature(req, secret) {
  const messageId = req.headers["twitch-eventsub-message-id"];
  const timestamp = req.headers["twitch-eventsub-message-timestamp"];
  const signature = req.headers["twitch-eventsub-message-signature"];
  const hmacMessage = messageId + timestamp + req.body;
  const hmac =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(hmacMessage).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

// EventSub route
app.post(
  "/twitch/eventsub",
  express.raw({ type: "application/json" }),
  (req, res) => {
    // if (!verifyTwitchSignature(req, CLIENT_SECRET)) {
    //   console.warn("⚠️ Assinatura inválida recebida!");
    //   return res.status(403).end();
    // }

    const type = req.headers["twitch-eventsub-message-type"];
    const rawBody =
      req.body instanceof Buffer ? req.body.toString() : JSON.stringify(req.body);

    if (type === "webhook_callback_verification") {
      const body = JSON.parse(rawBody);
      return res.status(200).send(body.challenge);
    }

    if (type === "notification") {
      const body = JSON.parse(rawBody);
      console.log("Evento recebido:", body.event);
      io.emit("twitch-event", body.event);
    }

    res.status(200).end();
  }
);

// === SOCKET.IO ===
io.on("connection", (socket) => {
  console.log("socket connect:", socket.id);
  socket.emit("update-configs", alertConfigs);

  // debug manual
  socket.on("send-twitch-event", (evt) => {
    io.emit("twitch-event", evt);
  });
});

// === START SERVER ===
httpServer.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
