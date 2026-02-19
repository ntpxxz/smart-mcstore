import prisma from './db';
import { pbassClient } from './pbass-client';

export interface SyncResult {
    success: boolean;
    added: number;
    skipped: number;
    errors: number;
    total: number;
    message: string;
    source: string;
}

export class SyncService {
    /**
     * Sync data from PBASS API to local database
     */
    async syncFromAPI(forceFullSync: boolean = false): Promise<SyncResult> {
        console.log('🔄 Attempting to sync from PBASS API...');

        const rawUrl = process.env.PBASS_API_URL || '';
        // If forceFullSync is true, use ALL/ALL, otherwise use rolling window for "Real-time/Fast"
        const dynamicUrl = this.getDynamicUrl(rawUrl, forceFullSync ? -1 : 30);

        console.log('📍 Original URL:', rawUrl);
        console.log('📍 Dynamic URL:', dynamicUrl);

        // Remove status: 'RECEIVE' as requested
        const apiResult = await pbassClient.fetchInvoices({
            customUrl: dynamicUrl
        });

        if (!apiResult.success || !apiResult.data) {
            console.warn('⚠️ API failed or returned no data');
            return {
                success: false,
                added: 0,
                skipped: 0,
                errors: 0,
                total: 0,
                message: apiResult.error || 'API failed or returned no data',
                source: 'API',
            };
        }

        const records = apiResult.data;
        console.log(`✅ Fetched ${records.length} records from PBASS API`);

        let addedCount = 0;
        let skippedCount = 0;
        let notRampDiverterCount = 0;
        let duplicateCount = 0;
        let errorCount = 0;

        // Optimized processing:
        console.log('🔍 Pre-filtering records...');
        const candidateRecords = records.filter(record => {
            // Get multiple fields to search for keywords
            const partName = (record.ITEM_NAME || (record as any).itemName || '').toString().toUpperCase();
            const partNo = (record.ITEM_NO || (record as any).itemNo || '').toString().toUpperCase();
            const spec = (record.SPEC || (record as any).spec || '').toString().toUpperCase();

            // Search for keywords in any of these fields
            const isRampOrDiverter =
                partName.includes('RAMP') || partName.includes('DIVERTER') ||
                partNo.includes('RAMP') || partNo.includes('DIVERTER') ||
                spec.includes('RAMP') || spec.includes('DIVERTER');

            if (!isRampOrDiverter) {
                notRampDiverterCount++;
                skippedCount++;
                return false;
            }

            // Status check removed as requested
            return true;
        });

        if (candidateRecords.length === 0 && records.length > 0) {
            console.warn(`⚠️ Warning: Found 0 matching parts in ${records.length} total records.`);
            console.log('💡 Sample part names from fetched data (first 5 unique):',
                [...new Set(records.slice(0, 100).map(r => r.ITEM_NAME || (r as any).itemName).filter(Boolean))].slice(0, 5)
            );
        }

        console.log(`⚡ Processing ${candidateRecords.length} candidate records...`);

        for (const record of candidateRecords) {
            try {
                // Normalize field names
                const po = record.PO_NO || (record as any).poNo || (record as any).PONo;
                const partNo = record.ITEM_NO || (record as any).itemNo || record.ITEM_NAME || 'N/A';
                const vendor = record.VENDOR_NAME || (record as any).vendorName || 'UNKNOWN';
                const partName = record.ITEM_NAME || (record as any).itemName || 'N/A';
                const qty = parseFloat(record.REPLY_QTY?.toString() || (record as any).replyQty?.toString() || '0') || 0;
                const invoiceNo = record.INV_NO || (record as any).invNo || 'N/A';

                const spec = record.SPEC || (record as any).spec;
                const drawingNo = record.DRAW || (record as any).draw;
                const unit = record.REPLY_UNIT || (record as any).replyUnit;
                const remark = record.REMARK || (record as any).remark;
                const taxInvoice = record.TAX_INVOICE || (record as any).taxInvoice;

                const plant = record.PLAC || (record as any).plac;
                const division = record.DIVI || (record as any).divi;
                const vendorCode = record.VENDOR || (record as any).vendorCode;
                const poDateStr = record.PO_DATE || (record as any).poDate;
                const unitPrice = parseFloat(record.REPLY_UP?.toString() || '0') || 0;
                const amount = parseFloat(record.REPLY_AMT?.toString() || '0') || 0;
                const currency = record.REPLY_CUR || (record as any).replyCur;

                const externalDate = record.INV_DATE || (record as any).invDate || record.DUE_DATE || (record as any).dueDate;

                if (!po) {
                    skippedCount++;
                    continue;
                }

                const parsedDueDate = this.parseDate(externalDate);
                const parsedPoDate = this.parseDate(poDateStr);

                // Check for duplicates
                const existing = await prisma.inboundTask.findUnique({
                    where: {
                        invoiceNo_partNo_vendor: {
                            invoiceNo: invoiceNo || '',
                            partNo: partNo || '',
                            vendor: vendor || 'UNKNOWN',
                        }
                    }
                });

                if (!existing) {
                    await prisma.inboundTask.create({
                        data: {
                            poNo: po,
                            vendor: vendor || 'UNKNOWN',
                            partNo,
                            partName: partName || 'N/A',
                            planQty: qty,
                            invoiceNo: invoiceNo || '',
                            dueDate: parsedDueDate,
                            status: 'ARRIVED',
                            spec,
                            drawingNo,
                            unit,
                            remark,
                            taxInvoice,
                            plant,
                            division,
                            vendorCode,
                            poDate: parsedPoDate,
                            unitPrice,
                            amount,
                            currency
                        }
                    });
                    addedCount++;
                } else {
                    if (existing.status === 'ARRIVED') {
                        await prisma.inboundTask.update({
                            where: { id: existing.id },
                            data: { dueDate: parsedDueDate }
                        });
                    }
                    duplicateCount++;
                    skippedCount++;
                }
            } catch (err) {
                console.error('Error processing record:', err);
                errorCount++;
            }
        }

        return {
            success: true,
            added: addedCount,
            skipped: skippedCount,
            errors: errorCount,
            total: records.length,
            message: candidateRecords.length === 0 && records.length > 0
                ? `📦 PBASS Sync Results:
                  ⚠️ Found ${records.length} records, but NO "Ramp" or "Diverter" parts matching.
                  
                  Please verify if the part names in PBASS system contain these keywords.`
                : `✨ Sync Completed Successfully
                  
                  ✅ Added New Items: ${addedCount}
                  ⏭️ Skipped/Duplicates: ${skippedCount}
                  
                  Breakdown:
                  • Non-matching Parts: ${notRampDiverterCount}
                  • Existing Records: ${duplicateCount}
                  • Data Errors: ${errorCount}`,
            source: 'API',
        };
    }

