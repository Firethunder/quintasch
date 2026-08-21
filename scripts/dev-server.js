const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

function getLocalIpAddresses() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(iface.address);
            }
        }
    }
    return ips;
}

const server = http.createServer((req, res) => {
    // URL normalisieren & Query-Strings abschneiden
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/' || reqUrl === '') {
        reqUrl = '/index.html';
    } else if (reqUrl === '/favicon.ico') {
        reqUrl = '/icons/icon-192.png';
    }

    // Dateipfad auflösen & Path Traversal verhindern
    const safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(ROOT_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(`404 Not Found: ${reqUrl}`);
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        // Dev-Cache Header deaktivieren
        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    const localIps = getLocalIpAddresses();
    console.log(`\n======================================================`);
    console.log(`🚀 Quintasch Dev-Server läuft!`);
    console.log(`======================================================`);
    console.log(`💻 Lokal am PC:`);
    console.log(`   ➔ Dashboard:  http://localhost:${PORT}/index.html`);
    console.log(`   ➔ Controller: http://localhost:${PORT}/controller.html`);
    console.log(`   ➔ JGA-Special: http://localhost:${PORT}/controller.html?jga=1`);
    
    if (localIps.length > 0) {
        console.log(`\n📱 Auf dem Smartphone im selben WLAN:`);
        localIps.forEach(ip => {
            console.log(`   ➔ Controller: http://${ip}:${PORT}/controller.html`);
            console.log(`   ➔ JGA-Link:   http://${ip}:${PORT}/controller.html?jga=1`);
        });
    }
    console.log(`======================================================\n`);
});
