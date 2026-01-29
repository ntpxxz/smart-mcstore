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

            // Check for duplicates (PO + PartNo + InvoiceNo + Status Pending)
            const existing = await prisma.inboundTask.findFirst({
                where: {
                    po,
                    partNo,
                    invoiceNo,
                    status: 'Pending'
                }
            });

            if (!existing) {
                await prisma.inboundTask.create({
                    data: {
                        po,
                        vendor,
                        partNo,
                        partName,
                        qty,
                        invoiceNo,
                        externalDate,
                        status: 'Pending'
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
