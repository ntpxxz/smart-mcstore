
const http = require('http');

function get(url, token) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: { 'Authorization': `Bearer ${token}` }
        };
        http.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

async function probe() {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyaWQiOiJCUFRKODI1IiwiZGl2aXNpb24iOiJUMjcxRE0iLCJhcGluYW1lIjoiSU5WSU5DT00iLCJleHAiOjE3Nzg3MzExNzcsImlzcyI6IkRFViIsImF1ZCI6Imh0dHA6Ly9kZXZfZGVtby5jb20ifQ.fo6IsIX7PB1ZHt47MubtzoJAIGZBpA8nCDwWeCobb28";
    const baseUrl = "http://wbp5.bp.minebea.local/PBASS_API/INVINCOM/A35BP/T271DM";

    const tests = [
        "ALL/ALL/ALL/TESTINV/ALL/ALL/ALL"
    ];

    for (const t of tests) {
        try {
            console.log(`Testing: ${t}`);
            const result = await get(`${baseUrl}/${t}`, token);
            console.log('Result:', result);
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }
    }
}

probe();
