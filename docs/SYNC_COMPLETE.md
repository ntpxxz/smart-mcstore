# ✅ แก้ไขปัญหา Sync Data สำเร็จ!

## 🎯 สรุปปัญหาและการแก้ไข

### ปัญหาที่พบ

#### 1. ❌ Filter Status ไม่ถูกต้อง
- **ปัญหา:** ใช้ `status: 'WAITING RECEIVE'` ซึ่งไม่มีใน InboundStatus enum
- **แก้ไข:** ✅ ลบ filter ออก

#### 2. ❌ Proxy Connection Error
- **ปัญหา:** `ENOTFOUND proxybpi.minebea.local`
- **สาเหตุ:** เครื่องอยู่ใน subnet เดียวกับ PBASS API แล้ว ไม่ต้องใช้ proxy
- **แก้ไข:** ✅ ปิด proxy configuration ใน `.env`

#### 3. ❌ Font Loading Error
- **ปัญหา:** Turbopack มีปัญหากับ Google Fonts
- **แก้ไข:** ✅ เปลี่ยนเป็น system fonts

#### 4. ❌ Fetch API ไม่รองรับ Proxy
- **ปัญหา:** Next.js fetch ไม่รองรับ agent option
- **แก้ไข:** ✅ เปลี่ยนเป็น native Node.js `https.request()`

---

## 🚀 วิธีทดสอบ Sync

### 1. เปิดเว็บแอพพลิเคชัน
```
http://10.120.132.108:3000
```

### 2. Login เข้าระบบ
- Username: `admin` (หรือ user ที่มีอยู่)
- Password: ตามที่ตั้งไว้

### 3. ไปที่หน้า "Inbound Tasks"
- คลิกที่เมนู "Inbound Tasks" ใน sidebar

### 4. กดปุ่ม "Sync API"
- ปุ่มสีน้ำเงินด้านบนขวา
- รอสักครู่ (ประมาณ 5-30 วินาที)

### 5. ดูผลลัพธ์
- **Toast notification** จะแสดงผลลัพธ์
- **Console logs** ใน terminal จะแสดงรายละเอียด

---

## 📊 ผลลัพธ์ที่คาดหวัง

### ✅ สำเร็จ
**Toast แสดง:**
```
Synced from API. Added: 5, Skipped: 2, Errors: 0
```

**Console logs:**
```
🔄 Attempting to sync from PBASS API...
📍 PBASS_API_URL: https://10.120.10.72/PBASS_API/INVINCOM
🔗 Fetching from PBASS API: https://10.120.10.72/PBASS_API/INVINCOM
🔓 SSL verification disabled
✅ Fetched 7 records from PBASS API
✅ Using API data: 7 records
```

**ในตาราง:**
- จะมี tasks ใหม่ปรากฏในตาราง "Inbound Tasks (ARRIVED)"
- แสดงข้อมูล: PO, Vendor, Part No, Part Name, Qty

### ❌ ถ้าล้มเหลว

**Toast แสดง:**
```
Connection error during sync
```

**Console logs:**
```
❌ PBASS API Error: Connection timeout
⚠️ API failed or returned no data
Error details: Connection timeout. Check proxy settings and network routing.
⚠️ Falling back to CSV...
```

---

## 🔧 Troubleshooting

### ปัญหา: Connection Timeout
**อาการ:** `Request timeout after 30000ms`

**วิธีแก้:**
1. ตรวจสอบ network connectivity:
   ```powershell
   ping 10.120.10.72
   ```
2. ตรวจสอบว่า PBASS API server ทำงานอยู่
3. ตรวจสอบ firewall settings

### ปัญหา: SSL Certificate Error
**อาการ:** `UNABLE_TO_VERIFY_LEAF_SIGNATURE`

**วิธีแก้:**
- ตรวจสอบว่า `PBASS_API_IGNORE_SSL=true` ใน `.env`
- Restart dev server

### ปัญหา: 401 Unauthorized
**อาการ:** `PBASS API returned 401`

**วิธีแก้:**
- ตรวจสอบว่า `PBASS_API_TOKEN` ยังไม่หมดอายุ
- Token ปัจจุบันหมดอายุ: **2026-05-20**

