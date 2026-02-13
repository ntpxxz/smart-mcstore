import https from 'https';
import http from 'http';
import { URL as NodeURL } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * PBASS API Client
 * Handles communication with external PBASS API (cross-LAN) with Proxy support
 */

interface PBASSInvoiceRecord {
    PLAC?: string;
    DIVI?: string;
    VENDOR?: string;
    VENDOR_NAME?: string;
    PO_NO?: string;
    ITEM_NO?: string;
    ITEM_NAME?: string;
    SPEC?: string;
    DRAW?: string;
    PO_DATE?: string;
    DUE_DATE?: string;
    REPLY_DATE?: string;
    INV_DATE?: string;
    INV_NO?: string;
    REPLY_QTY?: string;
    REPLY_UNIT?: string;
    REPLY_UP?: string;
    REPLY_AMT?: string;
    REPLY_CUR?: string;
    STATUS?: string;
    REMARK?: string;
}

export interface PBASSResponse {
    success: boolean;
    data?: PBASSInvoiceRecord[];
    error?: string;
    count?: number;
}

class PBASSClient {
    private baseUrl: string;
    private timeout: number;
    private ignoreSSL: boolean;

    constructor() {
        this.baseUrl = process.env.PBASS_API_URL || '';
        this.timeout = parseInt(process.env.PBASS_API_TIMEOUT || '30000');
        this.ignoreSSL = process.env.PBASS_API_IGNORE_SSL === 'true';
    }

    /**
     * Get proxy agent if proxy is configured
     */
    private getProxyAgent() {
        const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

        if (!proxyUrl) {
            return null;
        }

        try {
            const { HttpsProxyAgent } = require('https-proxy-agent');
            console.log(`🌐 Using proxy: ${proxyUrl.replace(/:[^:@]+@/, ':***@')}`); // Hide password

            return new HttpsProxyAgent(proxyUrl, {
                rejectUnauthorized: !this.ignoreSSL
            });
        } catch (error) {
            console.error('⚠️ Failed to create proxy agent:', error);
            return null;
        }
    }

    /**
     * Fetch invoice data from PBASS API
     * @param filters Optional filters (e.g., date range, status)
     */
    async fetchInvoices(filters?: {
        startDate?: string;
        endDate?: string;
        status?: string;
        vendor?: string;
    }): Promise<PBASSResponse> {
        try {
            if (!this.baseUrl) {
                throw new Error('PBASS_API_URL is not configured');
            }

            // Build query parameters
            const params = new URLSearchParams();
            if (filters?.startDate) params.append('start_date', filters.startDate);
            if (filters?.endDate) params.append('end_date', filters.endDate);
            if (filters?.status) params.append('status', filters.status);
            if (filters?.vendor) params.append('vendor', filters.vendor);

            const url = params.toString()
                ? `${this.baseUrl}?${params.toString()}`
                : this.baseUrl;

            console.log('🔗 Fetching from PBASS API:', url);
            const parsedUrl = new NodeURL(url);
            const isHttps = parsedUrl.protocol === 'https:';
            const transport = isHttps ? https : http;

            const options: any = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...(process.env.PBASS_API_TOKEN && {
                        'Authorization': `Bearer ${process.env.PBASS_API_TOKEN}`
                    })
                },
                timeout: this.timeout,
            };

            if (isHttps) {
                options.rejectUnauthorized = !this.ignoreSSL;
            }

            // Add proxy agent if configured
            const agent = this.getProxyAgent();
            if (agent) {
                options.agent = agent;
                console.log('🌐 Using proxy agent');
            } else if (isHttps && this.ignoreSSL) {
                // Create custom agent to ignore SSL
                options.agent = new https.Agent({
                    rejectUnauthorized: false
                });
                console.log('🔓 SSL verification disabled');
            }

