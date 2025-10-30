# DBS Bank Homepage API - Complete Project Overview

## 🎯 Project Purpose

**DBS Bank Homepage API** is a RESTful backend application that powers an e-commerce platform for digital gift vouchers and rewards. The system allows users to browse brands, products, apply promotions, manage shopping carts, and place orders with coupon support.

---

## 🏗️ Architecture Overview

### Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js v5.1.0
- **Database**: MySQL
- **ORM**: Sequelize v6.37.7
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Custom encryption/decryption middleware using CryptoJS

### Architecture Pattern: MVC (Model-View-Controller)

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│                   (Mobile/Web App)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS Request (Encrypted)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    ROUTES LAYER                              │
│              (web.routes.js, order.routes.js)                │
│            - Route definitions                               │
│            - Middleware application                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  MIDDLEWARE LAYER                            │
│         - Decryption (decrypt request body)                  │
│         - Authentication (JWT validation)                    │
│         - Encryption (encrypt response)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 CONTROLLERS LAYER                            │
│         - Request validation                                 │
│         - Call service layer                                 │
│         - Format response                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  SERVICES LAYER                              │
│         - Business logic                                     │
│         - Data transformation                                │
│         - Database operations via models                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   MODELS LAYER                               │
│         - Sequelize ORM models                               │
│         - Database schema definitions                        │
│         - Associations (relationships)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   MySQL DATABASE                             │
│         - Users, Products, Brands, Orders                    │
│         - Cart, Coupons, Promotions, OTP                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
HomePageApi/
│
├── 📂 config/                      # Configuration files
│   └── config.json                 # Database & app config
│
├── 📂 controllers/                 # Request handlers
│   ├── brandCategoryController.js
│   ├── brandsByCategoryController.js
│   ├── brandWithProductsController.js
│   ├── orderController.js
│   ├── pageContentController.js
│   ├── cartController/             # Cart operations
│   │   ├── addToCartController.js
│   │   ├── getCartItemsController.js
│   │   ├── updateCartItemController.js
│   │   └── removeCartItemController.js
│   └── loginRegisterController/    # Authentication
│       ├── checkUserExistenceController.js
│       └── verifyOtpController.js
│
├── 📂 models/                      # Sequelize ORM models
│   ├── index.js                    # Central model loader
│   ├── user.model.js
│   ├── brand.model.js
│   ├── product.model.js
│   ├── cart_items.model.js
│   ├── order.model.js
│   ├── order_details.model.js
│   ├── coupon_code.model.js
│   └── ... (15+ models)
│
├── 📂 services/                    # Business logic
│   ├── brandCategory.service.js
│   ├── brandsByCategory.service.js
│   ├── brandWithProducts.service.js
│   ├── createOrder.service.js
│   ├── couponHelpers.service.js
│   ├── orderHelpers.service.js
│   ├── pageContent.service.js
│   ├── cartService/
│   │   ├── addToCartService.js
│   │   ├── getCartItemsService.js
│   │   ├── updateCartItemService.js
│   │   └── removeCartItemService.js
│   └── loginRegisterService/
│       ├── checkUserAndSendOtp.service.js
│       └── verifyOtp.service.js
│
├── 📂 routes/                      # API routes
│   ├── web.routes.js               # Main routes
│   └── order.routes.js             # Order-specific routes
│
├── 📂 middlewares/                 # Express middlewares
│   ├── auth.middleware.js          # JWT authentication
│   ├── encryption.middleware.js    # Response encryption
│   └── decryption.middleware.js    # Request decryption
│
├── 📂 migrations/                  # Database migrations
│   ├── 20251008085009-create-users-table.js
│   ├── 20251014092543-create-cart-items-table.js
│   ├── 20251017121726-create-orders-table.js
│   └── ... (12 migration files)
│
├── 📂 utils/                       # Utility helpers
│   ├── logger.util.js              # Centralized logging
│   ├── crypto.util.js              # Encryption/decryption
│   └── constants.js                # App constants
│
├── 📂 logs/                        # Auto-generated logs
│   ├── info-YYYY-MM-DD.log
│   ├── error-YYYY-MM-DD.log
│   └── success-YYYY-MM-DD.log
│
├── 📂 NOTES/                       # Documentation
│   ├── helper/
│   └── project-documentation/
│
├── server.js                       # Entry point
├── package.json                    # Dependencies
└── .env                            # Environment variables
```

---

## 🔑 Key Features

### 1. **User Authentication (OTP-based)**
- Phone number-based registration/login
- OTP generation and verification
- JWT token generation for session management

### 2. **Product Catalog**
- Browse brands by categories
- View brand details with products
- Product variations (denominations)
- Promotions and discounts

### 3. **Shopping Cart**
- Add products to cart
- Update quantities (increment/decrement)
- Remove items
- Apply promocodes to cart items

### 4. **Order Management**
- Create orders from cart
- Apply coupons for discounts
- Sequential coupon distribution across line items
- Support for multiple payment methods
- Transaction tracking

### 5. **Promotions & Coupons**
- Percentage discounts (DIS)
- Absolute value discounts (ABS)
- Combo offers (COMBO)
- Buy X Get Y offers
- Coupon validation (expiry, usage limits, minimum order value)

### 6. **Security**
- Request/Response encryption using CryptoJS (AES)
- JWT-based authentication
- Secure API endpoints

### 7. **Logging**
- Centralized logging system
- Service-level logging (info, success, error, debug)
- Daily log rotation

---

## 🌐 API Base URL

```
http://localhost:5000/dbsbank-api/api/v1
```

---

## 📊 Database Schema

### Core Tables:
1. **users** - User accounts
2. **otp** - OTP records for authentication
3. **brands** - Gift voucher brands (Amazon, Flipkart, etc.)
4. **categories** - Brand categories (Health, Entertainment, etc.)
5. **products** - Product variations (₹100, ₹500, ₹1000)
6. **cart_items** - User shopping cart
7. **orders** - Order records
8. **order_details** - Line items in orders
9. **transactions** - Payment transactions
10. **coupon_code** - Discount coupons
11. **promotions** - Promotional campaigns
12. **promocodes** - Promotion codes
13. **promotion_x_product** - Product-promotion mapping

---

## 🔄 Request/Response Flow Example

### Example: Create Order API

```
1. CLIENT REQUEST (Encrypted)
   POST /dbsbank-api/api/v1/order/create
   Headers: { Authorization: "Bearer <JWT>" }
   Body: { encryptedData: "U2FsdGVkX1..." }

