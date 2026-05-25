// server.js - WebSocket backend for arras multiboxing
const WebSocket = require('ws');
const msgpack = require('msgpack-lite');

const wss = new WebSocket.Server({ port: 8082 });
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);
    
    ws.on('message', (data) => {
        try {
            const packet = msgpack.decode(new Uint8Array(data));
            const [type, ...args] = packet;
            
            // Handle handshake
            if (type === 'M' && args[0] === 72011) {
                ws.send(msgpack.encode(['M', args[0] ^ 845]));
                console.log('Handshake verified');
                return;
            }
            
            // Handle config/auth
            if (type === 'C') {
                console.log('Config received');
                return;
            }
            
            // Handle spawn commands (Z = tank type array, F = hash)
            if (type === 'Z' || type === 'F') {
                console.log(`Command ${type}:`, args);
                // Forward to bots or handle logic here
                return;
            }
            
            // Handle kill command
            if (type === 'B') {
                console.log('Kill all bots command');
                return;
            }
            
            // Handle position updates from parent
            if (type === 'A') {
                // [px, py, mwx, mwy, lmb, rmb, ...]
                // Forward to connected bot tabs
                for (const client of clients) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(msgpack.encode(packet));
                    }
                }
            }
            
        } catch (e) {
            console.error('Packet error:', e);
        }
    });
    
    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected');
    });
});

console.log('✅ WebSocket server running on port 8082');