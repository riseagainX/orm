 # DBS Bank API - Complete Setup Guide

## 📋 Prerequisites

Before setting up this project, ensure you have:

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **MySQL Server** (v5.7 or v8.0)
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Verify: `mysql --version`

3. **Git** (for version control)
   - Download from: https://git-scm.com/
   - Verify: `git --version`

4. **Code Editor** (VS Code recommended)
   - Download from: https://code.visualstudio.com/

---

## 🚀 Step-by-Step Setup

### Step 1: Clone/Create Project Directory

```bash
# If cloning from repository
git clone <repository-url>
cd HomePageApi

# OR create new directory
mkdir HomePageApi
cd HomePageApi
```

---

### Step 2: Initialize Node.js Project

```bash
# Initialize package.json
npm init -y

# Install dependencies
npm install express sequelize mysql2 jsonwebtoken crypto-js dotenv

# Install dev dependencies
npm install --save-dev nodemon sequelize-cli
```

---

### Step 3: Setup MySQL Database

#### 3.1 Create Database

Open MySQL command line or MySQL Workbench:

```sql  
-- Login to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE dbs_bank;

-- Verify database created
SHOW DATABASES;

-- Use the database
USE dbs_bank;
```

#### 3.2 Create MySQL User (Optional - Production)

```sql
-- Create user
CREATE USER 'dbsbank_user'@'localhost' IDENTIFIED BY 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON dbs_bank.* TO 'dbsbank_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;
```

---

### Step 4: Project Structure Setup

Create the following folder structure:

```bash
mkdir config
mkdir controllers
mkdir controllers/cartController
mkdir controllers/loginRegisterController
mkdir models
mkdir routes
mkdir services
mkdir services/cartService
mkdir services/loginRegisterService
mkdir middlewares
mkdir migrations
mkdir seeders
mkdir utils
mkdir logs
mkdir NOTES
mkdir NOTES/helper
mkdir NOTES/project-documentation
```

---

### Step 5: Configuration Files

#### 5.1 Create `config/config.json`

```json
{
  "development": {
    "username": "root",
    "password": "your_mysql_password",
    "database": "dbs_bank",
    "host": "localhost",
    "dialect": "mysql",
    "port": "3306",
    "JWT_SECRET": "your-secret-key-here",
    "encryptionKey": "your-encryption-key-here",
    "serverPort": 5000
  },
  "test": {
    "username": "root",
    "password": "your_mysql_password",
    "database": "dbs_bank_test",
    "host": "localhost",
    "dialect": "mysql"
  },
  "production": {
    "username": "production_user",
    "password": "production_password",
    "database": "dbs_bank_prod",
    "host": "production_host",
    "dialect": "mysql"
  }
}
```

#### 5.2 Create `.sequelizerc` (Root directory)

```javascript
const path = require('path');

module.exports = {
  'config': path.resolve('config', 'config.json'),
  'models-path': path.resolve('models'),
  'seeders-path': path.resolve('seeders'),
  'migrations-path': path.resolve('migrations')
};
```

#### 5.3 Update `package.json`

```json
{
  "name": "homepageapi",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "nodemon server.js",
    "dev": "nodemon server.js",
    "migrate": "npx sequelize-cli db:migrate",
    "migrate:undo": "npx sequelize-cli db:migrate:undo",
    "seed": "npx sequelize-cli db:seed:all"
  },
  "author": "Your Name",
  "license": "ISC",
  "description": "DBS Bank Homepage API",
  "dependencies": {
    "crypto": "^1.0.1",
    "crypto-js": "^4.2.0",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.15.1",
    "nodemon": "^3.1.10",
    "sequelize": "^6.37.7"
  },
  "devDependencies": {
    "sequelize-cli": "^6.6.3"
  }
}
```

---

### Step 6: Initialize Sequelize

```bash
# This creates config, models, migrations, seeders folders (if not exist)
npx sequelize-cli init
```

---

### Step 7: Create Models

