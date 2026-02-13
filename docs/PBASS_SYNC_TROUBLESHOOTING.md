# 🔍 สรุปปัญหาการ Sync Data จาก PBASS API

## ปัญหาที่พบ

### 1. **Filter Status ไม่ถูกต้อง**
- ใน `app/api/sync/route.ts` บรรทัด 24 มีการ filter `status: 'WAITING RECEIVE'`
- แต่ใน Prisma schema ไม่มี status นี้ใน `InboundStatus` enum
- ทำให้ API ไม่ส่งข้อมูลกลับมา

### 2. **ขาด Error Logging**
- ไม่มีการแสดง error details เมื่อ API ล้มเหลว
- ทำให้ยากต่อการ debug

### 3. **Proxy และ SSL Configuration**
- PBASS API อยู่ที่ `https://10.120.10.72/PBASS_API/INVINCOM`
- ต้องการ SSL ignore (`PBASS_API_IGNORE_SSL=true`)
- อาจต้องการ proxy สำหรับ cross-subnet access

## การแก้ไขที่ทำไปแล้ว

### ✅ 1. แก้ไข Sync API (`app/api/sync/route.ts`)
```typescript
// เดิม: มี filter ที่ไม่ถูกต้อง
const apiResult = await pbassClient.fetchInvoices({
    status: 'WAITING RECEIVE', // ❌ ไม่มีใน enum
});

// ใหม่: ลบ filter ออก และเพิ่ม logging
console.log('📍 PBASS_API_URL:', process.env.PBASS_API_URL);
const apiResult = await pbassClient.fetchInvoices();

if (!apiResult.success) {
    console.warn('Error details:', apiResult.error);
}
```

### ✅ 2. เพิ่ม Test Script
สร้างไฟล์ `test-pbass-api.ts` เพื่อทดสอบการเชื่อมต่อ:
```bash
npx tsx test-pbass-api.ts
```

## วิธีการทดสอบ

### 1. ตรวจสอบ Environment Variables
ใน `.env.production`:
```env
PBASS_API_URL="https://10.120.10.72/PBASS_API/INVINCOM"
PBASS_API_TOKEN="eyJhbGci..."
PBASS_API_TIMEOUT=30000
PBASS_API_IGNORE_SSL=true
```

### 2. ทดสอบผ่าน Web UI
1. เปิดเว็บ `http://172.16.96.118:3001`
2. Login เข้าระบบ
3. ไปที่หน้า "Inbound Tasks"
4. กดปุ่ม **"Sync API"** (สีน้ำเงิน ด้านบนขวา)
5. ดู Toast notification ที่แสดงผลลัพธ์

### 3. ตรวจสอบ Console Logs
เปิด Terminal ที่รัน `npm run dev` และดู logs:
```
🔄 Attempting to sync from PBASS API...
📍 PBASS_API_URL: https://10.120.10.72/PBASS_API/INVINCOM
🔗 Fetching from PBASS API: https://10.120.10.72/PBASS_API/INVINCOM
```

## สถานะปัจจุบัน

### ✅ ที่ทำเสร็จแล้ว
- [x] แก้ไข filter status ใน sync API
- [x] เพิ่ม error logging
- [x] สร้าง test script
- [x] มีปุ่ม Sync API ใน UI แล้ว

### ⏳ ที่ต้องทดสอบ
- [ ] ทดสอบการเชื่อมต่อกับ PBASS API จริง
- [ ] ตรวจสอบว่า SSL ignore ทำงานหรือไม่
- [ ] ตรวจสอบว่า proxy configuration ถูกต้องหรือไม่

## ปัญหาที่อาจพบ

### 1. **Connection Timeout**
**อาการ:** API timeout หลัง 30 วินาที

**สาเหตุที่เป็นไปได้:**
- Network ไม่สามารถเข้าถึง `10.120.10.72` ได้
- Firewall block connection
- ต้องใช้ proxy แต่ไม่ได้ config

**วิธีแก้:**
```env
# ลอง enable proxy
HTTPS_PROXY=http://Bptj825:Bp21111112$@proxybpi.minebea.local:8080
HTTP_PROXY=http://Bptj825:Bp21111112$@proxybpi.minebea.local:8080
```

### 2. **SSL Certificate Error**
**อาการ:** `UNABLE_TO_VERIFY_LEAF_SIGNATURE` หรือ `CERT_HAS_EXPIRED`

**วิธีแก้:**
- ตรวจสอบว่า `PBASS_API_IGNORE_SSL=true` ใน `.env.production`
- Restart dev server

### 3. **401 Unauthorized**
**อาการ:** API return 401

**วิธีแก้:**
- ตรวจสอบว่า `PBASS_API_TOKEN` ยังไม่หมดอายุ
- Token ปัจจุบันหมดอายุ: `2026-05-20` (exp: 1778569589)

### 4. **Empty Response**
**อาการ:** API ส่ง `[]` กลับมา

**สาเหตุ:**
- ไม่มีข้อมูลใน PBASS API ตอนนี้
- API ต้องการ parameters เพิ่มเติม

**วิธีแก้:**
- ตรวจสอบข้อมูลใน PBASS API ว่ามีจริงหรือไม่
- ลองเพิ่ม date filter:
```typescript
await pbassClient.fetchInvoices({
    startDate: '2026-01-01',
    endDate: '2026-12-31'
});
```

## Next Steps

1. **ทดสอบการเชื่อมต่อ:**
   ```bash
   npx tsx test-pbass-api.ts
   ```

2. **ถ้า timeout หรือ connection error:**
   - ตรวจสอบ network connectivity
   - ลอง enable proxy
   - ตรวจสอบ firewall settings

3. **ถ้าได้ข้อมูลแล้ว:**
   - ทดสอบกดปุ่ม "Sync API" ใน web UI
   - ตรวจสอบว่าข้อมูลถูกบันทึกลง database หรือไม่
   - ตรวจสอบว่า tasks แสดงในหน้า "Inbound Tasks" หรือไม่

## การติดต่อ PBASS API

### API Endpoint
```
GET https://10.120.10.72/PBASS_API/INVINCOM
```

### Headers
```
Authorization: Bearer eyJhbGci...
Accept: application/json
Content-Type: application/json
```

### Expected Response Format
```json
{
  "data": [
    {
      "PO_NO": "PO-12345",
      "VENDOR_NAME": "ABC Company",
      "ITEM_NO": "PART-001",
      "ITEM_NAME": "Sample Part",
      "INV_NO": "INV-001",
      "INV_DATE": "01/02/2026",
      "REPLY_QTY": "100",
      "STATUS": "WAITING RECEIVE"
    }
  ]
}
```

หรือ

```json
[
  {
    "PO_NO": "PO-12345",
    ...
  }
]
```

## สรุป

ปัญหาหลักคือ **filter status ที่ไม่ถูกต้อง** ซึ่งแก้ไขแล้ว ตอนนี้ระบบพร้อมทดสอบการเชื่อมต่อกับ PBASS API จริง

หากยังมีปัญหา ให้ตรวจสอบ:
1. Network connectivity ไปยัง `10.120.10.72`
2. SSL certificate configuration
3. Proxy settings (ถ้าจำเป็น)
4. Token expiration