    private parseDate(dateStr: string): Date | null {
        if (!dateStr) return null;

        // Try DD/MM/YYYY
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const year = parseInt(parts[2]);
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) return date;
        }

        // Fallback to default
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
    }

    /**
     * Replaces date segments (YYYYMMDD) in URL with 'ALL/ALL' or a rolling window
     */
    private getDynamicUrl(url: string, daysLookback: number = 30): string {
        try {
            const dateRangeRegex = /\/(\d{8})\/(\d{8})\//;

            if (daysLookback === -1) {
                // Unlimited mode
                if (dateRangeRegex.test(url)) {
                    return url.replace(dateRangeRegex, '/ALL/ALL/');
                }
                return url;
            }

            // Real-time mode: use rolling window
            const now = new Date();
            const past = new Date();
            past.setDate(now.getDate() - daysLookback);

            const formatDate = (d: Date) => d.toISOString().split('T')[0].split('-').join('');
            const fromDate = formatDate(past);
            const toDate = formatDate(now);

            if (dateRangeRegex.test(url)) {
                return url.replace(dateRangeRegex, `/${fromDate}/${toDate}/`);
            }

            return url;
        } catch (error) {
            console.error('Error generating dynamic URL:', error);
            return url;
        }
    }
}

export const syncService = new SyncService();
export default syncService;
