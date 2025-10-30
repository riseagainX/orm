# Logger Helper - Complete Guide

## 📋 What is a Logger?

A **logger** is a helper utility that records (logs) what happens in your application. Instead of using `console.log()` everywhere, a logger provides a professional, organized way to track events, errors, and debugging information.

---

## 🎯 Why Use a Logger Instead of console.log?

| Feature | console.log | Logger Helper |
|---------|------------|---------------|
| **Persistence** | Lost when server restarts | Saved to files forever |
| **Organization** | Scattered everywhere | Centralized and structured |
| **Levels** | No distinction | INFO, WARN, ERROR, DEBUG, etc. |
| **Timestamps** | Manual | Automatic |
| **Production** | Clutters console | Can disable console, keep file logs |
| **Search/Debug** | Hard to find issues | Easy to search log files |

---

## 📁 File Location

```
utils/
  └── logger.util.js     ← The logger helper file
logs/                    ← Created automatically
  ├── info-2025-10-28.log
  ├── error-2025-10-28.log
  └── debug-2025-10-28.log
```

---

## 🔧 How the Logger Works

### 1. **Initialization**
When the logger is imported, it:
- Creates a `logs/` directory if it doesn't exist
- Sets up configuration (console output, file logging)
- Becomes ready to use across your entire application

### 2. **Log Levels**
Different types of messages use different levels:

- **`logger.info()`** - Normal operations
- **`logger.warn()`** - Potential problems
- **`logger.error()`** - Actual errors
- **`logger.debug()`** - Detailed debugging info
- **`logger.success()`** - Successful operations
- **`logger.http()`** - API requests/responses

### 3. **Output**
Each log message:
- Gets a timestamp automatically
- Is formatted consistently
- Is written to console (if enabled)
- Is saved to a daily log file

---

## 💡 Usage Examples

### Example 1: Basic Usage in a Controller

```javascript
const logger = require('../utils/logger.util');

const getUserProfile = async (req, res) => {
  logger.info('Getting user profile', { userId: req.params.id });
  
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      logger.warn('User not found', { userId: req.params.id });
      return res.status(404).json({ message: 'User not found' });
    }
    
    logger.success('User profile retrieved', { userId: user.id });
    res.json(user);
    
  } catch (error) {
    logger.error('Failed to get user profile', error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

### Example 2: Service Layer Logging

```javascript
const logger = require('../utils/logger.util');

const createOrder = async (orderData) => {
  logger.info('Starting order creation', { userId: orderData.userId });
  
  // Log important steps
  logger.debug('Validating coupon', { couponCode: orderData.couponCode });
  
  // Log warnings
  if (orderAmount > 10000) {
    logger.warn('Large order amount detected', { amount: orderAmount });
  }
  
  // Log errors
  try {
    const order = await Order.create(orderData);
    logger.success('Order created successfully', { orderId: order.id });
    return order;
  } catch (error) {
    logger.error('Order creation failed', error);
    throw error;
  }
};
```

### Example 3: Middleware Logging (HTTP Requests)

```javascript
const logger = require('../utils/logger.util');

// Log all incoming requests
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.http(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});
```

### Example 4: Database Connection Logging

```javascript
const logger = require('../utils/logger.util');

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.success('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed', error);
    process.exit(1);
  }
};
```

---

## 📝 Log File Format

Each log entry looks like this:

```
[2025-10-28 14:30:45] [DBS-Bank-API] [INFO] User logged in successfully
  Data: {
    "userId": 12345,
    "email": "user@example.com"
  }

[2025-10-28 14:31:02] [DBS-Bank-API] [ERROR] Payment processing failed
  Error: Invalid card number
  Stack: Error: Invalid card number
    at processPayment (services/payment.service.js:45:11)
    at async createOrder (services/order.service.js:120:5)
