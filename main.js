const { WebSocketServer } = require('ws');
const http = require('http');

const port = process.env.PORT || 8080;
const messageLog = [];
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    let html = `
        <html>
            <head>
                <title>Server Logs</title>
                <style>
                    body { background: #000; color: #0f0; font-family: monospace; padding: 20px; }
                    .log-entry { border-bottom: 1px solid #222; padding: 5px 0; }
                    .timestamp { color: #555; margin-right: 10px; }
                    .ip { color: #aaa; }
                </style>
                <meta http-equiv="refresh" content="5"> </head>
            <body>
                <h1>Server Logs</h1>
                <div id="logs">
                    ${messageLog.map(m => `
                        <div class="log-entry">
                            <span class="timestamp">[${m.time}]</span> <span class="ip">&lt;${m.sender}&gt;</span> ${m.text}
                        </div>
                    `).reverse().join('')}
                </div>
                <input id="message" placeholder="Type something...">
                <button onclick="send(document.getElementById('message'))">Send</button>
                <script>
                    function send() {
                        const input = document.getElementById('messageInput');
                        if (input.value.trim() !== "") {
                            socket.send(input.value);
                            input.value = "";
                        }
                    }
                </script>
            </body>
        </html>
    `;
    res.end(html);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ip === '::1') ip = '127.0.0.1';
    else if (ip.includes('::ffff:')) ip = ip.split(':').pop();
    const shortIp = ip;
    console.log(`Someone connected: ${shortIp}`);
    ws.on('message', (data) => {
        const message = data.toString();
        const broadcastMsg = `[${shortIp}] ${message}`;
        wss.clients.forEach((client) => {
            if (client.readyState === 1) client.send(broadcastMsg);
        });
        messageLog.push({
            text: message,
            sender: shortIp,
            time: new Date().toLocaleTimeString()
        });
    });
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
