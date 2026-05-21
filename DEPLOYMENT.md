# 🚀 Triven E-Commerce Backend — Deployment Guide

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.x |
| MongoDB | ≥ 7.0 |
| Redis | ≥ 7.x |
| Docker | ≥ 24.x |
| Docker Compose | ≥ 2.x |

---

## 📦 Local Development Setup

### 1. Clone & Install

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

### 3. Start Development Server

```bash
npm run dev
# Server: http://localhost:5000
# Swagger: http://localhost:5000/api/v1/docs
```

---

## 🐳 Docker Setup

### Start All Services

```bash
# Build and start all containers (MongoDB, Redis, API, Nginx)
docker-compose up -d --build

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

### Access Points

| Service | URL |
|---------|-----|
| API | http://localhost:5000 |
| Swagger | http://localhost:5000/api/v1/docs |
| MongoDB | mongodb://localhost:27017 |
| Redis | redis://localhost:6379 |

---

## 🖥️ Production Deployment (Ubuntu/Debian)

### 1. Server Setup

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl start mongod && sudo systemctl enable mongod

# Install Redis
sudo apt install -y redis-server
sudo systemctl start redis && sudo systemctl enable redis
```

### 2. Application Deploy

```bash
# Clone repository
git clone https://github.com/your-org/triven-ecommerce.git /var/www/triven-ecommerce
cd /var/www/triven-ecommerce/backend

# Install production dependencies
npm ci --only=production

# Copy and configure .env
cp .env.example .env
nano .env  # Fill in production credentials

# Start with PM2
npm run pm2:start

# Save PM2 process list for reboot
pm2 save
pm2 startup
```

### 3. Nginx Setup

```bash
# Install Nginx
sudo apt install -y nginx

# Copy Nginx config
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf

# Generate SSL certificate (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.triven.com

# Start Nginx
sudo systemctl start nginx && sudo systemctl enable nginx
```

---

## 🔧 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | ✅ | `development` / `production` |
| `PORT` | ✅ | Server port (default: 5000) |
| `MONGO_URI` | ✅ | MongoDB connection string |
| `REDIS_HOST` | ✅ | Redis host |
| `JWT_ACCESS_SECRET` | ✅ | Min 32 chars |
| `JWT_REFRESH_SECRET` | ✅ | Min 32 chars |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `RAZORPAY_KEY_ID` | ✅ | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay key secret |
| `SMTP_HOST` | ✅ | SMTP server host |
| `SMTP_USER` | ✅ | SMTP username |
| `SMTP_PASS` | ✅ | SMTP password |

---

## 📊 API Endpoints Summary

| Module | Endpoint | Auth |
|--------|----------|------|
| Auth | `POST /auth/register` | Public |
| Auth | `POST /auth/login` | Public |
| Auth | `POST /auth/logout` | Required |
| Auth | `POST /auth/refresh-token` | Public |
| Auth | `POST /auth/forgot-password` | Public |
| Auth | `POST /auth/reset-password` | Public |
| Auth | `GET /auth/verify-email` | Public |
| Auth | `POST /auth/send-otp` | Public |
| Users | `GET /users/profile` | Required |
| Users | `PUT /users/profile` | Required |
| Users | `POST /users/avatar` | Required |
| Users | `GET /users/addresses` | Required |
| Users | `POST /users/addresses` | Required |
| Users | `GET /users/wishlist` | Required |
| Products | `GET /products` | Public |
| Products | `GET /products/search` | Public |
| Products | `GET /products/featured` | Public |
| Products | `GET /products/:slug` | Public |
| Products | `POST /products` | Admin |
| Products | `PUT /products/:id` | Admin |
| Products | `DELETE /products/:id` | Admin |
| Categories | `GET /categories` | Public |
| Categories | `GET /categories/tree` | Public |
| Cart | `GET /cart` | Required |
| Cart | `POST /cart/items` | Required |
| Cart | `PUT /cart/items/:id` | Required |
| Cart | `DELETE /cart/items/:id` | Required |
| Cart | `POST /cart/coupon` | Required |
| Orders | `POST /orders` | Required |
| Orders | `GET /orders` | Required |
| Orders | `GET /orders/:id` | Required |
| Orders | `POST /orders/:id/cancel` | Required |
| Orders | `POST /orders/:id/return` | Required |
| Orders | `GET /orders/:id/invoice` | Required |
| Payments | `POST /payments/razorpay/:orderId` | Required |
| Payments | `POST /payments/razorpay/verify` | Required |
| Payments | `POST /payments/stripe/:orderId` | Required |
| Payments | `POST /payments/webhook/razorpay` | Webhook |
| Reviews | `GET /reviews/product/:id` | Public |
| Reviews | `POST /reviews` | Required |
| Coupons | `POST /coupons/validate` | Optional |
| Admin | `GET /admin/dashboard` | Admin |
| Admin | `GET /admin/reports/sales` | Admin |
| Admin | `GET /admin/users` | Admin |
| Admin | `GET /admin/orders` | Admin |
| Admin | `PATCH /admin/orders/:id/status` | Admin |
| Notifications | `GET /notifications` | Required |
| Notifications | `GET /notifications/unread-count` | Required |
| Notifications | `PATCH /notifications/:id/read` | Required |

---

## 🧪 Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Coverage report
npm run test:coverage
```

---

## 📈 Monitoring

```bash
# PM2 status
pm2 status

# PM2 logs
pm2 logs triven-ecommerce

# PM2 monitoring
pm2 monit
```

---

## 🔒 Security Checklist

- [x] HTTPS enforced via Nginx
- [x] JWT tokens with short expiry (15min access, 7d refresh)
- [x] Refresh token rotation on each use
- [x] bcrypt password hashing (cost factor 12)
- [x] Rate limiting on all endpoints
- [x] MongoDB operator injection protection
- [x] XSS sanitization
- [x] HTTP Parameter Pollution protection
- [x] Helmet security headers
- [x] CORS whitelist
- [x] Razorpay webhook signature verification (HMAC-SHA256, timing-safe)
- [x] Non-root Docker user
