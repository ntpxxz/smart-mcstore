# Docker Deployment Guide for OneInv

## 📋 สารบัญ

1. [ข้อกำหนดพื้นฐาน](#ข้อกำหนดพื้นฐาน)
2. [การติดตั้ง Docker](#การติดตั้ง-docker)
3. [การตั้งค่า Environment Variables](#การตั้งค่า-environment-variables)
4. [การ Build และ Run](#การ-build-และ-run)
5. [การ Deploy บนเครื่องอื่น](#การ-deploy-บนเครื่องอื่น)
6. [การจัดการ Database](#การจัดการ-database)
7. [Troubleshooting](#troubleshooting)

---

## ข้อกำหนดพื้นฐาน

### ซอฟต์แวร์ที่ต้องมี

- **Docker Desktop** (Windows/Mac) หรือ **Docker Engine** (Linux)
- **Docker Compose** v2.0+
- **Git** (สำหรับ clone repository)

### ระบบปฏิบัติการที่รองรับ

- ✅ Windows 10/11 Pro (with WSL2)
- ✅ Ubuntu 20.04+
- ✅ macOS 12+
- ✅ Debian 11+
- ✅ CentOS 8+

### ทรัพยากรต่ำสุดที่แนะนำ

- **RAM**: 4GB (แนะนำ 8GB+)
- **CPU**: 2 cores (แนะนำ 4 cores+)
- **Disk**: 10GB free space
- **Network**: Internet connection (สำหรับ download images)

---

## การติดตั้ง Docker

### Windows

1. **Download Docker Desktop:**
   - <https://www.docker.com/products/docker-desktop/>

2. **ติดตั้งและเปิดใช้งาน WSL2:**

   ```powershell
   wsl --install
   wsl --set-default-version 2
   ```

3. **Start Docker Desktop**

4. **ตรวจสอบการติดตั้ง:**

   ```powershell
   docker --version
   docker-compose --version
   ```

### Linux (Ubuntu/Debian)

```bash
# Update package index
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

---

## การตั้งค่า Environment Variables

### 1. สร้างไฟล์ `.env.docker`

```bash
# Copy from template
cp .env .env.docker
```

### 2. แก้ไขค่าใน `.env.docker`

```bash
# Database Configuration
DB_PASSWORD=your_secure_password_here
DATABASE_URL=postgresql://postgres:your_secure_password_here@postgres:5432/oneinv?schema=public

# Application URL (เปลี่ยนตาม IP ของเครื่องที่ deploy)
NEXT_PUBLIC_APP_URL=http://192.168.x.x:3000

# PBASS API Configuration
PBASS_API_URL=http://192.168.101.219:3001/api/pbass/invincom
PBASS_API_TIMEOUT=30000
PBASS_API_IGNORE_SSL=false
PBASS_API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: pgAdmin
PGADMIN_EMAIL=admin@oneinv.local
PGADMIN_PASSWORD=admin123
```

---

## การ Build และ Run

### วิธีที่ 1: ใช้ Docker Compose (แนะนำ)

```bash
# 1. Clone repository (ถ้ายังไม่ได้ clone)
git clone <repository-url>
cd oneinv

# 2. สร้างไฟล์ .env.docker
cp .env .env.docker
# แก้ไขค่าใน .env.docker

# 3. Build และ Run
docker compose --env-file .env.docker up -d

# 4. ตรวจสอบ logs
docker compose logs -f app

# 5. รอให้ migration และ seeding เสร็จ
# ควรเห็น: "Ready in XXXms"

# 6. เข้าใช้งาน
# เปิด browser: http://localhost:3000
```

### วิธีที่ 2: Build แยก

```bash
# 1. Build image
docker build -t oneinv:latest .

# 2. Run PostgreSQL
docker run -d \
  --name oneinv-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=oneinv \
  -p 5432:5432 \
  -v oneinv_postgres:/var/lib/postgresql/data \
  postgres:16-alpine

# 3. Run Application
docker run -d \
  --name oneinv-app \
  --link oneinv-postgres:postgres \
  -e DATABASE_URL=postgresql://postgres:postgres@postgres:5432/oneinv?schema=public \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  -p 3000:3000 \
  -v $(pwd)/files:/app/files \
  oneinv:latest
```

---

## การ Deploy บนเครื่องอื่น

### Scenario 1: Deploy บน Server ที่มี Docker

**ขั้นตอน:**

1. **Copy project ไปยัง Server:**

   ```bash
   # บนเครื่องต้นทาง
   tar -czf oneinv.tar.gz oneinv/
   scp oneinv.tar.gz user@192.168.x.x:/home/user/

   # บนเครื่อง Server
   tar -xzf oneinv.tar.gz
   cd oneinv
   ```

2. **ตั้งค่า Environment:**

   ```bash
   cp .env .env.docker
   nano .env.docker
   # แก้ไข NEXT_PUBLIC_APP_URL ให้เป็น IP ของ Server
   ```

3. **Run:**

   ```bash
   docker compose --env-file .env.docker up -d
   ```

4. **เปิด Firewall (ถ้าจำเป็น):**

   ```bash
   # Ubuntu/Debian
   sudo ufw allow 3000/tcp
   sudo ufw allow 5432/tcp
   
   # CentOS/RHEL
   sudo firewall-cmd --permanent --add-port=3000/tcp
   sudo firewall-cmd --reload
   ```

---

### Scenario 2: Deploy โดยใช้ Pre-built Image

**1. Build image บนเครื่องต้นทาง:**

```bash
docker build -t oneinv:v1.0 .
docker save oneinv:v1.0 > oneinv-v1.0.tar
```

**2. Copy image ไปยัง Server:**

```bash
scp oneinv-v1.0.tar user@192.168.x.x:/home/user/
```

**3. Load image บน Server:**

```bash
docker load < oneinv-v1.0.tar
```

**4. สร้าง docker-compose.yml:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: oneinv
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    image: oneinv:v1.0  # ใช้ image ที่ load มา
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/oneinv
      NEXT_PUBLIC_APP_URL: http://192.168.x.x:3000
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

**5. Run:**

```bash
docker compose up -d
```

---

### Scenario 3: Deploy โดยใช้ Docker Registry

**1. Push image to Docker Hub:**

```bash
docker tag oneinv:latest yourusername/oneinv:latest
docker push yourusername/oneinv:latest
```

**2. Pull และ run บน Server:**

```bash
docker pull yourusername/oneinv:latest
docker compose up -d
```

---

## การจัดการ Database

### Database Migration

```bash
# Run migration
docker compose exec app npx prisma migrate deploy

# Generate Prisma Client (ถ้าจำเป็น)
docker compose exec app npx prisma generate
```

### Database Seeding

```bash
# Run seed
docker compose exec app npx prisma db seed
```

### Backup Database

```bash
# Backup to file
docker compose exec postgres pg_dump -U postgres oneinv > backup_$(date +%Y%m%d_%H%M%S).sql

# หรือใช้ docker exec
docker exec oneinv-postgres pg_dump -U postgres oneinv > backup.sql
```

### Restore Database

```bash
# Restore from backup
cat backup.sql | docker compose exec -T postgres psql -U postgres oneinv

# หรือ
docker exec -i oneinv-postgres psql -U postgres oneinv < backup.sql
```

### เข้าใช้งาน PostgreSQL

```bash
# เข้า psql shell
docker compose exec postgres psql -U postgres oneinv

# หรือใช้ pgAdmin
# เปิด browser: http://localhost:5050
# Login: admin@oneinv.local / admin (ตามที่ตั้งใน .env)
```

---

## การจัดการ Container

### ดูสถานะ

```bash
# ดู running containers
docker compose ps

# ดู logs
docker compose logs app
docker compose logs postgres

# ดู logs แบบ real-time
docker compose logs -f app
```

### Stop/Start/Restart

```bash
# Stop ทั้งหมด
docker compose stop

# Start ทั้งหมด
docker compose start

# Restart
docker compose restart

# Restart เฉพาะ app
docker compose restart app
```

### Update และ Rebuild

```bash
# Pull latest code
git pull

# Rebuild และ restart
docker compose down
docker compose up -d --build
```

### ลบ Container และ Data

```bash
# Stop และลบ containers (เก็บ data)
docker compose down

# ลบทั้ง containers และ volumes (ลบ data ทั้งหมด!)
docker compose down -v

# ลบ images ที่ไม่ใช้แล้ว
docker system prune -a
```

---

## การตั้งค่า Network

### เชื่อมต่อกับ Server 1 (PBASS Proxy)

ถ้า deploy บนเครื่องอื่นและต้องการเชื่อมต่อกับ Server 1:

**1. ตรวจสอบว่าเครื่อง Docker เข้าถึง Server 1 ได้:**

```bash
# ทดสอบจากภายใน container
docker compose exec app curl http://192.168.101.219:3001/health
```

**2. ถ้าไม่ได้ ให้ใช้ host network mode:**

แก้ไข `docker-compose.yml`:

```yaml
services:
  app:
    network_mode: "host"
    # ลบ ports section ออก
```

**3. หรือเพิ่ม extra_hosts:**

```yaml
services:
  app:
    extra_hosts:
      - "server1:192.168.101.219"
    environment:
      PBASS_API_URL: http://server1:3001/api/pbass/invincom
```

---

## Monitoring และ Logging

### ตั้งค่า Logging

แก้ไข `docker-compose.yml`:

```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Health Checks

```bash
# ดู health status
docker compose ps
docker inspect --format='{{.State.Health.Status}}' oneinv-app
```

### Resource Usage

```bash
# ดูการใช้ทรัพยากร
docker stats

# ดูเฉพาะ OneInv
docker stats oneinv-app oneinv-postgres
```

---

## Troubleshooting

### ปัญหา: Container ไม่ start

```bash
# เช็ค logs
docker compose logs app

# เช็ค exit code
docker compose ps -a

# เข้าไปดูภายใน container (debug mode)
docker compose run --rm app sh
```

### ปัญหา: Database connection failed

```bash
# เช็คว่า postgres รันอยู่
docker compose ps postgres

# ทดสอบ connection
docker compose exec app npx prisma db pull

# Reset database
docker compose down -v
docker compose up -d
```

### ปัญหา: Port already in use

```bash
# หา process ที่ใช้ port 3000
# Windows
netstat -ano | findstr 3000

# Linux
lsof -i :3000

# เปลี่ยน port ใน docker-compose.yml
ports:
  - "3001:3000"  # ใช้ port 3001 แทน
```

### ปัญหา: Out of memory

```bash
# จำกัด memory usage
services:
  app:
    mem_limit: 1g
    mem_reservation: 512m
```

---

## Production Deployment Checklist

- [ ] เปลี่ยน default passwords ทั้งหมด
- [ ] ตั้งค่า `NODE_ENV=production`
- [ ] เปิด SSL/TLS (ใช้ reverse proxy เช่น nginx)
- [ ] ตั้งค่า backup scheduler
- [ ] เปิด firewall เฉพาะ ports ที่จำเป็น
- [ ] ตั้งค่า monitoring (Prometheus, Grafana)
- [ ] ทดสอบ disaster recovery plan
- [ ] เตรียม rollback strategy

---

## ตัวอย่าง Production Setup with nginx

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      -app
      
  app:
    # ... อื่นๆ
    expose:
      - "3000"
    # ไม่ต้อง publish port ออกนอก
```

---

## สรุป

✅ **Docker deployment ช่วยให้:**

- Deploy ง่ายและรวดเร็ว
- Portable (รันได้ทุกเครื่องที่มี Docker)
- Isolated environment
- ง่ายต่อการ scale
- Rollback ได้ง่าย

📚 **เอกสารเพิ่มเติม:**

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Prisma with Docker](https://www.prisma.io/docs/guides/deployment/deploy-to-docker)