#### 7.1 Create `models/index.js`

```javascript
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);

const config = require(__dirname + '/../config/config.json').development;
const db = {};

console.log("Loading models...");

// Create Sequelize connection 
const sequelize = new Sequelize(
  config.database, 
  config.username, 
  config.password, 
  {
    host: config.host,
    dialect: 'mysql',
    port: config.port,
    logging: false
  }
);

// Auto-load all model files
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 && 
      file !== basename && 
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(
      sequelize, 
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

// Setup model associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
```

#### 7.2 Create Individual Models

Example: `models/user.model.js`

```javascript
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.CHAR(1),
      defaultValue: 'A'
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'users',
    timestamps: false
  });

  User.associate = (models) => {
    // Define associations here
    User.hasMany(models.CartItem, { foreignKey: 'user_id' });
    User.hasMany(models.Order, { foreignKey: 'user_id' });
  };

  return User;
};
```

Repeat for all models (Brand, Product, Category, CartItem, Order, etc.)

---

### Step 8: Create Migrations

```bash
# Example: Create users table migration
npx sequelize-cli migration:generate --name create-users-table
```

Edit the migration file in `migrations/` folder:

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(15),
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.CHAR(1),
        defaultValue: 'A'
      },
      created: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
```

---

### Step 9: Run Migrations

```bash
# Run all migrations
npm run migrate

# OR
npx sequelize-cli db:migrate 

# To undo last migration
npm run migrate:undo    

```
---

### Step 10: Create Utility Files

#### 10.1 Create `utils/logger.util.js`

(Copy from existing logger.util.js or refer to NOTES/helper/logger_helper_guide.md)

#### 10.2 Create `utils/crypto.util.js`

```javascript
const CryptoJS = require('crypto-js');

class CryptoUtil {
  constructor(encryptionKey) {
    this.ENC_KEY = encryptionKey;
  }

  encrypt(plain) {
    if (plain === undefined || plain === null) {
      throw new Error('encrypt: input is required');
    }
    const text = typeof plain === 'object' 
      ? JSON.stringify(plain) 
      : `${plain}`;
    return CryptoJS.AES.encrypt(text, this.ENC_KEY).toString();
  }

  decrypt(cipher) {
    if (!cipher) throw new Error('decrypt: cipher is required');
    const bytes = CryptoJS.AES.decrypt(cipher, this.ENC_KEY);
    const decoded = bytes.toString(CryptoJS.enc.Utf8);
    return decoded;
  }
}

module.exports = CryptoUtil;
```

#### 10.3 Create `utils/constants.js`

```javascript
module.exports = {
  POINTS_TO_INR_RATIO: 1,
  INR_TO_POINTS_RATIO: 1,
  
  ORDER_STATUS: {
    INITIATED: 'I',
    VERIFIED: 'V',
    COMPLETED: 'C',
    FAILED: 'F'
  },
  
  PAYMENT_SOURCES: {
    PAYU: 'PAYU',
    SEAMLESSPG: 'SEAMLESSPG',
    PAYTMUPI: 'PAYTMUPI',
    COUPON: 'COUPON'
  }
};
```

---

### Step 11: Create Middlewares

#### 11.1 Create `middlewares/auth.middleware.js`

```javascript
const jwt = require('jsonwebtoken');
const config = require('../config/config.json');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, config.development.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      message: 'Invalid or expired token' 
    });
  }
};
```

#### 11.2 Create `middlewares/decryption.middleware.js`

```javascript
const CryptoUtil = require('../utils/crypto.util');

class DecryptionMiddleware {
  constructor(encryptionKey) {
    this.cryptoUtil = new CryptoUtil(encryptionKey);
  }

  decryptBody(req, res, next) {
    try {
      if (req.body.encryptedData) {
        const decrypted = this.cryptoUtil.decrypt(req.body.encryptedData);
        req.body = JSON.parse(decrypted);
      }
      next();
    } catch (error) {
      return res.status(400).json({ 
        message: 'Decryption failed', 
        error: error.message 
      });
    }
  }
}

