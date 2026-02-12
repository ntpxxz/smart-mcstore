# Automated CSV Sync Workflow

## สถานการณ์

- OneInv Server อยู่ใน subnet `192.168.101.x` (ไม่สามารถเข้าถึง `10.120.10.72` ได้)
- PBASS API อยู่ใน subnet `10.120.10.x`
- ไม่สามารถเปิด routing ระหว่าง subnet ได้เนื่องจากนโยบายองค์กร

## วิธีแก้ปัญหา: Automated CSV Sync

### Architecture

```
┌──────────────────────────────┐
│  Bridge Server               │
│  (เครื่องที่เข้าถึงทั้ง 2 subnet)│
│  - เข้าถึง PBASS API ได้     │
│  - เข้าถึง OneInv ได้        │
└──────────────────────────────┘
         │
         │ (1) Export CSV from PBASS API
         ▼
┌──────────────────────────────┐
│  Shared Folder / FTP         │
│  \\server\share\pbass\       │
└──────────────────────────────┘
         │
         │ (2) OneInv reads CSV
         ▼
┌──────────────────────────────┐
│  OneInv Server               │
│  (192.168.101.225)           │
└──────────────────────────────┘
```

---

## ขั้นตอนการตั้งค่า

### 1. สร้าง Script บน Bridge Server (PowerShell)

สร้างไฟล์ `export-pbass-data.ps1`:

```powershell
# PBASS API Export Script
# Run this on a server that can access both PBASS API and OneInv

$PBASS_API_URL = "https://10.120.10.72/PBASS_API/INVINCOM"
$PBASS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyaWQiOiJCUFRKODI1IiwiZGl2aXNpb24iOiJUMjcxRE0iLCJhcGluYW1lIjoiSU5WSU5DT00iLCJleHAiOjE3Nzg1Njk1ODksImlzcyI6IkRFViIsImF1ZCI6Imh0dHA6Ly9kZXZfZGVtby5jb20ifQ.HKxhE34t_6JHEstwFeWf2UvKvQUGAKQVscR3h4kXT4w"
$OUTPUT_DIR = "\\server\share\pbass"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$OUTPUT_FILE = "$OUTPUT_DIR\INVINCOM_$TIMESTAMP.csv"

Write-Host "Fetching data from PBASS API..."

try {
    # Fetch data from PBASS API
    $headers = @{
        "Authorization" = "Bearer $PBASS_TOKEN"
        "Accept" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri $PBASS_API_URL -Headers $headers -Method Get
    
    # Convert to CSV
    $response | Export-Csv -Path $OUTPUT_FILE -NoTypeInformation -Encoding UTF8
    
    Write-Host "✅ Exported $($response.Count) records to $OUTPUT_FILE"
    
    # Clean up old files (keep last 7 days)
    Get-ChildItem -Path $OUTPUT_DIR -Filter "INVINCOM_*.csv" | 
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
        Remove-Item -Force
    
    Write-Host "✅ Cleanup completed"
    
} catch {
    Write-Host "❌ Error: $_"
    exit 1
}
```

### 2. สร้าง Scheduled Task (Windows)

```powershell
# สร้าง scheduled task ที่รันทุก 30 นาที
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\Scripts\export-pbass-data.ps1"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 30)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest

Register-ScheduledTask -TaskName "PBASS_Export" -Action $action -Trigger $trigger -Principal $principal
```

### 3. อัปเดต OneInv ให้อ่าน CSV จาก Shared Folder

แก้ไข `app/api/sync/route.ts`:

```typescript
// เปลี่ยนจาก hardcoded path
const CSV_FILE_PATH = path.join(process.cwd(), 'files', 'INVINCOM_(20260127_154124).csv');

// เป็น dynamic path (อ่านไฟล์ล่าสุด)
const CSV_DIR = '\\\\server\\share\\pbass'; // หรือ mount เป็น local path
const files = fs.readdirSync(CSV_DIR)
    .filter(f => f.startsWith('INVINCOM_') && f.endsWith('.csv'))
    .sort()
    .reverse();

const CSV_FILE_PATH = files.length > 0 
    ? path.join(CSV_DIR, files[0]) 
    : null;
```

---

## Alternative: HTTP Upload

ถ้าไม่สามารถใช้ shared folder ได้ ให้ Bridge Server upload CSV ผ่าน HTTP:

### Bridge Server Script

```powershell
# Upload CSV to OneInv
$ONEINV_URL = "http://192.168.101.225:3000/api/upload-csv"
$CSV_CONTENT = Get-Content -Path $OUTPUT_FILE -Raw

Invoke-RestMethod -Uri $ONEINV_URL -Method Post -Body $CSV_CONTENT -ContentType "text/csv"
```

### OneInv API Endpoint

สร้าง `app/api/upload-csv/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const csvContent = await request.text();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `INVINCOM_${timestamp}.csv`;
        const filepath = path.join(process.cwd(), 'files', filename);
        
        fs.writeFileSync(filepath, csvContent);
        
        return NextResponse.json({
            success: true,
            message: `CSV uploaded: ${filename}`
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Upload failed'
        }, { status: 500 });
    }
}
```

---

## ข้อดีของวิธีนี้

✅ ไม่ต้องแก้ไข network routing
✅ ทำงานอัตโนมัติ (ไม่ต้อง manual export)
✅ ใช้ระบบ fallback ที่มีอยู่แล้ว
✅ ปลอดภัย (ไม่ต้องเปิด firewall)

---

## Monitoring

สร้าง dashboard เพื่อดูสถานะการ sync:

- ⏰ Last sync time
- 📊 Number of records synced
- ✅ Success/Failure status
- 📁 CSV file age

---

## สรุป

วิธีนี้เหมาะสำหรับองค์กรที่มีข้อจำกัดทาง network security โดยใช้ "Bridge Server" เป็นตัวกลางในการดึงข้อมูลจาก PBASS API และส่งต่อให้ OneInv ผ่าน CSV
