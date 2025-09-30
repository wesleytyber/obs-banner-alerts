import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 3000;

// 🔑 Coloque aqui os dados do seu app da Twitch Dev Console
const CLIENT_ID = '4h443y1p4msavh3k1o2a1uzz5s3033';
const CLIENT_SECRET = "xn2saeen701sz5n1upj3aptoifpkia";
const REDIRECT_URI = `http://localhost:${PORT}/auth/callback`;

const SCOPES = [
    "user:read:follows",           // para seguidores
    "channel:read:subscriptions",  // para subs
    "bits:read",                   // para bits
    "channel:read:goals"           // para metas do canal
].join(" ");


// Passo 1: link de autorização
app.get("/", (req, res) => {
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
    )}&response_type=code&scope=${encodeURIComponent(SCOPES)}`;

    res.send(`
    <h2>Twitch OAuth</h2>
    <p><a href="${authUrl}" target="_blank">Clique aqui para autorizar na Twitch</a></p>
  `);
});

// Passo 2: callback da Twitch com o code
app.get("/auth/callback", async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).send("Nenhum code recebido");
    }

    try {
        // Passo 3: trocar o code pelo token
        const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
                grant_type: "authorization_code",
                redirect_uri: REDIRECT_URI,
            }),
        });

        const tokenData = await tokenResponse.json();
        console.log("🎉 Token recebido:", tokenData);

        res.send(`
      <h3>Token de acesso gerado com sucesso!</h3>
      <pre>${JSON.stringify(tokenData, null, 2)}</pre>
      <p>Confira também no terminal.</p>
    `);
    } catch (err) {
        console.error("Erro ao trocar o code pelo token:", err);
        res.status(500).send("Erro ao gerar token.");
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log("➡ Abra no navegador para iniciar o fluxo de login.");
});
