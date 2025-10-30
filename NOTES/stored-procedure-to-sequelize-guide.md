# 🔄 Complete Guide: Converting MySQL Stored Procedures to Sequelize

## 📚 Table of Contents
1. [What is a Stored Procedure?](#what-is-a-stored-procedure)
2. [Why Convert to Sequelize?](#why-convert-to-sequelize)
3. [First-Time Approach: How to Think](#first-time-approach)
4. [Step-by-Step Conversion Process](#step-by-step-conversion-process)
5. [Real Examples from DBS Bank](#real-examples)
6. [Common Patterns & Solutions](#common-patterns--solutions)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🤔 What is a Stored Procedure?

A **stored procedure** is a SQL code saved in the database that can be called repeatedly. Think of it like a function but stored in MySQL.

### Example:
```sql
CREATE PROCEDURE get_user(IN user_id INT)
BEGIN
    SELECT * FROM users WHERE id = user_id;
END;
```

**Key Components:**
- **IN parameters**: Input values passed to procedure
- **OUT parameters**: Output values returned from procedure
- **Variables**: Declared with `DECLARE`
- **Logic**: IF-ELSE, LOOPS, CURSORS
- **Queries**: SELECT, INSERT, UPDATE, DELETE

---

## 🎯 Why Convert to Sequelize?

### Stored Procedures (SQL)
✅ Very fast execution (compiled in database)  
✅ Reduced network traffic  
❌ Hard to version control  
❌ Database-dependent (not portable)  
❌ Harder to test  
❌ Difficult to debug  

### Sequelize (Node.js)
✅ Easy version control (code in Git)  
✅ Portable across databases  
✅ Easy testing and debugging  
✅ Better with modern CI/CD  
❌ Slightly slower (network overhead)  
❌ More database calls  

**When to convert?**
- Building modern API-first applications
- Need better maintainability and testing
- Working with microservices architecture
- Team lacks DBA expertise

---

## 🧠 First-Time Approach: How to Think

When you see a stored procedure for the first time, **DON'T PANIC!** Follow this mental framework:

### Step 1: Read the Procedure Name
```sql
CREATE PROCEDURE `add_to_cart`(...)
```
**Think:** "This procedure adds items to cart. I need a `addToCart` function in Node.js"

---

### Step 2: List All Input Parameters
```sql
IN `given_user_id` INT,
IN `given_product_id` INT,
IN `given_quantity` INT,
IN `given_promocode` VARCHAR(50)
```
**Think:** "These are function parameters. My function will accept: `userId, productId, quantity, promocode`"

---

### Step 3: Understand the Business Logic Flow
Read through and identify:
- **Validations** (IF statements checking conditions)
- **Data fetching** (SELECT queries)
- **Data modifications** (INSERT, UPDATE, DELETE)
- **Calculations** (mathematical operations)
- **Loops** (processing multiple records)

**Think:** "What is the happy path? What are the error cases?"

---

### Step 4: Identify Database Tables Used
```sql
FROM products 
INNER JOIN brands ON ...
WHERE products.id = given_product_id
```
**Think:** "I need the `Product` and `Brand` models in Sequelize"

---

### Step 5: Break It Into Smaller Pieces
Don't try to convert everything at once!

**Think:** 
1. "First, write validation logic"
2. "Then, fetch data from database"
3. "Then, do calculations"
4. "Finally, insert/update data"

---

## 📋 Step-by-Step Conversion Process

### PHASE 1: ANALYZE THE STORED PROCEDURE

#### Step 1.1: Document the Procedure
Create a checklist:

```markdown
Procedure: add_to_cart
Purpose: Add product to user's cart with optional promocode

Input Parameters:
- given_user_id (INT)
- given_product_id (INT)
- given_quantity (INT)
- given_promocode (VARCHAR)

Output: Success message or Error message

Tables Used:
- cart_items
- products
- brands
- promocodes
- promotions
- promotion_x_products

Logic Flow:
1. Validate promocode usage (if provided)
2. Validate product availability
3. Check if item already in cart
4. INSERT or UPDATE cart_items
5. Return success/error message
```

---

#### Step 1.2: Extract All SQL Queries
Copy every SELECT, INSERT, UPDATE, DELETE query into a separate document:

```sql
-- Query 1: Check product validity
SELECT COUNT(*) FROM products 
INNER JOIN brands ON (brands.id = products.brand_id)
WHERE products.id = given_product_id 
  AND products.status = 'A'
  AND products.available_qty >= given_quantity

-- Query 2: Find promocode
SELECT promocodes.id, promotions.value
FROM promocodes
INNER JOIN promotions ON ...
WHERE promocodes.promocode = given_promocode

-- Query 3: Check existing cart item
SELECT id FROM cart_items 
WHERE user_id = given_user_id 
  AND product_id = given_product_id

-- Query 4: Insert new cart item
INSERT INTO cart_items (product_id, user_id, quantity, ...)
VALUES (...)

-- Query 5: Update existing cart item
UPDATE cart_items 
SET quantity = quantity + given_quantity
WHERE user_id = given_user_id AND product_id = given_product_id
```

---

#### Step 1.3: Map Variables to JavaScript
```sql
DECLARE temp_cart_item_id VARCHAR(200);
DECLARE temp_quantity INT(11);
```

**Converts to:**
```javascript
let cartItemId = null;
let quantity = 0;
```

---

### PHASE 2: SETUP SEQUELIZE SERVICE FILE

#### Step 2.1: Create Service File
```javascript
// services/addToCart.service.js

const { 
  CartItem, 
  Product, 
  Brand, 
  Promocode, 
  Promotion 
} = require('../models');
const logger = require('../utils/logger.util');

class AddToCartService {
  
  // Main function
  async addToCart(userId, productId, quantity, promocode) {
    logger.info('AddToCart service started', { userId, productId });
    
    try {
      // Your logic here
      
    } catch (error) {
      logger.error('AddToCart failed', error);
      throw error;
    }
  }
}

module.exports = new AddToCartService();
```

---

### PHASE 3: CONVERT QUERIES ONE BY ONE

#### Step 3.1: Convert SELECT Queries

**SQL:**
```sql
SELECT COUNT(*) FROM products 
INNER JOIN brands ON brands.id = products.brand_id
WHERE products.id = given_product_id 
  AND products.status = 'A'
  AND products.available_qty >= given_quantity
```

**Sequelize:**
```javascript
const productCount = await Product.count({
  where: {
    id: productId,
    status: 'A',
    available_qty: { [Op.gte]: quantity }  // >= operator
  },
  include: [{
    model: Brand,
    where: { status: 'A' },
    required: true  // INNER JOIN
  }]
});

if (productCount === 0) {
  throw new Error('Invalid product');
}
```

---

#### Step 3.2: Convert SELECT with JOIN

**SQL:**
```sql
SELECT 
  promocodes.id,
  promotions.value,
  promotions.display_type
FROM promocodes
INNER JOIN promotions ON promotions.id = promocodes.promotion_id
WHERE promocodes.promocode = given_promocode
  AND promocodes.status = 'VALID'
```

**Sequelize:**
```javascript
const promocodeData = await Promocode.findOne({
  where: {
    promocode: promocode,
    status: 'VALID'
  },
  include: [{
    model: Promotion,
    attributes: ['value', 'display_type'],
    required: true  // INNER JOIN
  }],
  attributes: ['id']  // Only select id from promocodes
});

if (!promocodeData) {
  throw new Error('Invalid promocode');
}

const promocodeId = promocodeData.id;
const promotionValue = promocodeData.Promotion.value;
```

---

#### Step 3.3: Convert INSERT Queries

**SQL:**
```sql
INSERT INTO cart_items (
  product_id, 
  user_id, 
  quantity, 
  promocode_id,
  created
) VALUES (
  given_product_id,
  given_user_id,
  given_quantity,
  @promocode_id,
  NOW()
);
```

**Sequelize:**
```javascript
const newCartItem = await CartItem.create({
  product_id: productId,
  user_id: userId,
  quantity: quantity,
  promocode_id: promocodeId,
  created: new Date()  // NOW() in SQL
});

const cartItemId = newCartItem.id;  // LAST_INSERT_ID() in SQL
```

---

#### Step 3.4: Convert UPDATE Queries

**SQL:**
```sql
UPDATE cart_items 
SET quantity = quantity + given_quantity
WHERE user_id = given_user_id 
  AND product_id = given_product_id
```

**Sequelize:**
```javascript
await CartItem.update(
  {
    quantity: sequelize.literal(`quantity + ${quantity}`)  // Increment
  },
  {
    where: {
      user_id: userId,
      product_id: productId
    }
  }
);
```

**Alternative (safer):**
```javascript
const cartItem = await CartItem.findOne({
  where: { user_id: userId, product_id: productId }
});

cartItem.quantity += quantity;
await cartItem.save();
```

---

### PHASE 4: CONVERT CONDITIONAL LOGIC

#### Step 4.1: Convert IF-ELSE

**SQL:**
```sql
IF given_promocode IS NOT NULL THEN
    -- Logic for promocode
    SELECT "Promocode applied" AS success;
ELSE
    -- Logic without promocode
    SELECT "Item added" AS success;
END IF;
```

**Sequelize:**
```javascript
if (promocode !== null && promocode !== undefined) {
  // Logic for promocode
  logger.info('Applying promocode');
  const promocodeData = await validatePromocode(promocode);
  // ... more logic
  return { success: true, message: 'Promocode applied' };
} else {
  // Logic without promocode
  logger.info('No promocode provided');
  // ... more logic
  return { success: true, message: 'Item added' };
}
```

---

#### Step 4.2: Convert Nested IF

**SQL:**
```sql
IF condition1 THEN
    IF condition2 THEN
        SELECT "Both true";
    ELSE
        SELECT "Only first true";
    END IF;
ELSE
    SELECT "First false";
END IF;
```

**Sequelize:**
```javascript
if (condition1) {
  if (condition2) {
    return { message: 'Both true' };
  } else {
    return { message: 'Only first true' };
  }
} else {
  return { message: 'First false' };
}
```

**Better approach (early return):**
```javascript
if (!condition1) {
  return { message: 'First false' };
}

if (!condition2) {
  return { message: 'Only first true' };
}

return { message: 'Both true' };
```

---

### PHASE 5: CONVERT LOOPS & CURSORS

#### Step 5.1: Understanding Cursors

**SQL Cursor:**
```sql
DECLARE cart_cursor CURSOR FOR
    SELECT id, quantity, product_id FROM cart_items
    WHERE user_id = given_user_id;

DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

OPEN cart_cursor;
read_loop: LOOP
    FETCH cart_cursor INTO temp_id, temp_qty, temp_product_id;
    IF done THEN
        LEAVE read_loop;
    END IF;
    
    -- Process each cart item
    SET total = total + (temp_qty * temp_price);
END LOOP;
CLOSE cart_cursor;
```

**Sequelize Equivalent:**
```javascript
// Fetch all cart items at once
const cartItems = await CartItem.findAll({
  where: { user_id: userId },
  attributes: ['id', 'quantity', 'product_id']
});

let total = 0;

// Loop through each item
for (const item of cartItems) {
  const itemId = item.id;
  const quantity = item.quantity;
  const productId = item.product_id;
  
  // Process each cart item
  total += (quantity * price);
}
```

---

#### Step 5.2: Complex Cursor with Joins

**SQL:**
```sql
DECLARE cart_cursor CURSOR FOR
    SELECT 
        cart_items.id,
        cart_items.quantity,
        products.price,
        products.name
    FROM cart_items
    INNER JOIN products ON products.id = cart_items.product_id
    WHERE cart_items.user_id = given_user_id;
```

**Sequelize:**
```javascript
const cartItems = await CartItem.findAll({
  where: { user_id: userId },
  include: [{
    model: Product,
    attributes: ['price', 'name'],
    required: true
  }],
  attributes: ['id', 'quantity']
});

for (const item of cartItems) {
  const cartItemId = item.id;
  const quantity = item.quantity;
  const productPrice = item.Product.price;
  const productName = item.Product.name;
  
  // Your logic here
}
```

---

### PHASE 6: CONVERT CALCULATIONS

#### Step 6.1: Mathematical Operations

**SQL:**
```sql
SET @discount_amount = (product_price * discount_percent) / 100;
SET @final_price = product_price - @discount_amount;
SET @tax = @final_price * 0.18;
SET @total = @final_price + @tax;
```

**Sequelize:**
```javascript
const discountAmount = (productPrice * discountPercent) / 100;
const finalPrice = productPrice - discountAmount;
const tax = finalPrice * 0.18;
const total = finalPrice + tax;
```

---

#### Step 6.2: Aggregations (SUM, COUNT, AVG)

**SQL:**
```sql
SELECT 
    COUNT(*) AS total_items,
    SUM(quantity) AS total_quantity,
    SUM(price * quantity) AS total_price
FROM cart_items
WHERE user_id = given_user_id
```

**Sequelize:**
```javascript
const { Op } = require('sequelize');

const cartSummary = await CartItem.findAll({
  where: { user_id: userId },
  attributes: [
    [sequelize.fn('COUNT', sequelize.col('id')), 'total_items'],
    [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
    [
      sequelize.literal('SUM(price * quantity)'), 
      'total_price'
    ]
  ],
  raw: true
});

const totalItems = cartSummary[0].total_items;
const totalQuantity = cartSummary[0].total_quantity;
const totalPrice = cartSummary[0].total_price;
```

---

### PHASE 7: HANDLE TRANSACTIONS

Stored procedures often use transactions. In Sequelize:

**SQL:**
```sql
START TRANSACTION;

INSERT INTO orders (...) VALUES (...);
SET @order_id = LAST_INSERT_ID();

INSERT INTO order_details (...) VALUES (...);

UPDATE products SET available_qty = available_qty - quantity;

COMMIT;
```

**Sequelize:**
```javascript
const { sequelize } = require('../models');

const transaction = await sequelize.transaction();

try {
  // Insert order
  const order = await Order.create({
    user_id: userId,
    total_amount: totalAmount
  }, { transaction });
  
  const orderId = order.id;
  
  // Insert order details
  await OrderDetail.create({
    order_id: orderId,
    product_id: productId,
    quantity: quantity
  }, { transaction });
  
  // Update product stock
  await Product.decrement(
    'available_qty',
    {
      by: quantity,
      where: { id: productId },
      transaction
    }
  );
  
  // Commit transaction
  await transaction.commit();
  logger.success('Order created successfully');
  
  return { success: true, orderId };
  
} catch (error) {
  // Rollback on error
  await transaction.rollback();
  logger.error('Transaction failed', error);
  throw error;
}
```

---

## 🎓 Real Examples from DBS Bank

### Example 1: Add to Cart Procedure

**Original SQL Procedure:**
```sql
CREATE PROCEDURE `add_to_cart`(
    IN `given_user_id` INT,
    IN `given_product_id` INT,
    IN `given_quantity` INT,
    IN `given_promocode` VARCHAR(50)
)
BEGIN
    -- Validate product
    IF (SELECT COUNT(*) FROM products 
        WHERE id = given_product_id 
          AND status = 'A' 
          AND available_qty >= given_quantity) = 0 
    THEN
        SELECT "Invalid product." AS error;
    ELSE
        -- Check existing cart item
        SET @record_row_id = (
            SELECT id FROM cart_items 
            WHERE user_id = given_user_id 
              AND product_id = given_product_id
        );
        
        IF @record_row_id IS NOT NULL THEN
            -- Update quantity
            UPDATE cart_items 
            SET quantity = quantity + given_quantity
            WHERE id = @record_row_id;
            
            SELECT "Item updated." AS success;
        ELSE
            -- Insert new item
            INSERT INTO cart_items (
                user_id, product_id, quantity
            ) VALUES (
                given_user_id, given_product_id, given_quantity
            );
            
            SELECT "Item added." AS success;
        END IF;
    END IF;
END;
```

**Converted Sequelize Code:**

```javascript
// services/cartService/addToCart.service.js

const { CartItem, Product, Brand } = require('../../models');
const { Op } = require('sequelize');
const logger = require('../../utils/logger.util');

class AddToCartService {
  
  async addToCart(userId, productId, quantity, promocode = null) {
    logger.info('Add to cart service started', { userId, productId, quantity });
    
    try {
      // Step 1: Validate product availability
      const productCount = await Product.count({
        where: {
          id: productId,
          status: 'A',
          available_qty: { [Op.gte]: quantity }
        },
        include: [{
          model: Brand,
          where: { status: 'A' },
          required: true
        }]
      });
      
      if (productCount === 0) {
        logger.warn('Invalid product', { productId });
        return { error: 'Invalid product.' };
      }
      
      // Step 2: Check if item already exists in cart
      const existingCartItem = await CartItem.findOne({
        where: {
          user_id: userId,
          product_id: productId
        }
      });
      
      if (existingCartItem) {
        // Step 3a: Update existing cart item
        existingCartItem.quantity += quantity;
        await existingCartItem.save();
        
        logger.success('Cart item updated', { cartItemId: existingCartItem.id });
        return { 
          success: 'Item updated.', 
          cartItemId: existingCartItem.id 
        };
        
      } else {
        // Step 3b: Create new cart item
        const newCartItem = await CartItem.create({
          user_id: userId,
          product_id: productId,
          quantity: quantity,
          promocode_id: null,  // Handle promocode separately
          created: new Date()
        });
        
        logger.success('Cart item added', { cartItemId: newCartItem.id });
        return { 
          success: 'Item added.', 
          cartItemId: newCartItem.id 
        };
      }
      
    } catch (error) {
      logger.error('Add to cart failed', error);
      throw error;
    }
  }
}

module.exports = new AddToCartService();
```

---

### Example 2: Create Order Procedure (Complex)

Your project has `createorderprocedure.md` with a **very complex** stored procedure involving:
- Cursors
- Multiple tables
- Coupon calculations
- Transaction handling
- Loops

**Key sections converted:**

#### Section 1: Variable Declarations
**SQL:**
```sql
DECLARE temp_cart_item_id VARCHAR(200);
DECLARE temp_quantity INT(11);
DECLARE temp_product_price DECIMAL(10,2);
DECLARE total_amount DECIMAL(10,2) DEFAULT 0;
```

**Sequelize:**
```javascript
let cartItemId = null;
let quantity = 0;
let productPrice = 0;
let totalAmount = 0;
```

#### Section 2: Cursor Loop
**SQL:**
```sql
DECLARE cart_cursor CURSOR FOR
    SELECT 
        cart_items.id,
        cart_items.quantity,
        products.price
    FROM cart_items
    INNER JOIN products ON products.id = cart_items.product_id
    WHERE cart_items.user_id = given_user_id;

OPEN cart_cursor;
read_loop: LOOP
    FETCH cart_cursor INTO temp_cart_item_id, temp_quantity, temp_product_price;
    IF done THEN LEAVE read_loop; END IF;
    
    SET total_amount = total_amount + (temp_quantity * temp_product_price);
END LOOP;
CLOSE cart_cursor;
```

**Sequelize:**
```javascript
const cartItems = await CartItem.findAll({
  where: { user_id: userId },
  include: [{
    model: Product,
    attributes: ['price'],
    required: true
  }],
  attributes: ['id', 'quantity']
});

let totalAmount = 0;

for (const item of cartItems) {
  const cartItemId = item.id;
  const quantity = item.quantity;
  const productPrice = item.Product.price;
  
  totalAmount += (quantity * productPrice);
}
```

#### Section 3: Transaction with Multiple Inserts
**SQL:**
```sql
START TRANSACTION;

INSERT INTO orders (user_id, total_amount) 
VALUES (given_user_id, total_amount);
SET @order_id = LAST_INSERT_ID();

INSERT INTO order_details (order_id, cart_item_id, quantity, price)
SELECT @order_id, id, quantity, price FROM cart_items;

COMMIT;
```

**Sequelize:**
```javascript
const transaction = await sequelize.transaction();

try {
  // Create order
  const order = await Order.create({
    user_id: userId,
    total_amount: totalAmount
  }, { transaction });
  
  const orderId = order.id;
  
  // Create order details in bulk
  const orderDetailsData = cartItems.map(item => ({
    order_id: orderId,
    cart_item_id: item.id,
    quantity: item.quantity,
    price: item.Product.price
  }));
  
  await OrderDetail.bulkCreate(orderDetailsData, { transaction });
  
  await transaction.commit();
  logger.success('Order created', { orderId });
  
} catch (error) {
  await transaction.rollback();
  logger.error('Order creation failed', error);
  throw error;
}
```

---

## 🔍 Common Patterns & Solutions

### Pattern 1: Check and Insert/Update (Upsert)

**SQL Pattern:**
```sql
SET @existing_id = (SELECT id FROM table WHERE condition);

IF @existing_id IS NOT NULL THEN
    UPDATE table SET ... WHERE id = @existing_id;
ELSE
    INSERT INTO table (...) VALUES (...);
END IF;
```

**Sequelize Solution:**
```javascript
const [record, created] = await Model.findOrCreate({
  where: { user_id: userId, product_id: productId },
  defaults: {
    quantity: quantity,
    created: new Date()
  }
});

if (!created) {
  // Record existed, update it
  record.quantity += quantity;
  await record.save();
}
```

---

### Pattern 2: Conditional Aggregation

**SQL:**
```sql
SELECT 
    SUM(CASE WHEN status = 'A' THEN quantity ELSE 0 END) AS active_qty,
    SUM(CASE WHEN status = 'I' THEN quantity ELSE 0 END) AS inactive_qty
FROM products
```

**Sequelize:**
```javascript
const result = await Product.findAll({
  attributes: [
    [
      sequelize.fn('SUM', 
        sequelize.literal("CASE WHEN status = 'A' THEN quantity ELSE 0 END")
      ),
      'active_qty'
    ],
    [
      sequelize.fn('SUM',
        sequelize.literal("CASE WHEN status = 'I' THEN quantity ELSE 0 END")
      ),
      'inactive_qty'
    ]
  ],
  raw: true
});
```

---

### Pattern 3: Subquery in WHERE

**SQL:**
```sql
SELECT * FROM orders
WHERE user_id IN (
    SELECT id FROM users WHERE status = 'A'
)
```

**Sequelize:**
```javascript
const activeUserIds = await User.findAll({
  where: { status: 'A' },
  attributes: ['id'],
  raw: true
}).map(u => u.id);

const orders = await Order.findAll({
  where: {
    user_id: { [Op.in]: activeUserIds }
  }
});
```

**Better approach (JOIN):**
```javascript
const orders = await Order.findAll({
  include: [{
    model: User,
    where: { status: 'A' },
    required: true
  }]
});
```

---

### Pattern 4: Multiple Result Sets

**SQL:**
```sql
-- Procedure returns multiple result sets
SELECT * FROM orders WHERE user_id = given_user_id;
SELECT * FROM order_details WHERE order_id = @order_id;
```

**Sequelize:**
```javascript
// Return object with multiple arrays
const result = {
  orders: await Order.findAll({ where: { user_id: userId } }),
  orderDetails: await OrderDetail.findAll({ where: { order_id: orderId } })
};

return result;
```

---

### Pattern 5: Date Comparisons

**SQL:**
```sql
WHERE expiry_date >= CURDATE()
AND created_date BETWEEN '2024-01-01' AND '2024-12-31'
```

**Sequelize:**
```javascript
const { Op } = require('sequelize');

where: {
  expiry_date: { [Op.gte]: new Date() },  // >= today
  created_date: {
    [Op.between]: ['2024-01-01', '2024-12-31']
  }
}
```

---

## ✅ Best Practices

### 1. **Always Use Transactions for Multiple Operations**
```javascript
const transaction = await sequelize.transaction();
try {
  // Your operations
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

### 2. **Use Eager Loading to Avoid N+1 Queries**
```javascript
// ❌ Bad: N+1 queries
const orders = await Order.findAll();
for (const order of orders) {
  const user = await User.findByPk(order.user_id);  // N queries!
}

// ✅ Good: Single query with JOIN
const orders = await Order.findAll({
  include: [{ model: User }]  // 1 query
});
```

### 3. **Add Logging for Debugging**
```javascript
logger.info('Starting operation', { userId, productId });
logger.success('Operation completed', { result });
logger.error('Operation failed', error);
```

### 4. **Validate Input Early**
```javascript
if (!userId || !productId) {
  throw new Error('Missing required parameters');
}

if (quantity <= 0) {
  throw new Error('Quantity must be positive');
}
```

### 5. **Use Constants for Magic Values**
```javascript
// utils/constants.js
module.exports = {
  ORDER_STATUS: {
    INITIATED: 'I',
    COMPLETED: 'C',
    FAILED: 'F'
  }
};

// In your service
const { ORDER_STATUS } = require('../utils/constants');
order.status = ORDER_STATUS.COMPLETED;
```

### 6. **Handle NULL Values Properly**
```javascript
// SQL: IFNULL(promocode_id, 0)
const promocodeId = item.promocode_id ?? 0;  // Nullish coalescing

// SQL: IF value IS NULL THEN...
if (value === null || value === undefined) {
  // Handle null case
}
```

### 7. **Use Bulk Operations for Performance**
```javascript
// ❌ Bad: Insert one by one
for (const item of items) {
  await Model.create(item);  // N queries
}

// ✅ Good: Bulk insert
await Model.bulkCreate(items);  // 1 query
```

### 8. **Return Consistent Response Format**
```javascript
// Success response
return {
  success: true,
  message: 'Operation successful',
  data: { orderId, totalAmount }
};

// Error response
return {
  success: false,
  message: 'Operation failed',
  error: error.message
};
```

---

## 🐛 Troubleshooting

### Issue 1: Complex JOIN Not Working
**Problem:**
```javascript
// Not giving expected results
const result = await Model1.findAll({
  include: [Model2, Model3]
});
```

**Solution:**
```javascript
// Specify associations clearly
const result = await Model1.findAll({
  include: [
    {
      model: Model2,
      required: true,  // INNER JOIN
      where: { status: 'A' }
    },
    {
      model: Model3,
      required: false,  // LEFT JOIN
      attributes: ['id', 'name']  // Only select needed columns
    }
  ]
});
```

---

### Issue 2: Decimal Precision Loss
**Problem:**
```javascript
const price = 99.99;
const discount = 0.15;
const final = price * (1 - discount);  // 84.99150000000001
```

**Solution:**
```javascript
// Use toFixed or database DECIMAL type
const final = parseFloat((price * (1 - discount)).toFixed(2));  // 84.99

// Or let database handle it
await sequelize.query(
  'SELECT (price * (1 - discount)) AS final FROM products'
);
```

---

### Issue 3: Transaction Not Rolling Back
**Problem:**
```javascript
try {
  await transaction.commit();
} catch (error) {
  // Transaction already committed!
  await transaction.rollback();  // Error!
}
```

**Solution:**
```javascript
try {
  // All operations here
  await operation1();
  await operation2();
  
  await transaction.commit();  // Only commit if all succeed
} catch (error) {
  await transaction.rollback();  // Rollback on any error
  throw error;
}
```

---

### Issue 4: Sequelize Literal Not Working
**Problem:**
```javascript
// SQL injection risk or syntax error
where: {
  column: sequelize.literal(`value = '${userInput}'`)  // Dangerous!
}
```

**Solution:**
```javascript
// Use parameterized queries
where: sequelize.literal('column = :value', {
  replacements: { value: userInput }
});

// Or use operators
where: {
  column: { [Op.eq]: userInput }
}
```

---

### Issue 5: Date Comparison Not Working
**Problem:**
```javascript
// Comparing with wrong format
where: {
  expiry_date: { [Op.gte]: '2024-01-01' }  // String comparison
}
```

**Solution:**
```javascript
// Use Date objects
where: {
  expiry_date: { [Op.gte]: new Date('2024-01-01') }
}

// For current date
where: {
  expiry_date: { [Op.gte]: new Date() }
}
```

---

## 📊 Conversion Checklist

Use this checklist when converting any stored procedure:

```markdown
☐ Read and understand procedure purpose
☐ List all input/output parameters
☐ Identify all tables used
☐ Map SQL variables to JavaScript variables
☐ Extract all SELECT queries
☐ Extract all INSERT/UPDATE/DELETE queries
☐ Identify IF-ELSE logic
☐ Identify loops and cursors
☐ Check for transactions (START TRANSACTION / COMMIT)
☐ Note any calculations or aggregations
☐ Create service file structure
☐ Convert queries one by one
☐ Add transaction handling if needed
☐ Add error handling (try-catch)
☐ Add logging statements
☐ Test with sample data
☐ Compare output with stored procedure
☐ Handle edge cases (NULL values, empty results)
☐ Optimize with eager loading
☐ Document the conversion
```

---

## 🎯 Quick Reference: SQL to Sequelize

| SQL Concept | Sequelize Equivalent |
|-------------|---------------------|
| `SELECT * FROM table` | `Model.findAll()` |
| `SELECT * FROM table WHERE id = 1` | `Model.findOne({ where: { id: 1 } })` |
| `SELECT COUNT(*) FROM table` | `Model.count()` |
| `INSERT INTO table (...) VALUES (...)` | `Model.create({ ... })` |
| `UPDATE table SET ... WHERE ...` | `Model.update({ ... }, { where: { ... } })` |
| `DELETE FROM table WHERE ...` | `Model.destroy({ where: { ... } })` |
| `INNER JOIN` | `include: [{ model: Model2, required: true }]` |
| `LEFT JOIN` | `include: [{ model: Model2, required: false }]` |
| `WHERE col > 10` | `where: { col: { [Op.gt]: 10 } }` |
| `WHERE col IN (1,2,3)` | `where: { col: { [Op.in]: [1,2,3] } }` |
| `WHERE col LIKE '%text%'` | `where: { col: { [Op.like]: '%text%' } }` |
| `ORDER BY col ASC` | `order: [['col', 'ASC']]` |
| `LIMIT 10` | `limit: 10` |
| `OFFSET 20` | `offset: 20` |
| `START TRANSACTION` | `await sequelize.transaction()` |
| `COMMIT` | `await transaction.commit()` |
| `ROLLBACK` | `await transaction.rollback()` |
| `LAST_INSERT_ID()` | `const record = await Model.create(); record.id` |
| `NOW()` | `new Date()` |
| `CURDATE()` | `new Date().toISOString().split('T')[0]` |
| `IFNULL(col, 0)` | `col ?? 0` (nullish coalescing) |
| `SUM(column)` | `sequelize.fn('SUM', sequelize.col('column'))` |

---

## 📚 Learning Resources

1. **Sequelize Documentation**: https://sequelize.org/docs/v6/
2. **Your Project Examples**: 
   - `createorderprocedure.md` - Complex procedure
   - `NOTES/add_to_cartProcedure.md` - Medium complexity
   - `services/createOrder.service.js` - Converted code

---

## 🎓 Summary

**The 5-Step Mental Model:**

1. **UNDERSTAND**: Read procedure, understand business logic
2. **EXTRACT**: List parameters, queries, tables, logic flow
3. **TRANSLATE**: Convert each SQL query to Sequelize
4. **COMBINE**: Put queries together with JavaScript logic
5. **TEST**: Verify output matches stored procedure

**Key Takeaways:**
- Start simple, convert complex procedures piece by piece
- Always use transactions for data consistency
- Add logging for debugging
- Test each conversion thoroughly
- Document your conversion process

---

**Created by:** DBS Bank Development Team  
**Last Updated:** October 30, 2025  
**Reference Project:** DBS Bank Homepage API
