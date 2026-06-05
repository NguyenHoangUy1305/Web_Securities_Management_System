# Securities Management System

Hệ thống quản lý chứng khoán chuyên nghiệp — tương tự TradingView, VNDirect, SSI iBoard.  
Hiển thị dữ liệu thị trường thời gian thực, đặt lệnh mua/bán, quản lý danh mục đầu tư.

---

## 🚀 Quick Start

### Backend
```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate
php artisan db:seed --class=DatabaseSeeder
php artisan serve
```
👉 http://localhost:8000

### Frontend
```bash
cd frontend
npm install
npm run dev
```
👉 http://localhost:3000

---

## 🔐 Tài khoản Test

| Vai trò | Email | Password |
|---------|-------|----------|
| **Admin** | admin@securities.com | admin@123 |
| **Broker** | broker@securities.com | broker@123 |
| **Investor** | investor@securities.com | investor@123 |
| **Test** | test@example.com | password123 |

---

## 📋 Kiến trúc

### Công nghệ

| Layer | Công nghệ |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + TailwindCSS v4 + Redux Toolkit |
| **Backend** | PHP 8.3 + Laravel 12 |
| **Database** | SQL Server 2025 |
| **Auth** | JWT (tymon/jwt-auth) + Spatie Permission (RBAC) |
| **Charts** | TradingView Lightweight Charts |
| **Export** | OpenSpout (Excel), DomPDF (PDF) |

### Backend Pattern
- Clean Architecture (Repository + Service + DTO)
- JWT Authentication với 3 roles: admin, broker, investor
- RESTful API (92 routes)
- Event Driven + Queue Jobs

---

## ✨ Tính năng chi tiết

### 🔓 Public (không cần đăng nhập)

| Trang | Mô tả |
|-------|-------|
| **Dashboard** | Market overview, thống kê, top gainers/losers |
| **Securities** | Bảng 34 mã VN30 + ETF + Trái phiếu, tìm kiếm, lọc All/Stocks/ETFs/Bonds |
| **Market Data** | Biểu đồ nến TradingView, chọn mã xem OHLC |
| **News** | Tin tức tài chính (8 bài), sentiment badge |
| **Dividends** | Lịch cổ tức (11 kỳ), tìm kiếm theo mã |

### 🔐 Cần đăng nhập

| Trang | Mô tả |
|-------|-------|
| **Portfolio** | Danh mục đầu tư, P&L, asset allocation theo sector |
| **Orders** | Đặt lệnh Mua/Bán (Market/Limit/Stop), sổ lệnh, lịch sử orders |
| **Transactions** | Lịch sử giao dịch (API có sẵn, UI đang phát triển) |
| **Watchlist** | Theo dõi cổ phiếu yêu thích (API có sẵn) |
| **AI Assistant** | Hỏi đáp về chứng khoán (cần OPENAI_API_KEY) |

### 🔧 Admin (yêu cầu role admin)

| Trang | Mô tả |
|-------|-------|
| **Admin → Users** | Quản lý user, phân quyền, thêm/xóa |
| **Admin → Securities** | Thống kê, đồng bộ dữ liệu |
| **Admin → Settings** | Cấu hình API keys, market status |

### CRUD
- **Securities**: Thêm/Sửa/Xóa trên UI (admin)
- **Users**: Thêm/Sửa/Xóa trên UI (admin)
- Full Backend CRUD API cho tất cả modules

---

## 🗄️ Database

26 tables bao gồm:
- Users, Securities, Market Data, Technical Indicators
- Portfolios, Portfolio Items, Portfolio Dividends
- Orders, Transactions
- Watchlists, Watchlist Items
- News Articles, Dividends
- Spatie Permissions (roles, permissions, model_has_roles)

Seed data: 34 securities (VN30 + ETFs + Bonds), 8 news, 11 dividends, 170 market data records

---

## 📡 API

### Public Endpoints
```
GET  /api/securities           # Danh sách chứng khoán
GET  /api/securities/{id}      # Chi tiết
GET  /api/market-data/{id}/ohlc  # Dữ liệu OHLC
GET  /api/news                 # Tin tức
GET  /api/dividends            # Cổ tức
POST /api/login                # Đăng nhập
POST /api/register             # Đăng ký
```

### Protected Endpoints (cần JWT)
```
GET  /api/portfolios           # Danh mục đầu tư
GET  /api/orders               # Đơn đặt lệnh
POST /api/orders               # Đặt lệnh
GET  /api/transactions         # Lịch sử giao dịch
GET  /api/watchlists           # Watchlist
POST /api/ai/ask               # AI Assistant
```

---

## 📦 Docker

```bash
docker compose up -d
```

Chạy toàn bộ: backend (PHP-FPM), frontend (Nginx), SQL Server 2022, Redis, queue worker.

---

## 🔄 Đồng bộ dữ liệu thị trường

```bash
cd backend
php artisan sync:market-data           # Đồng bộ tất cả
php artisan sync:market-data --symbol=VCB  # Đồng bộ 1 mã
```

API keys trong `.env`:
```
FINNHUB_API_KEY=your_key_here
```

---

## 📊 So sánh với VNDirect

| Tính năng | Trạng thái |
|-----------|-----------|
| Bảng giá chứng khoán | ✅ 34 mã VN30 |
| Biểu đồ nến | ✅ TradingView Lightweight Charts |
| Đặt lệnh Mua/Bán | ✅ Market/Limit/Stop |
| Danh mục đầu tư | ✅ P&L, Asset Allocation |
| Tin tức | ✅ Sentiment analysis |
| Cổ tức | ✅ Lịch trả, tra cứu |
| CRUD Admin | ✅ Securities, Users |
| Phân quyền | ✅ Admin/Broker/Investor (RBAC) |
| WebSocket realtime | ⏳ Đang phát triển |
| AI Assistant | ✅ OpenAI + RAG |

---

## 🛠️ Development

```bash
# Backend
cd backend
php artisan serve
php artisan queue:work          # Xử lý jobs
php artisan sync:market-data    # Đồng bộ giá

# Frontend
cd frontend
npm run dev
```

**Tham khảo:** [VNDirect](https://banggia.vndirect.com.vn/) · [SSI iBoard](https://iboard.ssi.com.vn/) · [FireAnt](https://fireant.vn/) · [TradingView](https://www.tradingview.com/)
