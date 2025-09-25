# ATHENA Deployment Guide

## Overview

This guide covers deploying the ATHENA reward ecosystem in various environments, from development to production.

## Prerequisites

### System Requirements
- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB+ recommended for production)
- **Storage**: 10GB+ available space
- **OS**: Linux (Ubuntu 20.04+), macOS, or Windows

### Software Requirements
- **Python**: 3.12+
- **Node.js**: 18+
- **Git**: Latest version
- **Docker**: 20.10+ (optional)

## Environment Setup

### Development Environment

#### Backend Setup
```bash
# Clone repository
git clone <repository-url>
cd ATHENA/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --port 3000
```

#### Frontend Setup
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

#### Environment Variables
```bash
# Backend (.env)
DATABASE_URL=sqlite:///./athena.db
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:3001

# Frontend (.env.local)
NEXT_PUBLIC_API_BASE=http://localhost:3000
```

### Production Environment

#### Backend Production Setup

**Option 1: Direct Deployment**
```bash
# Install system dependencies
sudo apt update
sudo apt install python3.12 python3.12-venv nginx

# Create application user
sudo useradd -m -s /bin/bash athena
sudo su - athena

# Clone and setup application
git clone <repository-url>
cd ATHENA/backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Install production server
pip install gunicorn

# Create systemd service
sudo nano /etc/systemd/system/athena-backend.service
```

**Systemd Service Configuration:**
```ini
[Unit]
Description=ATHENA Backend API
After=network.target

[Service]
Type=exec
User=athena
Group=athena
WorkingDirectory=/home/athena/ATHENA/backend
Environment=PATH=/home/athena/ATHENA/backend/venv/bin
ExecStart=/home/athena/ATHENA/backend/venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:3000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

**Option 2: Docker Deployment**
```dockerfile
# Dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 3000

CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:3000"]
```

```bash
# Build and run
docker build -t athena-backend .
docker run -p 3000:3000 -v $(pwd)/athena.db:/app/athena.db athena-backend
```

#### Frontend Production Setup

**Option 1: Static Export**
```bash
# Build static files
npm run build
npm run export

# Serve with nginx
sudo cp -r out/* /var/www/html/
```

**Option 2: Node.js Server**
```bash
# Build application
npm run build

# Install PM2 for process management
npm install -g pm2

# Create PM2 configuration
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'athena-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/ATHENA/frontend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Option 3: Docker Deployment**
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/out ./out
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001
CMD ["npm", "start"]
```

## Nginx Configuration

### Reverse Proxy Setup
```nginx
# /etc/nginx/sites-available/athena
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Documentation
    location /docs {
        proxy_pass http://localhost:3000/docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL Configuration
```nginx
# SSL configuration
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Same location blocks as above
}
```

## Database Management

### SQLite Production Setup
```bash
# Create database directory
sudo mkdir -p /var/lib/athena
sudo chown athena:athena /var/lib/athena

# Set up database
cd /home/athena/ATHENA/backend
python -c "from app.db import create_db_and_tables; create_db_and_tables()"

# Set up backups
sudo crontab -e
# Add: 0 2 * * * /home/athena/ATHENA/backend/backup_db.sh
```

### Database Backup Script
```bash
#!/bin/bash
# backup_db.sh
BACKUP_DIR="/var/backups/athena"
DB_PATH="/var/lib/athena/athena.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/athena_$DATE.db
find $BACKUP_DIR -name "athena_*.db" -mtime +7 -delete
```

### PostgreSQL Migration (Optional)
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE athena;
CREATE USER athena_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE athena TO athena_user;
\q

# Update database URL
export DATABASE_URL=postgresql://athena_user:secure_password@localhost/athena
```

## Monitoring and Logging

### Application Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor application logs
journalctl -u athena-backend -f
pm2 logs athena-frontend
```

### Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/athena
```

```bash
# /etc/logrotate.d/athena
/var/log/athena/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 athena athena
    postrotate
        systemctl reload athena-backend
    endscript
}
```

### Health Checks
```bash
# Create health check script
cat > /home/athena/health_check.sh << 'EOF'
#!/bin/bash
# Check backend
if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "Backend health check failed"
    systemctl restart athena-backend
fi

# Check frontend
if ! curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo "Frontend health check failed"
    pm2 restart athena-frontend
fi
EOF

chmod +x /home/athena/health_check.sh

# Add to crontab
crontab -e
# Add: */5 * * * * /home/athena/health_check.sh
```

## Security Configuration

### Firewall Setup
```bash
# Configure UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000  # Block direct access to backend
sudo ufw deny 3001  # Block direct access to frontend
```

### SSL Certificate
```bash
# Using Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Environment Security
```bash
# Secure environment variables
sudo nano /etc/environment
# Add: ATHENA_SECRET_KEY=your-secret-key-here

# Restrict file permissions
sudo chmod 600 /home/athena/ATHENA/backend/.env
sudo chown athena:athena /home/athena/ATHENA/backend/.env
```

