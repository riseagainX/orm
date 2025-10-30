# 💳 What is a Coupon Code? Complete Guide with Examples

## 🎯 What is a Coupon?

A **coupon code** is a special discount code that customers can enter during checkout to get a price reduction on their order.

Think of it like a **gift card** or **discount voucher** you might use at a restaurant or store!

---

## 🏪 Real-World Examples

### Example 1: Restaurant Coupon
```
You go to a restaurant and your bill is:
- Pizza: ₹500
- Pasta: ₹300
- Drink: ₹200
─────────────
Total: ₹1,000

You have a coupon: "FIRST100" for ₹100 off

Final bill: ₹1,000 - ₹100 = ₹900
You saved: ₹100 ✅
```

### Example 2: Shopping Website
```
Amazon Gift Cards:
- ₹500 card × 2 = ₹1,000
- ₹250 card × 1 = ₹250
─────────────────────
Subtotal: ₹1,250

Coupon: "WELCOME500" for ₹500 off
Final: ₹1,250 - ₹500 = ₹750
You saved: ₹500 ✅
```

---

## 💻 How Coupons Work in DBS Bank System

### The Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    COUPON REDEMPTION FLOW                    │
└─────────────────────────────────────────────────────────────┘

1️⃣ USER ADDS ITEMS TO CART
   ┌──────────────┐
   │ Cart         │
   │ • Amazon GV  │ ₹500
   │ • Flipkart   │ ₹300
   │ • Myntra     │ ₹200
   └──────────────┘
   Subtotal: ₹1,000

2️⃣ USER ENTERS COUPON CODE
   ┌──────────────────────┐
   │ Coupon: WELCOME600   │ ← User types this
   └──────────────────────┘

3️⃣ SYSTEM VALIDATES COUPON
   ✅ Code exists in database
   ✅ Not expired (valid till date)
   ✅ Not already used
   ✅ Active status
   ✅ Minimum order value met (₹1,000 ≥ ₹500)
   ✅ Not in other carts/orders
   
4️⃣ SYSTEM APPLIES DISCOUNT SEQUENTIALLY
   Amazon:   ₹500 - ₹500 = ₹0   (full discount)
   Flipkart: ₹300 - ₹100 = ₹200 (partial discount)
   Myntra:   ₹200 - ₹0   = ₹200 (no discount left)
   ────────────────────────────
   Final: ₹400 (saved ₹600!)

5️⃣ USER PAYS REDUCED AMOUNT
   💳 Payment: ₹400 instead of ₹1,000
   🎉 Savings: ₹600
```

---

## 📋 Coupon Database Structure

Coupons are stored in the `coupon_code` table:

```sql
CREATE TABLE coupon_code (
  id                BIGINT PRIMARY KEY,
  user_id           BIGINT,              -- Which user owns this coupon?
  coupon_code       VARCHAR(150),        -- The code: "WELCOME100"
  valid_from        DATE,                -- Start date
  valid_till        DATE,                -- End date
  min_order_value   INT,                 -- Minimum cart total required
  amount            INT,                 -- Discount amount in rupees
  is_used           TINYINT DEFAULT 0,   -- 0 = unused, 1 = used
  status            ENUM('A', 'I'),      -- A = Active, I = Inactive
  created           TIMESTAMP
);
```

### Example Coupon Record
```json
{
  "id": 1,
  "user_id": 123,
  "coupon_code": "WELCOME500",
  "valid_from": "2025-01-01",
  "valid_till": "2025-12-31",
  "min_order_value": 500,
  "amount": 500,
  "is_used": 0,
  "status": "A"
}
```

**Translation:**
- User #123 has a coupon "WELCOME500"
- Valid for entire year 2025
- Requires minimum ₹500 order
- Gives ₹500 discount
- Not yet used
- Currently active

---

## 🔐 Coupon Validation (7 Checks)

Before applying a coupon, we check:

### 1️⃣ Does the coupon exist?
```sql
SELECT * FROM coupon_code WHERE coupon_code = 'WELCOME500'
```
❌ If not found → "Coupon not found"

### 2️⃣ Is it already used?
```sql
WHERE is_used = 0
```
❌ If used → "Coupon already used"

### 3️⃣ Is it active?
```sql
WHERE status = 'A'
```
❌ If inactive → "Coupon is inactive"

### 4️⃣ Is it expired?
```sql
WHERE valid_till >= CURRENT_DATE
```
❌ If expired → "Coupon has expired"

### 5️⃣ Is it already in user's cart?
```sql
SELECT * FROM cart_items WHERE user_id = 123 AND coupon_id = 1
```
❌ If found → "Coupon already in your cart"

### 6️⃣ Is it already used in previous orders?
```sql
SELECT * FROM orders WHERE user_id = 123 AND coupon_id = 1
```
❌ If found → "Coupon already used in previous order"

### 7️⃣ Does order meet minimum value?
```javascript
if (orderTotal < coupon.min_order_value) {
  throw "Minimum order value of ₹500 not met";
}
```
❌ If less → "Minimum order value not met"

✅ **All checks pass → Coupon is valid!**

---

## 💰 Real Examples with Numbers

### Example 1: Simple Coupon

**Setup:**
```
Cart:
- Amazon Gift Card ₹1,000 × 1 = ₹1,000

