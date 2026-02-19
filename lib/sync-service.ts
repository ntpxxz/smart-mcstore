import prisma from './db.ts';
import { pbassClient } from './pbass-client.ts';

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
    async syncFromAPI(): Promise<SyncResult> {
        console.log('🔄 Attempting to sync from PBASS API...');
        console.log('📍 PBASS_API_URL:', process.env.PBASS_API_URL);

        const apiResult = await pbassClient.fetchInvoices();

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
        let errorCount = 0;

        for (const record of records) {
            try {
                // Normalize field names (API might return keys in different case/format)
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

                // New additional fields
                const plant = record.PLAC || (record as any).plac;
                const division = record.DIVI || (record as any).divi;
                const vendorCode = record.VENDOR || (record as any).vendorCode;
                const poDateStr = record.PO_DATE || (record as any).poDate;
                const unitPrice = parseFloat(record.REPLY_UP?.toString() || '0') || 0;
                const amount = parseFloat(record.REPLY_AMT?.toString() || '0') || 0;
                const currency = record.REPLY_CUR || (record as any).replyCur;

                // Use DUE_DATE as primary for system dueDate, fallback to INV_DATE
                const externalDate = record.DUE_DATE || (record as any).dueDate || record.INV_DATE || (record as any).invDate;

                if (!po) {
                    console.warn(`⏭️ Skipping record: Missing PO Number (Part: ${partNo})`);
                    skippedCount++;
                    continue;
                }

                if (partNo === 'N/A' && partName === 'N/A') {
                    console.warn(`⏭️ Skipping record: Missing Part Info (PO: ${po})`);
                    skippedCount++;
                    continue;
                }

                // Filter by Part Name: Only allow 'Ramp' and 'Diverter'
                const normalizedPartName = partName.trim().toUpperCase();
                const allowedPartNames = ['RAMP', 'DIVERTER'];

                if (!allowedPartNames.includes(normalizedPartName)) {
                    // console.log(`Skipping record with Part Name: ${partName}`);
                    skippedCount++;
                    continue;
                }

                const parsedDueDate = this.parseDate(externalDate);
                const parsedPoDate = this.parseDate(poDateStr);

                // Check for duplicates
                const existing = await prisma.inboundTask.findFirst({
                    where: {
                        poNo: po,
                        partNo,
                        invoiceNo,
                        vendor
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
                    console.log(`✨ Added new task: ${po} - ${partNo}`);
                    addedCount++;
                } else {
                    // Strictly skip if already exists as per user request
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
            message: `Successfully synced. Added: ${addedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`,
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
}

export const syncService = new SyncService();
export default syncService;
