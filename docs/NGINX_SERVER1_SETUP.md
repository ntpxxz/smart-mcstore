# คู่มือติดตั้ง nginx Proxy บน Server 1

## ข้อมูล Server

- **Server 1 IP (OneInv side)**: 192.168.101.219
- **Server 1 IP (PBASS side)**: 10.120.122.10
- **PBASS API**: 10.120.10.72
- **Port**: 3001

---

## ขั้นตอนการติดตั้ง

### 1. Copy Config File ไปยัง Server 1

**จาก OneInv Server:**

```powershell
# Copy nginx config ไปยัง Server 1
Copy-Item "e:\SAM\MCINVENT\oneinv\docs\nginx-pbass-proxy.conf" "\\192.168.101.219\C$\nginx\conf\conf.d\pbass-proxy.conf"
```

**หรือ Manual Copy:**

1. เปิดไฟล์ `docs/nginx-pbass-proxy.conf`
2. Copy เนื้อหาทั้งหมด
3. บน Server 1, สร้างไฟล์:
   - **Linux**: `/etc/nginx/conf.d/pbass-proxy.conf`
   - **Windows**: `C:\nginx\conf\conf.d\pbass-proxy.conf`
4. Paste เนื้อหาลงไป

---

### 2. ตรวจสอบ nginx Config

**บน Server 1:**

```bash
# Linux
sudo nginx -t

# Windows
cd C:\nginx
nginx.exe -t
```

**ผลลัพธ์ที่ต้องการ:**

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

---

### 3. Reload nginx

**Linux:**

```bash
sudo systemctl reload nginx
# หรือ
sudo nginx -s reload
```

**Windows:**

```powershell
cd C:\nginx
nginx.exe -s reload
```

---

### 4. ตรวจสอบว่า nginx รันอยู่

**Linux:**

```bash
sudo systemctl status nginx
sudo netstat -tlnp | grep 3001
```

**Windows:**

```powershell
Get-Process nginx
netstat -an | findstr 3001
```

**ควรเห็น:**

```
TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING
```

---

### 5. เปิด Firewall Port 3001

**Windows Firewall:**

```powershell
New-NetFirewallRule -DisplayName "PBASS Proxy" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

**Linux iptables:**

```bash
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4
```

**Linux ufw:**

```bash
sudo ufw allow 3001/tcp
sudo ufw reload
```

---

### 6. ทดสอบการทำงาน

#### **ทดสอบจาก Server 1 เอง:**

```bash
# ทดสอบ health check
curl http://localhost:3001/health
# ควรได้: OK

# ทดสอบเรียก PBASS API (ต้องใส่ JWT Token)
curl http://localhost:3001/api/pbass/invincom \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyaWQiOiJCUFRKODI1IiwiZGl2aXNpb24iOiJUMjcxRE0iLCJhcGluYW1lIjoiSU5WSU5DT00iLCJleHAiOjE3Nzg1Njk1ODksImlzcyI6IkRFViIsImF1ZCI6Imh0dHA6Ly9kZXZfZGVtby5jb20ifQ.HKxhE34t_6JHEstwFeWf2UvKvQUGAKQVscR3h4kXT4w"
```

#### **ทดสอบจาก OneInv Server (192.198.101.225):**

```powershell
# ทดสอบ health check
curl http://192.168.101.219:3001/health

# ทดสอบเรียก API
curl http://192.168.101.219:3001/api/pbass/invincom `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyaWQiOiJCUFRKODI1IiwiZGl2aXNpb24iOiJUMjcxRE0iLCJhcGluYW1lIjoiSU5WSU5DT00iLCJleHAiOjE3Nzg1Njk1ODksImlzcyI6IkRFViIsImF1ZCI6Imh0dHA6Ly9kZXZfZGVtby5jb20ifQ.HKxhE34t_6JHEstwFeWf2UvKvQUGAKQVscR3h4kXT4w"
```

#### **ทดสอบผ่าน OneInv Application:**

```powershell
# ทดสอบ connection test
curl http://localhost:3000/api/test-connection
```

**ผลลัพธ์ที่คาดหวัง:**

```json
{
  "success": true,
  "message": "Connected successfully. Found XXX records.",
  "latency": 1234,
  "timestamp": "2026-02-11T08:36:00.000Z"
}
```

---

## การดู Logs

### **nginx Access Log:**

```bash
# Linux
tail -f /var/log/nginx/pbass-access.log