### ปัญหา: Empty Response
**อาการ:** `Synced from API. Added: 0`

**สาเหตุ:**
- ไม่มีข้อมูลใหม่ใน PBASS API
- ข้อมูลถูก sync ไปแล้ว (duplicate)

**วิธีตรวจสอบ:**
```sql
SELECT * FROM inbound_tasks ORDER BY "createdAt" DESC LIMIT 10;
```

---

## 📝 การทำงานของระบบ

### Data Flow
```
PBASS API
    ↓
Sync API (/api/sync)
    ↓
InboundTask (status: ARRIVED)
    ↓
TaskQueue (แสดงในตาราง)
    ↓
กดปุ่ม "Print"
    ↓
สร้าง Tag + Notify Warehouse
    ↓
status: PENDING
```

### Field Mapping
```
PBASS API          →  InboundTask
─────────────────────────────────────
PO_NO              →  poNo
VENDOR_NAME        →  vendor
ITEM_NO            →  partNo
ITEM_NAME          →  partName
REPLY_QTY          →  planQty
INV_NO             →  invoiceNo
INV_DATE           →  dueDate
STATUS             →  status (ARRIVED)
```

### Status Flow
```
ARRIVED
  ↓ (กดปุ่ม Print)
PENDING
  ↓ (Warehouse scan)
IQC_WAITING
  ↓ (IQC start)
IQC_IN_PROGRESS
  ↓ (IQC pass)
IQC_PASSED_WAITING_STOCK
  ↓ (Warehouse store)
COMPLETED
```

---

## 🔐 Configuration

### Environment Variables (.env)
```env
# Database
DATABASE_URL="postgresql://rootpg:123456@localhost:5432/warehouse?schema=public&sslmode=disable"

# PBASS API
PBASS_API_URL="https://10.120.10.72/PBASS_API/INVINCOM"
PBASS_API_TOKEN="eyJhbGci..."
PBASS_API_TIMEOUT=30000
PBASS_API_IGNORE_SSL=true

# Proxy (ปิดไว้เพราะไม่จำเป็น)
# HTTPS_PROXY=http://Bptj825:Bp21111112$@proxybpi.minebea.local:8080
# HTTP_PROXY=http://Bptj825:Bp21111112$@proxybpi.minebea.local:8080
```

---

## 📞 Support

### ตรวจสอบ Logs
```powershell
# ดู console logs ใน terminal ที่รัน npm run dev
# หรือ
Get-Content .next/trace
```

### ตรวจสอบ Database
```sql
-- ดู tasks ทั้งหมด
SELECT * FROM inbound_tasks ORDER BY "createdAt" DESC;

-- นับจำนวน tasks แต่ละ status
SELECT status, COUNT(*) FROM inbound_tasks GROUP BY status;

-- ดู tasks ที่ sync วันนี้
SELECT * FROM inbound_tasks 
WHERE DATE("createdAt") = CURRENT_DATE 
ORDER BY "createdAt" DESC;
```

### ตรวจสอบ Network
```powershell
# Test connectivity
ping 10.120.10.72

# Test HTTPS
curl -k https://10.120.10.72/PBASS_API/INVINCOM

# Check DNS
nslookup proxybpi.minebea.local
```

---

## ✅ Checklist

- [x] แก้ไข filter status
- [x] ปิด proxy configuration
- [x] แก้ไข font loading error
- [x] เปลี่ยนเป็น https.request()
- [x] เพิ่ม error logging
- [x] เพิ่ม SSL ignore support
- [x] ทดสอบการเชื่อมต่อ

---

## 🎉 สรุป

ระบบพร้อมใช้งานแล้ว! ลองทดสอบ Sync API ได้เลย:

1. ✅ เปิดเว็บ `http://10.120.132.108:3000`
2. ✅ Login เข้าระบบ
3. ✅ ไปที่หน้า "Inbound Tasks"
4. ✅ กดปุ่ม "Sync API"
5. ✅ ดูผลลัพธ์ใน Toast และ Console

หากมีปัญหา ให้ดู console logs และตรวจสอบตาม troubleshooting guide ด้านบน