Coupon: SAVE200
- Amount: ₹200 off
- Min order: ₹500
```

**Calculation:**
```
Original price:    ₹1,000
Coupon discount:   -₹200
─────────────────────────
Final amount:      ₹800

✅ User pays: ₹800
💾 Saves: ₹200
```

---

### Example 2: Coupon Exceeds Single Item

**Setup:**
```
Cart:
- Flipkart GV ₹500 × 1 = ₹500
- Myntra GV ₹300 × 1 = ₹300

Coupon: MEGA600
- Amount: ₹600 off
- Min order: ₹500
```

**Sequential Distribution:**
```
Step 1: Apply to Flipkart (₹500)
  Coupon available: ₹600
  Item price: ₹500
  Discount: min(₹600, ₹500) = ₹500
  Item final: ₹500 - ₹500 = ₹0 ✅
  Remaining coupon: ₹600 - ₹500 = ₹100

Step 2: Apply to Myntra (₹300)
  Coupon available: ₹100
  Item price: ₹300
  Discount: min(₹100, ₹300) = ₹100
  Item final: ₹300 - ₹100 = ₹200 ✅
  Remaining coupon: ₹100 - ₹100 = ₹0

Final breakdown:
  Flipkart: ₹0 (was ₹500)
  Myntra:   ₹200 (was ₹300)
  ─────────────────────────
  Total:    ₹200 (was ₹800)
  
✅ User pays: ₹200
💾 Saves: ₹600
```

---

### Example 3: Coupon + Promotion

**Setup:**
```
Cart:
- Amazon GV ₹1,000 × 1 = ₹1,000

Coupon: SAVE300
- Amount: ₹300 off

Promotion: 10% off
```

**Order of Discounts:**
```
Step 1: Apply coupon FIRST
  Original: ₹1,000
  Coupon:   -₹300
  After:    ₹700

Step 2: Apply promotion on discounted amount
  After coupon: ₹700
  Promotion: 10% of ₹700 = ₹70
  Final: ₹700 - ₹70 = ₹630

Final breakdown:
  Original price:       ₹1,000
  Coupon discount:      -₹300
  Promotion discount:   -₹70
  ──────────────────────────────
  Final amount:         ₹630
  
✅ User pays: ₹630
💾 Total savings: ₹370
```

**Important:** Coupon is ALWAYS applied before promotion!

---

### Example 4: Multiple Items

**Setup:**
```
Cart:
- Product A: ₹500
- Product B: ₹400
- Product C: ₹300
- Product D: ₹200
Total: ₹1,400

Coupon: SUPER1000
- Amount: ₹1,000 off
- Min order: ₹1,000
```

**Distribution:**
```
Remaining coupon starts at: ₹1,000

Product A (₹500):
  Apply: min(₹1,000, ₹500) = ₹500
  Pays: ₹500 - ₹500 = ₹0
  Remaining: ₹1,000 - ₹500 = ₹500

Product B (₹400):
  Apply: min(₹500, ₹400) = ₹400
  Pays: ₹400 - ₹400 = ₹0
  Remaining: ₹500 - ₹400 = ₹100

Product C (₹300):
  Apply: min(₹100, ₹300) = ₹100
  Pays: ₹300 - ₹100 = ₹200
  Remaining: ₹100 - ₹100 = ₹0

Product D (₹200):
  Apply: min(₹0, ₹200) = ₹0
  Pays: ₹200 - ₹0 = ₹200
  Remaining: ₹0

Summary:
  Product A: ₹0 (was ₹500) - FREE! 🎉
  Product B: ₹0 (was ₹400) - FREE! 🎉
  Product C: ₹200 (was ₹300) - ₹100 off
  Product D: ₹200 (was ₹200) - No discount
  ────────────────────────────────────
  Total: ₹400 (was ₹1,400)
  
✅ User pays: ₹400
💾 Saves: ₹1,000
🎁 Gets 2 items FREE!
```

---

## 🔄 API Request/Response Examples

### Request: Create Order WITHOUT Coupon
```json
POST /api/orders/create
Authorization: Bearer <jwt_token>

{
  "cart_item_ids": "1,2,3",
  "display_type": "WEBSITE",
  "whatsapp": "Y"
}
```

### Response:
```json
{
  "status": true,
  "message": "Order created successfully",
  "data": {
    "order_id": 456,
    "order_guid": "DBS-123456-1698765432",
    "total_amount": 1000,
    "cash_spent": 1000,
    "coupon_applied": false,
    "coupon_code": null,
    "coupon_discount": 0,
    "payu_amount": 1000,
    "productinfo": "Amazon Gift Card,Flipkart Voucher",
    "voucher_quantity": 2
  }
}
```

---

### Request: Create Order WITH Coupon
```json
POST /api/orders/create
Authorization: Bearer <jwt_token>

