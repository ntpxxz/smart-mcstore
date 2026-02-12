# การตั้งค่าเชื่อมต่อ PBASS API ข้าม LAN

## 📋 ข้อกำหนดเบื้องต้น

### 1. Network Requirements
- **Source**: เครื่อง OneInv Server (192.168.101.225)
- **Target**: PBASS API Server (wbp5.bp.minebea.local)
- **Protocol**: HTTPS
- **Port**: 443 (default HTTPS)

### 2. การตรวจสอบ Network Connectivity

#### Windows (PowerShell)
```powershell
# ทดสอบ DNS Resolution
nslookup wbp5.bp.minebea.local

# ทดสอบ Network Connectivity
Test-NetConnection -ComputerName wbp5.bp.minebea.local -Port 443

# ทดสอบ HTTPS Endpoint
curl https://wbp5.bp.minebea.local/PBASS_API/INVINCOM -k
```

#### Linux/macOS
```bash
# ทดสอบ DNS Resolution
dig wbp5.bp.minebea.local

# ทดสอบ Network Connectivity
nc -zv wbp5.bp.minebea.local 443

# ทดสอบ HTTPS Endpoint
curl -k https://wbp5.bp.minebea.local/PBASS_API/INVINCOM
```

---

## 🔧 การแก้ปัญหาที่พบบ่อย

### ปัญหา 1: DNS Resolution Failed
**อาการ**: `getaddrinfo ENOTFOUND wbp5.bp.minebea.local`

**วิธีแก้:**
1. เพิ่ม DNS Server ของ MINEBEA ใน Network Settings
2. หรือเพิ่ม entry ใน hosts file:

**Windows**: `C:\Windows\System32\drivers\etc\hosts`
```
<IP_ADDRESS>  wbp5.bp.minebea.local
```

**Linux/macOS**: `/etc/hosts`
```
<IP_ADDRESS>  wbp5.bp.minebea.local
```

### ปัญหา 2: SSL Certificate Error
**อาการ**: `UNABLE_TO_VERIFY_LEAF_SIGNATURE` หรือ `CERT_HAS_EXPIRED`

**วิธีแก้:**
ตั้งค่าใน `.env`:
```bash
PBASS_API_IGNORE_SSL=true
```

⚠️ **คำเตือน**: ใช้เฉพาะใน Internal Network เท่านั้น

### ปัญหา 3: Network Timeout
**อาการ**: `Request timeout after 30000ms`

**วิธีแก้:**
1. เพิ่ม timeout ใน `.env`:
```bash
PBASS_API_TIMEOUT=60000  # 60 วินาที
```

2. ตรวจสอบ Firewall/Proxy Settings

### ปัญหา 4: Cross-LAN Routing
**อาการ**: `EHOSTUNREACH` หรือ `ENETUNREACH`

**วิธีแก้:**
1. ติดต่อ IT/Network Admin เพื่อเปิด routing ระหว่าง LAN
2. ตรวจสอบว่ามี VPN หรือ Gateway ที่ต้องใช้
3. อาจต้องใช้ Proxy Server:

```bash
# ใน .env
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080
```

---

## 🧪 การทดสอบการเชื่อมต่อ

### 1. ทดสอบผ่าน API Endpoint
```bash
curl http://localhost:3000/api/test-connection
```

**ผลลัพธ์ที่คาดหวัง:**
```json
{
  "success": true,
  "message": "Connected successfully. Found 333 records.",
  "latency": 1234,
  "timestamp": "2026-02-11T07:05:15.000Z"
}
```

### 2. ทดสอบ Sync
```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json"
```

**ผลลัพธ์ที่คาดหวัง:**
```json
{
  "success": true,
  "message": "Synced from API. Added: 15, Skipped: 318, Errors: 0",
  "source": "API",
  "stats": {
    "added": 15,
    "skipped": 318,
    "errors": 0,
    "total": 333
  }
}
```

### 3. Force CSV Mode (สำหรับ Fallback)
```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"useCSV": true}'
```

---

## 🔐 Security Considerations

### 1. API Authentication (ถ้า PBASS API ต้องการ)
เพิ่มใน `.env`:
```bash
PBASS_API_KEY=your_api_key_here
PBASS_API_USERNAME=your_username
PBASS_API_PASSWORD=your_password
```

แล้วแก้ไข `lib/pbass-client.ts`:
```typescript
headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.PBASS_API_KEY}`,
    // หรือ Basic Auth:
    // 'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
},
```

### 2. IP Whitelisting
ติดต่อ PBASS API Admin เพื่อเพิ่ม IP ของ OneInv Server:
- **IP**: 192.168.101.225
- **Purpose**: Inbound data synchronization

### 3. Rate Limiting
ถ้า API มี rate limit ให้เพิ่ม delay:
```typescript
// ใน sync logic
await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
```

---

## 📊 Monitoring & Logging

### ดู Logs แบบ Real-time
```bash
# Windows PowerShell
Get-Content -Path "logs\sync.log" -Wait -Tail 50

# Linux/macOS
tail -f logs/sync.log
```

### สถิติการ Sync
- **API Success Rate**: ดูที่ response `source: "API"`
- **Fallback Rate**: ดูที่ response `source: "CSV (API Fallback)"`
- **Average Latency**: ดูจาก `/api/test-connection`

---

## 🚀 Production Deployment

### 1. Docker Compose (ถ้าใช้)
เพิ่มใน `docker-compose.yml`:
```yaml
services:
  app:
    environment:
      - PBASS_API_URL=https://wbp5.bp.minebea.local/PBASS_API/INVINCOM
      - PBASS_API_TIMEOUT=30000
      - PBASS_API_IGNORE_SSL=true
    extra_hosts:
      - "wbp5.bp.minebea.local:<IP_ADDRESS>"
```

### 2. Scheduled Sync (Cron Job)
สร้างไฟล์ `scripts/auto-sync.sh`:
```bash
#!/bin/bash
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  >> logs/sync.log 2>&1
```

เพิ่มใน crontab:
```bash
# Sync ทุก 30 นาที
*/30 * * * * /path/to/scripts/auto-sync.sh
```

---

## 📞 Support Contacts

- **Network Issues**: IT Department
- **PBASS API Issues**: PBASS API Admin
- **Application Issues**: Development Team

---

## 📝 Change Log

- **2026-02-11**: Initial setup - Real-time API integration
- **Future**: Add webhook support for push-based updates
