# วิธีใช้ CSV Sync Mode

## 1. Export ข้อมูลจาก PBASS API

ให้ผู้ที่เข้าถึง PBASS Server ได้ (เช่น คนที่อยู่ใน subnet 10.120.10.0/24) export ข้อมูลเป็น CSV

## 2. วาง CSV ไฟล์ในโฟลเดอร์ files/

```bash
# ตัวอย่างชื่อไฟล์
files/INVINCOM_(YYYYMMDD_HHMMSS).csv
```

## 3. เรียก Sync API แบบ Force CSV

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"useCSV": true}'
```

## 4. หรือใช้ผ่าน Frontend

กดปุ่ม "Sync" ในหน้า Inbound Tasks (ถ้า API ไม่ได้ จะ fallback เป็น CSV อัตโนมัติ)

---

## Automation (Optional)

สร้าง scheduled task ให้คนที่เข้าถึง PBASS ได้ export CSV มาวางใน shared folder
แล้วให้ OneInv อ่านจาก shared folder นั้น
