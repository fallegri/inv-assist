import * as WebSocket from 'ws';

export function setupWebSocket(wss: WebSocket.Server) {
    wss.on('connection', (ws) => {
        console.log('Cliente conectado a WebSocket');

        ws.on('message', (message) => {
            // En una implementación real con streaming:
            // Se parsearía el mensaje, pasaría al LLM y `onToken` retransmitiría usando ws.send()
            ws.send(JSON.stringify({ type: 'status', data: 'Conectado al stream de texto en español' }));
        });

        ws.on('close', () => {
            console.log('Cliente desconectado');
        });
    });
}