            return new Promise((resolve, reject) => {
                const req = transport.request(options, (res: any) => {
                    let data = '';

                    res.on('data', (chunk: any) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        try {
                            if (res.statusCode !== 200) {
                                reject(new Error(`PBASS API returned ${res.statusCode}: ${res.statusMessage}`));
                                return;
                            }

                            console.log('📦 PBASS API Raw Response (first 100 chars):', data.substring(0, 100));
                            // Write to file for debugging
                            try {
                                require('fs').writeFileSync('pbass_debug.json', data);
                                console.log('💾 Raw response saved to pbass_debug.json');
                            } catch (e) { }

                            let jsonData: any;
                            try {
                                jsonData = JSON.parse(data);
                                // If the response is a string containing JSON, parse it again
                                if (typeof jsonData === 'string') {
                                    console.log('ℹ️ Detected double-encoded JSON string, parsing again...');
                                    jsonData = JSON.parse(jsonData);
                                }
                            } catch (e) {
                                console.error('❌ Failed to parse PBASS API response:', e);
                                throw new Error('Invalid JSON response from PBASS API');
                            }

                            console.log('📦 JSON Keys found:', Object.keys(jsonData));

                            // Robust way to find records: search recursively for the largest array
                            const findLargestArray = (obj: any): any[] => {
                                if (Array.isArray(obj)) return obj;
                                if (!obj || typeof obj !== 'object') return [];

                                let largest: any[] = [];
                                for (const key in obj) {
                                    const value = obj[key];
                                    if (Array.isArray(value)) {
                                        if (value.length > largest.length) largest = value;
                                    } else if (value && typeof value === 'object') {
                                        const sub = findLargestArray(value);
                                        if (sub.length > largest.length) largest = sub;
                                    }
                                }
                                return largest;
                            };

                            const records = findLargestArray(jsonData);
                            console.log(`✅ Extracted ${records.length} records from response`);

                            if (records.length === 0) {
                                console.warn('⚠️ No array of records found in response structure:', jsonData);
                            }

                            console.log(`✅ Fetched ${records.length} records from PBASS API`);

                            resolve({
                                success: true,
                                data: records,
                                count: records.length,
                            });
                        } catch (error: any) {
                            reject(new Error(`Failed to parse response: ${error.message}`));
                        }
                    });
                });

                req.on('error', (error: any) => {
                    reject(error);
                });

                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error(`Request timeout after ${this.timeout}ms`));
                });

                req.end();
            });

        } catch (error: any) {
            console.error('❌ PBASS API Error:', error);

            // Provide more helpful error messages
            let errorMessage = error.message || 'Unknown error occurred';

            if (error.code === 'ENOTFOUND') {
                errorMessage = `DNS resolution failed for ${this.baseUrl}. Check network connectivity.`;
            } else if (error.code === 'ECONNREFUSED') {
                errorMessage = `Connection refused to ${this.baseUrl}. Server may be down or firewall blocking.`;
            } else if (error.code === 'ETIMEDOUT' || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
                errorMessage = `Connection timeout. Check proxy settings and network routing.`;
            } else if (error.code === 'ERR_INVALID_PROXY_URL') {
                errorMessage = `Invalid proxy URL. Check HTTPS_PROXY environment variable.`;
            } else if (error.message?.includes('407')) {
                errorMessage = `Proxy authentication required. Check proxy username/password.`;
            }

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Test connection to PBASS API
     */
    async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
        const startTime = Date.now();

        try {
            const result = await this.fetchInvoices();
            const latency = Date.now() - startTime;

            if (result.success) {
                return {
                    success: true,
                    message: `Connected successfully. Found ${result.count || 0} records.`,
                    latency,
                };
            } else {
                return {
                    success: false,
                    message: result.error || 'Connection failed',
                    latency,
                };
            }
        } catch (error: any) {
            const latency = Date.now() - startTime;
            return {
                success: false,
                message: error.message || 'Connection test failed',
                latency,
            };
        }
    }
}

// Export singleton instance
export const pbassClient = new PBASSClient();
export default pbassClient;