2. DECRYPTION MIDDLEWARE
   - Decrypts request body
   - Extracts: { userId, cartItemIds, couponCode, displayType }

3. AUTH MIDDLEWARE
   - Validates JWT token
   - Extracts user information
   - Attaches to req.user

4. ORDER CONTROLLER
   - Validates input
   - Calls createOrder service

5. CREATE ORDER SERVICE
   - Starts database transaction
   - Validates coupon (if provided)
   - Fetches cart items
   - Calculates totals
   - Distributes coupon discount
   - Applies promotions
   - Creates order record
   - Creates order detail records
   - Creates transaction records
   - Commits transaction
   - Returns order summary

6. CONTROLLER RESPONSE
   - Formats response
   - Returns JSON

7. CLIENT RECEIVES
   {
     "orderId": 789,
     "orderGuid": "DBS-123456-1698765005",
     "totalAmount": 5000,
     "payuAmount": 4500,
     "couponDiscount": 500
   }
```

---

## 🛡️ Security Layers

### 1. **Data Encryption**
- All sensitive requests/responses encrypted with AES
- Encryption key stored in config

### 2. **Authentication**
- JWT tokens for user sessions
- Token validation on protected routes

### 3. **Authorization**
- User-specific data access
- Cart and order operations require authentication

### 4. **Input Validation**
- Request parameter validation
- Data type checking
- Business rule validation

---

## 🚀 Performance Optimizations

1. **Bulk Operations**: Using Sequelize `bulkCreate` for multiple inserts
2. **Eager Loading**: Loading related data in single queries
3. **Connection Pooling**: Sequelize manages MySQL connections
4. **Logging Control**: Can disable console logs in production
5. **Transaction Management**: Ensures data consistency

---

## 📝 Logging System

Every service operation is logged:
- **Entry logs**: Function start with parameters
- **Success logs**: Successful operations with results
- **Error logs**: Failures with stack traces
- **Debug logs**: Detailed execution information

Log files stored in `logs/` directory with daily rotation.

---

## 🔧 Configuration

All configuration in `config/config.json`:
- Database credentials
- JWT secret
- Encryption key
- Server port

---

## 📦 Dependencies

**Core:**
- express: Web framework
- sequelize: ORM
- mysql2: MySQL driver
- jsonwebtoken: JWT handling
- crypto-js: Encryption

**Dev:**
- nodemon: Auto-restart server
- sequelize-cli: Database migrations

---

## 🎯 Business Logic Highlights

### Coupon Distribution Algorithm
Coupons are distributed **sequentially** across cart items:
- If coupon = ₹600 and items = [₹500, ₹300, ₹200]
- Item 1 gets ₹500 discount → pays ₹0
- Item 2 gets ₹100 discount → pays ₹200
- Item 3 gets ₹0 discount → pays ₹200

### Promotion Types
- **DIS**: Percentage discount on product price
- **ABS**: Fixed amount discount
- **COMBO**: Buy X, get Y at discount
- **OFFER**: Free product with purchase

---

## 📚 Related Documentation Files

1. `01-project-overview.md` (this file)
2. `02-setup-guide.md` - Step-by-step setup
3. `03-api-endpoints.md` - All API documentation
4. `04-database-schema.md` - Database structure
5. `05-request-flow.md` - Detailed flow diagrams
6. `06-coding-conventions.md` - Code standards

---

**Project Type**: E-commerce Backend API  
**Author**: Gaurav Pandey  
**Version**: 1.0.0  
**Last Updated**: October 30, 2025
