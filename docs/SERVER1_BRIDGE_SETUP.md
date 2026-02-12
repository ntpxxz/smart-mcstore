# Setup Guide: Server 1 as API Bridge

## Architecture Overview

```
┌─────────────────────┐
│  Client             │
│  192.168.x.x        │
└──────────┬──────────┘
           │ HTTP
           ▼
┌─────────────────────┐
│  My App (OneInv)    │
│  192.198.101.225    │
└──────────┬──────────┘
           │ HTTP (port 3001)
           ▼
┌─────────────────────┐
│  Server 1 (Bridge)  │
│  - 192.168.101.219  │ ← OneInv เรียกมาที่นี่
│  - 10.120.122.10    │ ← Forward ไป PBASS ผ่าน IP นี้
└──────────┬──────────┘
           │ HTTPS (port 443)
           ▼
┌─────────────────────┐
│  Server 2 / API     │
│  (PBASS)            │
│  10.120.10.72       │
└─────────────────────┘
```

---

## ขั้นตอนการติดตั้ง

### 1. ติดตั้ง Proxy บน Server 1

เลือก 1 ใน 2 วิธี:

#### **วิธี A: ใช้ nginx (แนะนำ - เร็วและเสถียร)**

**ติดตั้ง nginx:**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx

# Windows
# Download from https://nginx.org/en/download.html
```

**สร้าง config file:**

```bash
# Linux: /etc/nginx/sites-available/pbass-proxy
# Windows: C:\nginx\conf\pbass-proxy.conf