## Scaling and Performance

### Horizontal Scaling
```bash
# Load balancer configuration
upstream athena_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

upstream athena_frontend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}
```

### Caching
```nginx
# Add caching to nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 1m;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
}
```

### Database Optimization
```sql
-- Create additional indexes
CREATE INDEX idx_interaction_created_at ON interaction(created_at);
CREATE INDEX idx_transfer_created_at ON tokentransfer(created_at);
CREATE INDEX idx_user_company_segment ON user(company_id, segment);

-- Analyze query performance
EXPLAIN QUERY PLAN SELECT * FROM interaction WHERE company_id = 1;
```

## Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check logs
journalctl -u athena-backend -n 50

# Check port availability
sudo netstat -tlnp | grep :3000

# Check permissions
ls -la /home/athena/ATHENA/backend/
```

#### Frontend Build Fails
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version
npm --version
```

#### Database Issues
```bash
# Check database file
ls -la /var/lib/athena/athena.db

# Test database connection
sqlite3 /var/lib/athena/athena.db ".tables"

# Check database integrity
sqlite3 /var/lib/athena/athena.db "PRAGMA integrity_check;"
```

#### Performance Issues
```bash
# Monitor system resources
htop
iotop
nethogs

# Check application logs
tail -f /var/log/athena/application.log

# Profile database queries
sqlite3 /var/lib/athena/athena.db "EXPLAIN QUERY PLAN SELECT * FROM interaction WHERE company_id = 1;"
```

### Recovery Procedures

#### Application Recovery
```bash
# Restart services
sudo systemctl restart athena-backend
pm2 restart athena-frontend

# Check service status
sudo systemctl status athena-backend
pm2 status
```

#### Database Recovery
```bash
# Restore from backup
sudo systemctl stop athena-backend
sudo cp /var/backups/athena/athena_20240101_020000.db /var/lib/athena/athena.db
sudo chown athena:athena /var/lib/athena/athena.db
sudo systemctl start athena-backend
```

#### Full System Recovery
```bash
# Reinstall from scratch
sudo systemctl stop athena-backend
pm2 stop athena-frontend

# Restore application
cd /home/athena
rm -rf ATHENA
git clone <repository-url>
cd ATHENA/backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Restore database
sudo cp /var/backups/athena/latest.db /var/lib/athena/athena.db

# Restart services
sudo systemctl start athena-backend
cd ../frontend
npm install
npm run build
pm2 start ecosystem.config.js
```

## Maintenance

### Regular Maintenance Tasks
```bash
# Daily tasks
- Check application logs
- Monitor system resources
- Verify backups

# Weekly tasks
- Update dependencies
- Clean old logs
- Check disk space

# Monthly tasks
- Security updates
- Performance review
- Backup verification
```

### Update Procedures
```bash
# Update application
cd /home/athena/ATHENA
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart athena-backend

# Update frontend
cd ../frontend
npm install
npm run build
pm2 restart athena-frontend
```

## Support and Monitoring

### Monitoring Tools
- **System**: htop, iotop, nethogs
- **Application**: journalctl, pm2 logs
- **Database**: sqlite3 command line
- **Network**: nginx access logs

### Alerting
- Set up monitoring alerts for critical services
- Configure email notifications for failures
- Monitor disk space and memory usage
- Track application performance metrics

### Documentation
- Keep deployment documentation updated
- Document any custom configurations
- Maintain runbooks for common issues
- Record all changes and updates
