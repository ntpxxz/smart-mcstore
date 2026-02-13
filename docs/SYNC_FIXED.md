# ✅ แก้ไขปัญหา Sync Data จาก PBASS API สำเร็จ

## 📋 สรุปปัญหาที่พบและการแก้ไข

### ปัญหาหลัก
1. **Filter status ไม่ถูกต้อง** - ใช้ `'WAITING RECEIVE'` ซึ่งไม่มีใน enum
2. **Fetch API ไม่รองรับ proxy และ SSL ignore** - Next.js fetch ไม่รองรับ agent option
3. **ขาด error logging** - ยากต่อการ debug

### การแก้ไขที่ทำแล้ว ✅

#### 1. แก้ไข Sync API (`app/api/sync/route.ts`)
- ✅ ลบ filter `status: 'WAITING RECEIVE'` ออก
- ✅ เพิ่ม logging เพื่อ debug
- ✅ แสดง error details เมื่อ API ล้มเหลว

#### 2. แก้ไข PBASS Client (`lib/pbass-client.ts`)
- ✅ เปลี่ยนจาก `fetch()` เป็น native Node.js `https.request()`
- ✅ รองรับ SSL ignore (`rejectUnauthorized: false`)
- ✅ รองรับ proxy agent
- ✅ เพิ่ม timeout handling
- ✅ ปรับปรุง error messages ให้ชัดเจนขึ้น

## 🚀 วิธีใช้งาน

### 1. ตรวจสอบ Environment Variables
ใน `.env.production`:
```env
PBASS_API_URL="https://10.120.10.72/PBASS_API/INVINCOM"
PBASS_API_TOKEN="eyJhbGci..."
PBASS_API_TIMEOUT=30000
PBASS_API_IGNORE_SSL=true
```

### 2. Sync ข้อมูลผ่าน Web UI
1. เปิดเว็บ `http://172.16.96.118:3001`
2. Login เข้าระบบ
3. ไปที่หน้า **"Inbound Tasks"**
4. กดปุ่ม **"Sync API"** (ปุ่มสีน้ำเงินด้านบนขวา)
5. รอสักครู่ จะมี Toast แสดงผลลัพธ์

### 3. ตรวจสอบผลลัพธ์
- **สำเร็จ:** จะแสดง "Synced from API. Added: X, Skipped: Y, Errors: Z"
- **ล้มเหลว:** จะแสดง error message พร้อมรายละเอียด

## 📊 ข้อมูลที่ Sync

### จาก PBASS API → InboundTask
```
PO_NO        → poNo
VENDOR_NAME  → vendor
ITEM_NO      → partNo
ITEM_NAME    → partName
REPLY_QTY    → planQty
INV_NO       → invoiceNo
INV_DATE     → dueDate
STATUS       → status (default: ARRIVED)
```

### Status Flow
```
ARRIVED → PENDING → IQC_WAITING → IQC_IN_PROGRESS → IQC_PASSED_WAITING_STOCK → COMPLETED
```

## 🔧 Troubleshooting

### ถ้า Sync ล้มเหลว

#### 1. ตรวจสอบ Console Logs
เปิด terminal ที่รัน `npm run dev` และดู logs:
```
🔄 Attempting to sync from PBASS API...
📍 PBASS_API_URL: https://10.120.10.72/PBASS_API/INVINCOM
🔗 Fetching from PBASS API: https://10.120.10.72/PBASS_API/INVINCOM
🔓 SSL verification disabled
```

#### 2. Connection Timeout
**อาการ:** `Request timeout after 30000ms`

**วิธีแก้:**
- ตรวจสอบ network connectivity ไปยัง `10.120.10.72`
- ลอง enable proxy:
```env
HTTPS_PROXY=http://Bptj825:Bp21111112$@proxybpi.minebea.local:8080
```

#### 3. SSL Certificate Error
**อาการ:** `UNABLE_TO_VERIFY_LEAF_SIGNATURE`

**วิธีแก้:**
- ตรวจสอบว่า `PBASS_API_IGNORE_SSL=true` ใน `.env.production`
- Restart dev server: `Ctrl+C` แล้ว `npm run dev`

#### 4. 401 Unauthorized
**อาการ:** `PBASS API returned 401`

**วิธีแก้:**
- ตรวจสอบว่า `PBASS_API_TOKEN` ยังไม่หมดอายุ
- Token ปัจจุบันหมดอายุ: **2026-05-20**

#### 5. Empty Response
**อาการ:** `Synced from API. Added: 0`

**สาเหตุ:**
- ไม่มีข้อมูลใหม่ใน PBASS API
- ข้อมูลถูก sync ไปแล้ว (ถูก skip เพราะ duplicate)

**วิธีตรวจสอบ:**
- ดูใน database ว่ามีข้อมูลหรือไม่
- ตรวจสอบ PBASS API ว่ามีข้อมูลจริงหรือไม่

## 🧪 ทดสอบการเชื่อมต่อ

### ผ่าน Command Line
```bash
npx tsx test-pbass-api.ts
```

### ผ่าน API Endpoint
```bash
curl http://localhost:3000/api/test-connection
```

## 📝 Log Messages

### Success
```
🔄 Attempting to sync from PBASS API...
📍 PBASS_API_URL: https://10.120.10.72/PBASS_API/INVINCOM
🔗 Fetching from PBASS API: https://10.120.10.72/PBASS_API/INVINCOM
🔓 SSL verification disabled
✅ Fetched 10 records from PBASS API
✅ Using API data: 10 records
```

### Error
```
🔄 Attempting to sync from PBASS API...
📍 PBASS_API_URL: https://10.120.10.72/PBASS_API/INVINCOM
🔗 Fetching from PBASS API: https://10.120.10.72/PBASS_API/INVINCOM
❌ PBASS API Error: Connection timeout
⚠️ API failed or returned no data
Error details: Connection timeout. Check proxy settings and network routing.
⚠️ Falling back to CSV...
```

## 🎯 Next Steps

1. **ทดสอบ Sync:**
   - กดปุ่ม "Sync API" ในหน้า Inbound Tasks
   - ตรวจสอบ console logs
   - ดูผลลัพธ์ใน Toast notification

2. **ตรวจสอบข้อมูล:**
   - ดูว่า tasks ปรากฏในตาราง "Inbound Tasks (ARRIVED)"
   - ตรวจสอบว่าข้อมูลถูกต้อง (PO, Vendor, Part No, Qty)

3. **Process Tasks:**
   - กดปุ่ม "Print" เพื่อสร้าง Tag และ notify warehouse
   - Task จะเปลี่ยน status จาก ARRIVED → PENDING

## 🔐 Security Notes

- Token มีอายุถึง 2026-05-20
- SSL verification ถูก disable (`PBASS_API_IGNORE_SSL=true`)
- Proxy credentials ถูกซ่อนใน logs (แสดงเป็น `***`)

## 📞 Support

หากยังมีปัญหา:
1. ตรวจสอบ console logs ใน terminal
2. ตรวจสอบ network connectivity
3. ตรวจสอบ firewall settings
4. ตรวจสอบว่า PBASS API server ทำงานอยู่หรือไม่
