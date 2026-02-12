# 🚀 Quick Start: Deploy OneInv with Docker

ใช้เวลาแค่ **5 นาที** ก็สามารถ deploy OneInv ด้วย Docker ได้แล้ว!

---

## 📋 ขั้นตอนย่อ

### 1. ติดตั้ง Docker

- **Windows**: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux**: `curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh`
- **Mac**: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 2. Clone Repository

```bash
git clone <repository-url>
cd oneinv
```

### 3. ตั้งค่า Environment

```bash
# Windows
copy .env .env.production

# Linux/Mac
cp .env .env.production
```

แก้ไขไฟล์ `.env.production`:

```bash
# แก้ไขเฉพาะตัวนี้ (IP ของเครื่องที่จะ deploy)
NEXT_PUBLIC_APP_URL=http://192.168.x.x:3000

# ถ้ามี PBASS API ให้ใส่
PBASS_API_URL=http://192.168.101.219:3001/api/pbass/invincom
PBASS_API_TOKEN=your_jwt_token_here
```

### 4. Deploy

```bash
# Windows
.\deploy.ps1 production --build

# Linux/Mac
chmod +x deploy.sh
./deploy.sh production --build
```

### 5. เข้าใช้งาน

เปิด browser: **<http://localhost:3000>**

---

## 🎯 นั่นแหละ! เสร็จแล้ว

Login ด้วย:

- **Username**: `admin@warehouse.os`
- **Password**: `admin123`

---

## 📚 อ่านเพิ่มเติม

- [Docker Deployment Guide (ฉบับเต็ม)](./DOCKER_DEPLOYMENT.md)
- [PBASS API Setup](./PBASS_API_SETUP.md)
- [Server 1 Bridge Setup](./SERVER1_BRIDGE_SETUP.md)

---

## 🔧 Commands ที่ใช้บ่อย

```bash
# ดู logs
docker compose --env-file .env.production logs -f app

# Restart
docker compose --env-file .env.production restart app

# Stop
docker compose --env-file .env.production stop

# Start
docker compose --env-file .env.production start

# ลบทั้งหมด (ระวัง! จะลบ database ด้วย)
docker compose --env-file .env.production down -v
```

---

## ❓ Troubleshooting

### Port 3000 ถูกใช้งานอยู่?

แก้ไข `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # ใช้ port 3001 แทน
```

### Database connection error?

```bash
# Reset database
docker compose --env-file .env.production down -v
docker compose --env-file .env.production up -d
```

### Container ไม่ start?

```bash
# ดู logs
docker compose --env-file .env.production logs app

# ลอง rebuild
docker compose --env-file .env.production up -d --build
```

---

## 🌐 Deploy บนเครื่องอื่น

### วิธีที่ 1: Copy Project

```bash
# บนเครื่องต้นทาง
tar -czf oneinv.tar.gz oneinv/
scp oneinv.tar.gz user@192.168.x.x:/home/user/

# บนเครื่อง Server
tar -xzf oneinv.tar.gz
cd oneinv
./deploy.sh production --build
```

### วิธีที่ 2: ใช้ Docker Image

```bash
# บนเครื่องต้นทาง: Build และ save image
docker build -t oneinv:v1.0 .
docker save oneinv:v1.0 > oneinv-v1.0.tar

# Copy ไปเครื่อง Server
scp oneinv-v1.0.tar user@192.168.x.x:/home/user/

# บนเครื่อง Server: Load และ run
docker load < oneinv-v1.0.tar
docker compose up -d
```

---

## 💡 Tips

### ใช้ CSV Fallback Mode

ถ้า PBASS API ยังไม่พร้อม ให้ใช้ CSV mode:

1. วาง CSV file ใน `files/INVINCOM_*.csv`
2. ตั้ง `PBASS_API_URL=""` ใน `.env.production`
3. Deploy ตามปกติ

### เปิด pgAdmin

```bash
# Start เฉพาะ pgAdmin
docker compose --env-file .env.production --profile tools up -d pgadmin

# เข้าใช้งาน: http://localhost:5050
# Login: admin@oneinv.local / admin
```

### Backup Database

```bash
# Backup
docker compose exec postgres pg_dump -U postgres oneinv > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20260212.sql | docker compose exec -T postgres psql -U postgres oneinv
```

---

**Happy Deploying! 🎉**