{
  "cart_item_ids": "1,2,3",
  "display_type": "WEBSITE",
  "whatsapp": "Y",
  "coupon_code": "WELCOME500"  ← Added coupon!
}
```

### Response:
```json
{
  "status": true,
  "message": "Order created successfully",
  "data": {
    "order_id": 457,
    "order_guid": "DBS-123457-1698765433",
    "total_amount": 1000,
    "cash_spent": 500,             ← Reduced!
    "coupon_applied": true,        ← Coupon used!
    "coupon_code": "WELCOME500",   ← Which coupon
    "coupon_discount": 500,        ← How much saved
    "payu_amount": 500,            ← Amount to pay
    "productinfo": "Amazon Gift Card,Flipkart Voucher",
    "voucher_quantity": 2
  }
}
```

**Difference:** User pays ₹500 instead of ₹1,000! 🎉

---

### Error Response: Invalid Coupon
```json
POST /api/orders/create

{
  "cart_item_ids": "1,2,3",
  "coupon_code": "EXPIRED123"
}
```

### Response:
```json
{
  "status": false,
  "message": "Coupon has expired"
}
```

---

## 🎓 Key Concepts Explained

### 1. Why Sequential Distribution?

**Sequential** means "one after another, in order"

```
Think of it like eating pizza slices:

You have 6 slices of pizza.
3 friends arrive:

Friend 1: Takes 3 slices (now 3 left)
Friend 2: Takes 2 slices (now 1 left)
Friend 3: Takes 1 slice (now 0 left)

You can't give Friend 3 two slices because they're already eaten!
Same with coupons - once applied to Item 1, can't use same amount for Item 2!
```

### 2. Why Apply Coupon Before Promotion?

```
CORRECT ORDER (Coupon first):
₹1,000 → Apply ₹500 coupon → ₹500 → Apply 10% promo → ₹450

WRONG ORDER (Promotion first):
₹1,000 → Apply 10% promo → ₹900 → Apply ₹500 coupon → ₹400

User gets BETTER deal with coupon first! ✅
```

### 3. Why Validate Before Processing?

```
Imagine:
- Processing 10 items (takes time)
- Calculating all amounts
- Then discover coupon is expired 😱

Better:
- Check coupon FIRST (2 seconds)
- If invalid, stop immediately
- Saves processing time and gives instant feedback ✅
```

---

## 💡 Business Rules

### 1. One Coupon Per Order
- User can only apply ONE coupon code per order
- Can't combine multiple coupons
- Must choose the best one!

### 2. Coupon Cannot Exceed Cart Total
```
Cart: ₹500
Coupon: ₹1,000

Result: User pays ₹0 (not negative!)
Maximum discount = Cart total
```

### 3. Single-Use Coupons
- Most coupons are single-use
- After order completes, marked as `is_used = 1`
- Can't reuse same coupon

### 4. Minimum Order Requirements
```
Coupon: ₹500 off on orders above ₹1,000

Cart: ₹800 → ❌ Can't use (below minimum)
Cart: ₹1,200 → ✅ Can use!
```

---

## 🔍 Where Coupons Are Stored

### In Database Tables:

1. **`coupon_code`** - Master coupon data
   ```sql
   coupon_id: 1
   code: "WELCOME500"
   amount: 500
   ```

2. **`orders`** - Which order used which coupon
   ```sql
   order_id: 123
   coupon_id: 1  ← Links to coupon
   ```

3. **`transactions`** - Coupon as transaction
   ```sql
   txn_type: 'CR' (Credit/Discount)
   source: 'COUPON'
   amount: 500
   ```

---

## 🎯 Summary

### What is a Coupon?
A discount code that reduces the order total

### Types of Coupons in DBS Bank:
- **Fixed Amount:** ₹100 off, ₹500 off
- **Minimum Order:** Must spend ₹1,000 to get ₹200 off
- **User-Specific:** Assigned to specific users
- **Time-Limited:** Valid only during certain dates

### How It Works:
1. User enters code
2. System validates (7 checks)
3. Discount applied sequentially to items
4. Promotions applied on discounted amount
5. User pays reduced total
6. Coupon marked as used

### Benefits:
- 💰 Save money on orders
- 🎁 Sometimes items become FREE
- 🎉 Encourages purchases
- 👥 Rewards loyal customers

---

**Real-Life Analogy:**
```
Coupon code = Restaurant discount card
Cart items = Your ordered food
Validation = Waiter checks if card is valid
Distribution = Apply discount to bill items
Final amount = Reduced bill you pay
```

Simple! 🎉

---

**Last Updated:** October 27, 2025
**File:** `controllers/orderController.js`
**Service:** `services/createOrder.service.js`
**Helper:** `services/couponHelpers.service.js`
