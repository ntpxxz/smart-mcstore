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
    private getProxyAgent(url: string) {
        const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
        const noProxy = process.env.NO_PROXY || '';

        // Simple NO_PROXY check
        const targetHost = new URL(url).hostname;
        const isExcluded = noProxy.split(',').some(p => p.trim() === targetHost || targetHost.endsWith('.' + p.trim()));

        if (!proxyUrl || isExcluded) {
            if (isExcluded) console.log(`⏩ Bypassing proxy for: ${targetHost}`);
            return null;
        }

        try {
            const { HttpsProxyAgent } = require('https-proxy-agent');
            console.log(`🌐 Using proxy: ${proxyUrl.replace(/:[^:@]+@/, ':***@')} for ${targetHost}`);

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

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const fetchOptions: any = {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...(process.env.PBASS_API_TOKEN && {
                        'Authorization': `Bearer ${process.env.PBASS_API_TOKEN}`
                    })
                },
                signal: controller.signal,
            };

            // Add proxy agent if available
            const agent = this.getProxyAgent(url);
            if (agent) {
                // @ts-ignore - Node.js specific
                fetchOptions.agent = agent;
            }

            const response = await fetch(url, fetchOptions);

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`PBASS API returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Handle different response formats
            let records: PBASSInvoiceRecord[] = [];

            if (Array.isArray(data)) {
                records = data;
            } else if (data.data && Array.isArray(data.data)) {
                records = data.data;
            } else if (data.records && Array.isArray(data.records)) {
                records = data.records;
            } else {
                console.warn('⚠️ Unexpected PBASS API response format:', data);
                records = [];
            }

            console.log(`✅ Fetched ${records.length} records from PBASS API`);

            return {
                success: true,
                data: records,
                count: records.length,
            };

        } catch (error: any) {
            console.error('❌ PBASS API Error:', error);

            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: `Request timeout after ${this.timeout}ms`,
                };
            }

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
