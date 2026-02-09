import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Path to the CSV file provided by the user
const CSV_FILE_PATH = path.join(process.cwd(), 'files', 'INVINCOM_(20260127_154124).csv');

export async function POST() {
    try {
        if (!fs.existsSync(CSV_FILE_PATH)) {
            console.error('CSV file not found at:', CSV_FILE_PATH);
            return NextResponse.json({ error: 'CSV file not found' }, { status: 404 });
        }

        const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');

        // Parse CSV
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        }) as any[];

        let addedCount = 0;
        for (const record of records) {
            // Mapping CSV columns to InboundTask fields:
            // PO_NO -> po
            // VENDOR_NAME -> vendor
            // ITEM_NO -> partNo
            // ITEM_NAME -> partName
            // REPLY_QTY -> qty
            // INV_DATE -> externalDate

            const po = record.PO_NO;
            const partNo = record.ITEM_NO;
            const vendor = record.VENDOR_NAME;
            const partName = record.ITEM_NAME;
            const qty = parseInt(record.REPLY_QTY) || 0;
            const invoiceNo = record.INV_NO;
            const externalDate = record.INV_DATE;

            if (!po || !partNo) continue;

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

            // Check for duplicates (PO + PartNo + InvoiceNo + Status Pending or Arrived)
            const existing = await prisma.inboundTask.findFirst({
                where: {
                    poNo: po,
                    partNo,
                    invoiceNo,
                    vendor // Added vendor to match @@unique([invoiceNo, partNo, vendor])
                    // Removed status check because unique constraint applies regardless of status
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
            }
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${addedCount} new tasks from CSV.`,
            count: addedCount
        });
    } catch (err) {
        console.error('Sync Error:', err);
        return NextResponse.json({ error: 'Failed to sync with CSV data' }, { status: 500 });
    }
}
