// server1-proxy.js
// Run this on Server 1 (192.168.101.219 / 10.120.122.10)

const express = require('express');
const fetch = require('node-fetch');
const https = require('https');

const app = express();
const PORT = 3001;

// PBASS API Configuration
const PBASS_API_URL = 'https://10.120.10.72/PBASS_API/INVINCOM';

// Create HTTPS agent that ignores SSL errors
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

// Proxy endpoint
app.get('/api/pbass/invincom', async (req, res) => {
    try {
        console.log('📨 Received request from OneInv');

        // Get Authorization header from OneInv
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Authorization header required'
            });
        }

        // Build query parameters
        const queryParams = new URLSearchParams(req.query);
        const url = queryParams.toString()
            ? `${PBASS_API_URL}?${queryParams.toString()}`
            : PBASS_API_URL;

        console.log(`🔗 Forwarding to PBASS: ${url}`);

        // Forward request to PBASS API
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            agent: httpsAgent,
            timeout: 30000
        });

        if (!response.ok) {
            throw new Error(`PBASS API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        console.log(`✅ Received ${Array.isArray(data) ? data.length : 'unknown'} records from PBASS`);

        // Return data to OneInv
        res.json({
            success: true,
            data: data,
            count: Array.isArray(data) ? data.length : 0
        });

    } catch (error) {
        console.error('❌ Proxy Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PBASS Proxy running on http://192.168.101.219:${PORT}`);
    console.log(`📡 Forwarding requests to ${PBASS_API_URL}`);
});