```

---

## 🎛️ Configuration Options

You can customize the logger in `utils/logger.util.js`:

```javascript
const logger = new Logger({
  appName: 'DBS-Bank-API',        // App name in logs
  enableConsole: true,             // Show in console
  enableFileLogging: true,         // Save to files
  logDir: path.join(__dirname, '../logs')  // Where to save logs
});
```

### Production vs Development

**Development:**
```javascript
enableConsole: true,      // See logs in terminal
enableFileLogging: true   // Also save to files
```

**Production:**
```javascript
enableConsole: false,     // Don't clutter console
enableFileLogging: true   // Keep file logs for debugging
```

---

## 🏆 Best Practices

### ✅ DO:

1. **Use appropriate log levels**
   ```javascript
   logger.info('Normal flow');
   logger.warn('Something unusual');
   logger.error('Something broke');
   ```

2. **Include context data**
   ```javascript
   logger.error('Order failed', { orderId, userId, error });
   ```

3. **Log important business events**
   ```javascript
   logger.info('Payment received', { amount, orderId });
   ```

4. **Use in try-catch blocks**
   ```javascript
   try {
     // code
   } catch (error) {
     logger.error('Operation failed', error);
   }
   ```

### ❌ DON'T:

1. **Don't log sensitive data**
   ```javascript
   // BAD
   logger.info('User login', { password: '123456' });
   
   // GOOD
   logger.info('User login', { userId, email });
   ```

2. **Don't log in tight loops**
   ```javascript
   // BAD
   for (let i = 0; i < 10000; i++) {
     logger.debug('Processing item', i);  // Too many logs!
   }
   
   // GOOD
   logger.info('Processing 10000 items');
   // Process items
   logger.success('Processed 10000 items');
   ```

3. **Don't use console.log in production code**
   ```javascript
   // BAD
   console.log('User created');
   
   // GOOD
   logger.info('User created', { userId });
   ```

---

## 🔍 Reading Log Files

### Finding Log Files
```
logs/
  ├── info-2025-10-28.log      ← General info
  ├── error-2025-10-28.log     ← Only errors
  ├── warn-2025-10-28.log      ← Warnings
  └── debug-2025-10-28.log     ← Debug info
```

### Searching Logs (Windows PowerShell)
```powershell
# Find all errors related to orders
Select-String -Path "logs\error-*.log" -Pattern "order"

# View last 50 lines of today's error log
Get-Content "logs\error-2025-10-28.log" -Tail 50

# Search for specific user
Select-String -Path "logs\*.log" -Pattern "userId.*12345"
```

### Searching Logs (Linux/Mac)
```bash
# Find all errors related to orders
grep "order" logs/error-*.log

# View last 50 lines
tail -n 50 logs/error-2025-10-28.log

# Search across all logs
grep -r "userId.*12345" logs/
```

---

## 🚀 Integration Steps

### Step 1: Import in Any File
```javascript
const logger = require('../utils/logger.util');
```

### Step 2: Replace console.log with logger
```javascript
// Before
console.log('Order created:', orderId);

// After
logger.info('Order created', { orderId });
```

### Step 3: Add Error Logging
```javascript
try {
  // your code
} catch (error) {
  logger.error('Operation failed', error);
  throw error;
}
```

---

## 📊 When to Use Each Level

| Level | When to Use | Example |
|-------|-------------|---------|
| **info** | Normal successful operations | User logged in, Order created |
| **warn** | Unusual but handled situations | High cart value, Missing optional field |
| **error** | Actual failures and exceptions | Database error, Payment failed |
| **debug** | Development debugging | Variable values, Function calls |
| **success** | Successful important operations | Payment completed, Email sent |
| **http** | API requests/responses | GET /api/orders - 200 OK |

---

## 🎓 Key Concepts for Beginners

### 1. **Singleton Pattern**
The logger is created once and reused everywhere:
```javascript
// Same logger instance used across entire app
const logger = new Logger({ /* config */ });
module.exports = logger;
```

### 2. **Timestamps**
Every log automatically gets the current date and time, so you know exactly when something happened.

### 3. **File Rotation**
New log files are created each day automatically. Old logs are preserved.

### 4. **Structured Logging**
Instead of random text, logs follow a consistent format, making them easier to read and search.

---

## 🔧 Advanced: Environment-Based Configuration

```javascript
// In logger.util.js
const isProduction = process.env.NODE_ENV === 'production';

const logger = new Logger({
  appName: 'DBS-Bank-API',
  enableConsole: !isProduction,     // Console only in development
  enableFileLogging: true,          // Always save to files
  logDir: path.join(__dirname, '../logs')
});
```

---

## 📚 Summary

- **Logger** = Professional way to track what happens in your app
- **Replaces** console.log with organized, persistent logging
- **Automatic** timestamps, formatting, and file saving
- **Different levels** for different types of messages
- **Easy to use** - just import and call logger.info(), logger.error(), etc.
- **Helps debugging** - all events are recorded and searchable

---

## 🎯 Quick Reference

```javascript
const logger = require('../utils/logger.util');

// Basic usage
logger.info('message');
logger.warn('message');
logger.error('message');
logger.debug('message');
logger.success('message');

// With data
logger.info('message', { key: 'value' });

// With error object
logger.error('message', error);

// HTTP logging
logger.http('GET /api/users - 200 OK');
```

---

**Created:** October 28, 2025  
**Purpose:** Beginner-friendly guide to the logger helper utility  
**Location:** `utils/logger.util.js`
