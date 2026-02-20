import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { pbassClient } from '@/lib/pbass-client';



export async function POST(request: Request) {
    try {
        // const body = await request.json().catch(() => ({}));
        // const useCSV = body.useCSV === true; // No longer used

        let records: any[] = [];
        let source = 'API';

        // Sync only from API (CSV sync is legacy and no longer used)
        console.log('🔄 Attempting to sync from PBASS API...');

        const apiResult = await pbassClient.fetchInvoices(); // Fetch all items to filter manually

        if (apiResult.success && apiResult.data) {
            records = apiResult.data;
            source = 'API';
            console.log(`✅ Using API data: ${records.length} records`);
        } else {
            console.error('❌ API failed:', apiResult.error);
            return NextResponse.json({
                error: `API failed: ${apiResult.error || 'No data returned'}`,
                source: 'API'
            }, { status: 500 });
        }

        let addedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const record of records) {
            try {
                // Normalize field names (API vs CSV might differ)
                const po = record.PO_NO || record.poNo;
                const partNo = record.ITEM_NO || record.itemNo;
                const vendor = record.VENDOR_NAME || record.vendorName;
                const partName = record.ITEM_NAME || record.itemName || '';
                const qty = parseInt(record.REPLY_QTY || record.replyQty || '0') || 0;
                const invoiceNo = record.INV_NO || record.invNo;
                const externalDate = record.INV_DATE || record.invDate;

                if (!po || !partNo) {
                    skippedCount++;
                    continue;
                }

                // Filter by Part Name: Only allow 'Ramp' or 'Diverter'
                const lowerPartName = partName.toLowerCase();
                const isRampOrDiverter = lowerPartName.includes('ramp') || lowerPartName.includes('diverter') || lowerPartName.includes('divertor');

                if (!isRampOrDiverter) {
                    if (skippedCount < 5) { // Only log first 5 to avoid spam
                        console.log(`⏭️ Skipping part: "${partName}" (not Ramp/Diverter)`);
                    }
                    skippedCount++;
                    continue;
                }

                const parseDate = (dateStr: string) => {
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
                };

                const parsedDueDate = parseDate(externalDate);

                // Check for duplicates with trimmed values
                const existing = await prisma.inboundTask.findFirst({
                    where: {
                        invoiceNo: invoiceNo.trim(),
                        partNo: partNo.trim(),
                        vendor: vendor.trim()
                    }
                });

                if (!existing) {
                    await prisma.inboundTask.create({
                        data: {
                            poNo: po.trim(),
                            vendor: vendor.trim(),
                            partNo: partNo.trim(),
                            partName: partName.trim(),
                            planQty: qty,
                            invoiceNo: invoiceNo.trim(),
                            dueDate: parsedDueDate,
                            status: 'ARRIVED'
                        }
                    });
                    addedCount++;
                } else {
                    // Log details of the duplicate only for debugging if needed
                    // console.log(`ℹ️ Duplicate found: ${invoiceNo} / ${partNo}`);
                    skippedCount++;
                }
            } catch (err) {
                console.error('Error processing record:', err);
                errorCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Synced from ${source}. Added: ${addedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`,
            source,
            stats: {
                added: addedCount,
                skipped: skippedCount,
                errors: errorCount,
                total: records.length
            }
        });
    } catch (err) {
        console.error('Sync Error:', err);
        return NextResponse.json({
            error: 'Failed to sync data',
            details: err instanceof Error ? err.message : 'Unknown error'
        }, { status: 500 });
    }
}