module.exports = DecryptionMiddleware;
```

#### 11.3 Create `middlewares/encryption.middleware.js`

```javascript
const CryptoUtil = require('../utils/crypto.util');

class EncryptionMiddleware {
  constructor(encryptionKey) {
    this.cryptoUtil = new CryptoUtil(encryptionKey);
  }

  encryptBody(data) {
    try {
      return this.cryptoUtil.encrypt(data);
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }
}

module.exports = EncryptionMiddleware;
```

---

### Step 12: Create Routes, Controllers, Services

Follow the MVC pattern:

1. **Routes** → Define endpoints
2. **Controllers** → Handle requests, validate input
3. **Services** → Business logic, database operations

Example structure already exists in your project.

---

### Step 13: Create Main Server File

#### Create `server.js`

```javascript
const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const config = require('./config/config.json');
const dbConfig = config.development;
const { sequelize } = require('./models');
const logger = require('./utils/logger.util');

// Import routes
const webRoutes = require('./routes/web.routes');
app.use('/dbsbank-api/api/v1', webRoutes);

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.success('Database connected');
    
    const serverPort = dbConfig.serverPort || 5000;
    app.listen(serverPort, () => {
      logger.success(`Server running on port ${serverPort}`);
      logger.info(`API: http://localhost:${serverPort}/dbsbank-api/api/v1`);
    });
  } catch (err) {
    logger.error('Server startup failed', err);
    process.exit(1);
  }
};

startServer();
```

---

### Step 14: Create `.gitignore`

```
node_modules/
logs/
.env
config/config.json
```

---

### Step 15: Start the Server

```bash
# Development mode (with auto-restart)
npm start

# OR
npm run dev

# Production mode
node server.js
```

---

## ✅ Verification Steps

### 1. Check Database Connection

```bash
# Server should log:
✅ Database connected
✅ Server running on port 5000
```

### 2. Test API Endpoint

```bash
# Using curl or Postman
curl http://localhost:5000/dbsbank-api/api/v1/home/content/HOME
```

### 3. Check Logs

```bash
# Check if logs directory is created
ls logs/

# View today's logs
cat logs/info-2025-10-30.log
```

---

## 🐛 Common Issues & Solutions

### Issue 1: MySQL Connection Error

**Error**: `ER_ACCESS_DENIED_ERROR`

**Solution**:
```bash
# Check MySQL credentials in config/config.json
# Verify MySQL is running
mysql -u root -p

# Test connection
USE dbs_bank;
```

---

### Issue 2: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find process using port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill
```

---

### Issue 3: Sequelize Model Not Found

**Error**: `Cannot read property 'associate' of undefined`

**Solution**:
- Ensure model files export a function
- Check file naming (must end with `.js`)
- Verify model is in `models/` directory

---

### Issue 4: Migration Failed

**Error**: `Table already exists`

**Solution**:
```bash
# Drop and recreate database
mysql -u root -p
DROP DATABASE dbs_bank;
CREATE DATABASE dbs_bank;

# Re-run migrations
npm run migrate
```

---

## 📚 Next Steps

After successful setup:

1. ✅ Explore API endpoints → `03-api-endpoints.md`
2. ✅ Understand database schema → `04-database-schema.md`
3. ✅ Study request flow → `05-request-flow.md`
4. ✅ Review coding conventions → `06-coding-conventions.md`

---

## 🔧 Development Tools

Recommended VS Code extensions:
- REST Client (for API testing)
- MySQL (for database management)
- Prettier (code formatting)
- ESLint (code linting)
- GitLens (Git integration)

---

## 📞 Need Help?

If you encounter issues:
1. Check logs in `logs/` directory
2. Review error messages carefully
3. Verify all configuration files
4. Ensure MySQL is running
5. Check Node.js and npm versions

---

**Setup Time**: ~30-45 minutes  
**Difficulty**: Intermediate  
**Last Updated**: October 30, 2025
