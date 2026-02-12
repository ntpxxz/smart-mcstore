import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { pbassClient } from '@/lib/pbass-client';

// Path to the CSV file (fallback)
const CSV_FILE_PATH = path.join(process.cwd(), 'files', 'INVINCOM_(20260127_154124).csv');

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const useCSV = body.useCSV === true; // Force CSV mode if requested

        let records: any[] = [];
        let source = 'API';

        // Try API first (unless CSV is forced)
        if (!useCSV) {
            console.log('🔄 Attempting to sync from PBASS API...');

            const apiResult = await pbassClient.fetchInvoices({
                status: 'WAITING RECEIVE', // Only fetch pending items
            });

            if (apiResult.success && apiResult.data && apiResult.data.length > 0) {
                records = apiResult.data;
                source = 'API';
                console.log(`✅ Using API data: ${records.length} records`);
            } else {
                console.warn('⚠️ API failed or returned no data, falling back to CSV');
                source = 'CSV (API Fallback)';
            }
        } else {
            console.log('📁 Using CSV mode (forced)');
            source = 'CSV (Manual)';
        }

        // Fallback to CSV if API failed or was forced
        if (records.length === 0) {
            if (!fs.existsSync(CSV_FILE_PATH)) {
                return NextResponse.json({
                    error: 'No data source available. API failed and CSV file not found.',
                    source: 'None'
                }, { status: 404 });
            }

            const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
            records = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });
            console.log(`📄 Using CSV data: ${records.length} records`);
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
                const partName = record.ITEM_NAME || record.itemName;
                const qty = parseInt(record.REPLY_QTY || record.replyQty || '0') || 0;
                const invoiceNo = record.INV_NO || record.invNo;
                const externalDate = record.INV_DATE || record.invDate;

                if (!po || !partNo) {
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
                            vendor,
                            partNo,
                            partName,
                            planQty: qty,
                            invoiceNo,
                            dueDate: parsedDueDate,
                            status: 'ARRIVED'
                        }
                    });
                    addedCount++;
                } else {
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

