const http = require('http');
const https = require('https');

const targets = [
    'http://10.120.10.72/PBASS_API/INVINCOM',
    'https://10.120.10.72/PBASS_API/INVINCOM'
];

async function check(url) {
    console.log(`Checking ${url}...`);
    const protocol = url.startsWith('https') ? https : http;
    return new Promise((resolve) => {
        const req = protocol.get(url, { timeout: 5000, rejectUnauthorized: false }, (res) => {
            console.log(`✅ ${url} -> Status: ${res.statusCode}`);
            resolve(true);
        });

        req.on('error', (err) => {
            console.log(`❌ ${url} -> Error: ${err.message} (${err.code})`);
            resolve(false);
        });

        req.on('timeout', () => {
            console.log(`❌ ${url} -> Timeout`);
            req.destroy();
            resolve(false);
        });
    });
}

async function main() {
    for (const url of targets) {
        await check(url);
    }
}

main();