server {
    listen 3001;
    server_name 192.168.101.219;

    # Logging
    access_log /var/log/nginx/pbass-access.log;
    error_log /var/log/nginx/pbass-error.log;

    location /api/pbass/invincom {
        # Forward to PBASS API
        proxy_pass https://10.120.10.72/PBASS_API/INVINCOM;
        
        # SSL settings
        proxy_ssl_verify off;
        proxy_ssl_server_name on;
        
        # Headers
        proxy_set_header Host 10.120.10.72;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Forward Authorization header (JWT Token)
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
        
        # Timeout settings
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # CORS (if needed)
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type";
    }

    # Health check endpoint
    location /health {
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

**Enable และ restart:**

```bash
# Linux
sudo ln -s /etc/nginx/sites-available/pbass-proxy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Windows
nginx.exe -t
nginx.exe -s reload
```

---

#### **วิธี B: ใช้ Node.js Proxy (ถ้าไม่มี nginx)**

**ติดตั้ง dependencies:**

```bash
cd /path/to/server1
npm init -y
npm install express node-fetch
```

**สร้างไฟล์ `server1-proxy.js`:**
(ใช้ไฟล์ที่สร้างไว้ใน `docs/server1-proxy.js`)

**รัน proxy:**

```bash
node server1-proxy.js
```

**ตั้งค่าให้รันอัตโนมัติ (Windows Service):**

```powershell
# ใช้ NSSM (Non-Sucking Service Manager)
# Download from https://nssm.cc/download

nssm install PBASSProxy "C:\Program Files\nodejs\node.exe" "C:\path\to\server1-proxy.js"
nssm start PBASSProxy
```

**หรือใช้ PM2 (Linux/Windows):**

```bash
npm install -g pm2
pm2 start server1-proxy.js --name pbass-proxy
pm2 save
pm2 startup
```

---

### 2. ทดสอบ Server 1

**จาก Server 1 เอง:**

```bash
# ทดสอบว่า Server 1 เข้าถึง PBASS ได้
curl -k https://10.120.10.72/PBASS_API/INVINCOM \
  -H "Authorization: Bearer YOUR_TOKEN"

# ทดสอบ proxy endpoint
curl http://localhost:3001/api/pbass/invincom \
  -H "Authorization: Bearer YOUR_TOKEN"

# ทดสอบ health check
curl http://localhost:3001/health
```

**จาก OneInv Server (192.198.101.225):**

```bash
# ทดสอบว่า OneInv เข้าถึง Server 1 ได้
curl http://192.168.101.219:3001/health

# ทดสอบเรียก API ผ่าน Server 1
curl http://192.168.101.219:3001/api/pbass/invincom \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. เปิด Firewall บน Server 1

**Windows Firewall:**

```powershell
New-NetFirewallRule -DisplayName "PBASS Proxy" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

**Linux iptables:**

```bash
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
sudo iptables-save
```

**Linux ufw:**

```bash
sudo ufw allow 3001/tcp
```

---

### 4. อัปเดต OneInv Configuration

**แก้ไข `.env`:**

```bash
# เปลี่ยนจาก
PBASS_API_URL="https://10.120.10.72/PBASS_API/INVINCOM"

# เป็น
PBASS_API_URL="http://192.168.101.219:3001/api/pbass/invincom"
PBASS_API_IGNORE_SSL=false
```

**Restart OneInv:**

```bash
# กด Ctrl+C
npm run dev
```

---

### 5. ทดสอบ End-to-End

**จาก OneInv:**

```bash
curl http://localhost:3000/api/test-connection
```

**ผลลัพธ์ที่คาดหวัง:**

```json
{
  "success": true,
  "message": "Connected successfully. Found 333 records.",
  "latency": 1234,
  "timestamp": "2026-02-11T07:48:00.000Z"
}
```

---

## Monitoring & Troubleshooting

### ดู Logs

**nginx:**

```bash
# Access log
tail -f /var/log/nginx/pbass-access.log

# Error log
tail -f /var/log/nginx/pbass-error.log
```

**Node.js Proxy:**

```bash
# ถ้าใช้ PM2
pm2 logs pbass-proxy

# ถ้ารันด้วย node โดยตรง
# ดูใน console
```

### ปัญหาที่พบบ่อย

**1. Connection Refused**

```bash
# เช็คว่า proxy รันอยู่หรือไม่
netstat -an | grep 3001

# เช็ค firewall
sudo ufw status
```

**2. 502 Bad Gateway (nginx)**

```bash
# เช็คว่า Server 1 เข้าถึง PBASS ได้หรือไม่
curl -k https://10.120.10.72/PBASS_API/INVINCOM
```

**3. 401 Unauthorized**

```bash
# เช็คว่า JWT Token ถูกส่งไปหรือไม่
# ดูใน nginx access log หรือ Node.js console
```

---

## Security Considerations

### 1. ใช้ HTTPS สำหรับ OneInv → Server 1

ถ้าต้องการความปลอดภัยเพิ่ม ให้ Server 1 ใช้ HTTPS:

```nginx
server {
    listen 3001 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    # ... rest of config
}
```

### 2. IP Whitelisting

จำกัดให้เฉพาะ OneInv เข้าถึง Server 1:

```nginx
location /api/pbass/invincom {
    allow 192.198.101.225;
    deny all;
    # ... rest of config
}
```

### 3. Rate Limiting

ป้องกัน abuse:

```nginx
limit_req_zone $binary_remote_addr zone=pbass:10m rate=10r/s;

location /api/pbass/invincom {
    limit_req zone=pbass burst=20;
    # ... rest of config
}
```

---

## Performance Tuning

### nginx

```nginx
# เพิ่ม connection pooling
upstream pbass_backend {
    server 10.120.10.72:443;
    keepalive 32;
}

location /api/pbass/invincom {
    proxy_pass https://pbass_backend/PBASS_API/INVINCOM;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    # ... rest of config
}
```

### Node.js

```javascript
// เพิ่ม connection pooling
const https = require('https');
const keepAliveAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 50
});

// ใช้ใน fetch
fetch(url, { agent: keepAliveAgent });
```

---

## Backup & High Availability

ถ้าต้องการ redundancy สามารถตั้ง Server 1 หลายเครื่อง:

```
OneInv → Load Balancer → Server 1A (192.168.101.219)
                      → Server 1B (192.168.101.220)
```

---

## สรุป

✅ Server 1 ทำหน้าที่เป็น API Gateway/Proxy
✅ OneInv ไม่ต้องเข้าถึง subnet 10.120.x.x โดยตรง
✅ ใช้ HTTP ธรรมดา (ไม่ต้อง SSL/Proxy authentication)
✅ ง่ายต่อการ monitor และ debug

---

## Next Steps

1. ติดตั้ง proxy บน Server 1
2. ทดสอบการเชื่อมต่อ
3. อัปเดต OneInv config
4. ทดสอบ end-to-end
5. Setup monitoring
6. (Optional) เพิ่ม HTTPS และ security features