# Windows
Get-Content C:\nginx\logs\pbass-access.log -Wait -Tail 50
```

### **nginx Error Log:**

```bash
# Linux
tail -f /var/log/nginx/pbass-error.log

# Windows
Get-Content C:\nginx\logs\pbass-error.log -Wait -Tail 50
```

---

## Troubleshooting

### ❌ **ปัญหา: nginx ไม่ start**

```bash
# เช็ค error log
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### ❌ **ปัญหา: Port 3001 ถูกใช้งานอยู่**

```bash
# Linux
sudo netstat -tlnp | grep 3001
sudo lsof -i :3001

# Windows
netstat -ano | findstr 3001
```

### ❌ **ปัญหา: 502 Bad Gateway**

หมายความว่า nginx ทำงาน แต่เชื่อมต่อ PBASS API ไม่ได้

```bash
# ทดสอบว่า Server 1 เข้าถึง PBASS ได้หรือไม่
curl -k https://10.120.10.72/PBASS_API/INVINCOM

# เช็ค nginx error log
tail -f /var/log/nginx/pbass-error.log
```

### ❌ **ปัญหา: 401 Unauthorized**

JWT Token ไม่ถูกต้องหรือหมดอายุ

```bash
# เช็คว่า Authorization header ถูกส่งไปหรือไม่
# ดูใน nginx access log
```

### ❌ **ปัญหา: Connection Timeout**

```bash
# เพิ่ม timeout ใน nginx config
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;

# แล้ว reload
sudo nginx -s reload
```

---

## Performance Tuning (Optional)

### เพิ่ม Connection Pooling

```nginx
upstream pbass_backend {
    server 10.120.10.72:443;
    keepalive 32;
}

server {
    location /api/pbass/invincom {
        proxy_pass https://pbass_backend/PBASS_API/INVINCOM;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        # ... rest of config
    }
}
```

### เพิ่ม Caching (ถ้าข้อมูลไม่เปลี่ยนบ่อย)

```nginx
proxy_cache_path /var/cache/nginx/pbass levels=1:2 keys_zone=pbass_cache:10m max_size=100m inactive=60m;

location /api/pbass/invincom {
    proxy_cache pbass_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$request_uri|$http_authorization";
    # ... rest of config
}
```

---

## Security Hardening (Optional)

### 1. IP Whitelisting

```nginx
location /api/pbass/invincom {
    # อนุญาตเฉพาะ OneInv Server
    allow 192.198.101.225;
    deny all;
    # ... rest of config
}
```

### 2. Rate Limiting

```nginx
limit_req_zone $binary_remote_addr zone=pbass:10m rate=10r/s;

location /api/pbass/invincom {
    limit_req zone=pbass burst=20 nodelay;
    # ... rest of config
}
```

### 3. ใช้ HTTPS สำหรับ OneInv → Server 1

```nginx
server {
    listen 3001 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    # ... rest of config
}
```

---

## Monitoring

### ตั้งค่า Health Check Monitoring

```bash
# สร้าง cron job ตรวจสอบทุก 5 นาที
*/5 * * * * curl -f http://localhost:3001/health || systemctl restart nginx
```

### ดูสถิติการใช้งาน

```bash
# จำนวน requests
cat /var/log/nginx/pbass-access.log | wc -l

# Top 10 IPs
cat /var/log/nginx/pbass-access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -10

# Response times
cat /var/log/nginx/pbass-access.log | awk '{print $NF}' | sort -n
```

---

## สรุป

✅ nginx ทำหน้าที่เป็น Reverse Proxy
✅ รับ request จาก OneInv ที่ port 3001
✅ Forward ไปยัง PBASS API ที่ 10.120.10.72:443
✅ ส่ง JWT Token ผ่าน Authorization header
✅ รองรับ SSL/TLS (proxy_ssl_verify off)

---

## Next Steps

1. ✅ ติดตั้ง nginx config บน Server 1
2. ✅ ทดสอบการเชื่อมต่อ
3. ✅ ทดสอบผ่าน OneInv
4. (Optional) เพิ่ม monitoring และ security features
