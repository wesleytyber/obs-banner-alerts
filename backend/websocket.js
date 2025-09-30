import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', ws => {
    console.log('Overlay conectado via WebSocket');
});

export function broadcastEvent(event) {
    const message = JSON.stringify(event);
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(message);
        }
    });
}
