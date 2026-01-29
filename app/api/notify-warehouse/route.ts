import { NextResponse, NextRequest } from 'next/server';

const WAREHOUSE_MOBILE_URL = process.env.WAREHOUSE_MOBILE_URL || 'http://localhost:3096';
const WAREHOUSE_API_KEY = process.env.WAREHOUSE_API_KEY || 'your-api-key-here';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { task, invoice, user } = body;

        // Prepare notification payload
        const notificationPayload = {
            type: 'INBOUND_READY',
            title: 'New Inbound Task Ready',
            message: `Part ${task.partNo} (${task.partName}) is ready for scanning`,
            priority: 'HIGH',
            timestamp: new Date().toISOString(),
            data: {
                taskId: task.id,
                po: task.po,
                vendor: task.vendor,
                partNo: task.partNo,
                partName: task.partName,
                qty: task.qty,
                invoice: invoice,
                receivedBy: user,
                status: 'PENDING_SCAN',
                createdAt: task.createdAt
            }
        };

        // Send to warehouse_mobile system
        const response = await fetch(`${WAREHOUSE_MOBILE_URL}/api/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': WAREHOUSE_API_KEY,
                'Authorization': `Bearer ${WAREHOUSE_API_KEY}`
            },
            body: JSON.stringify(notificationPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Warehouse Mobile API Error:', errorText);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to notify warehouse mobile system',
                    details: errorText
                },
                { status: 500 }
            );
        }

        const result = await response.json();

        return NextResponse.json({
            success: true,
            message: 'Notification sent to warehouse mobile',
            result
        });

    } catch (err: any) {
        console.error('Notify Warehouse Error:', err);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to send notification',
                details: err.message
            },
            { status: 500 }
        );
    }
}
