let ws;
let twitchChatDiv;
let channel = "#canal"; // canal atual

function connectTwitchChat(canal, targetDivId) {
    channel = `#${canal}`;
    twitchChatDiv = document.getElementById(targetDivId);

    // Conecta como usuário anônimo
    ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

    ws.onopen = () => {
        console.log('✅ Conectado ao Twitch IRC (anon)');
        ws.send(`NICK justinfan${Math.floor(Math.random() * 10000)}`); // username aleatório anônimo
        ws.send(`JOIN ${channel}`);
    };

    ws.onmessage = (event) => {
        const msg = event.data;
        if (msg.includes('PING')) {
            ws.send('PONG :tmi.twitch.tv');
            return;
        }

        if (msg.includes('PRIVMSG')) {
            const user = msg.split('!')[0].substring(1);
            const message = msg.split('PRIVMSG')[1].split(':')[1];

            const msgEl = document.createElement('div');
            msgEl.className = 'chat-message';
            msgEl.innerHTML = `<strong>${user}:</strong> ${message}`;

            twitchChatDiv.appendChild(msgEl);
            twitchChatDiv.scrollTop = twitchChatDiv.scrollHeight;
        }
    };
}

// Apenas para leitura, sem enviar mensagens nem moderação
function sendMessage(text) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(`PRIVMSG ${channel} :${text}`);
    }
}
