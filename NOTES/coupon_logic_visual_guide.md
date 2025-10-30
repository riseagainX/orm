# 💳 Coupon Logic - Quick Visual Guide

## 🎯 The Three Phases Explained

```
┌─────────────────────────────────────────────────────────────────┐
│                    COUPON PROCESSING FLOW                       │
└─────────────────────────────────────────────────────────────────┘

Input: Cart with 3 items + ₹600 coupon
─────────────────────────────────────────

📦 PHASE 1: COLLECT LINE ITEMS (First Loop)
┌──────────────────────────────────────────────────────────────┐
│  Loop through cartItems:                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Item 1    │  │  Item 2    │  │  Item 3    │            │
│  │  ₹500      │  │  ₹300      │  │  ₹200      │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│       ↓               ↓               ↓                       │
│  Validate        Validate        Validate                    │
│  Stock OK        Stock OK        Stock OK                    │
│       ↓               ↓               ↓                       │
│  Store in lineItemsForCoupon array                           │
└──────────────────────────────────────────────────────────────┘
Result: [₹500, ₹300, ₹200]


💳 PHASE 2: DISTRIBUTE COUPON (Map Operation)
┌──────────────────────────────────────────────────────────────┐
│  Starting coupon: ₹600                                        │
│                                                               │
│  Iteration 1: Item 1 (₹500)                                  │
│  ┌────────────────────────────────────────────┐             │
│  │ Apply: min(600, 500) = ₹500               │             │
│  │ Remaining: 600 - 500 = ₹100               │             │
│  │ Item pays: 500 - 500 = ₹0 ✅              │             │
│  └────────────────────────────────────────────┘             │
│                                                               │
│  Iteration 2: Item 2 (₹300)                                  │
│  ┌────────────────────────────────────────────┐             │
│  │ Apply: min(100, 300) = ₹100               │             │
│  │ Remaining: 100 - 100 = ₹0                 │             │
│  │ Item pays: 300 - 100 = ₹200               │             │
│  └────────────────────────────────────────────┘             │
│                                                               │
│  Iteration 3: Item 3 (₹200)                                  │
│  ┌────────────────────────────────────────────┐             │
│  │ Apply: min(0, 200) = ₹0                   │             │
│  │ Remaining: 0 - 0 = ₹0                     │             │
│  │ Item pays: 200 - 0 = ₹200                 │             │
│  └────────────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────┘
Result: [₹0, ₹200, ₹200] after coupon


🎁 PHASE 3: APPLY PROMOTIONS & CREATE RECORDS (Second Loop)
┌──────────────────────────────────────────────────────────────┐
│  For each item with coupon applied:                          │
│                                                               │
│  Item 1: ₹0 (after coupon)                                   │
│  ├─ Promotion: 10% off = ₹0 × 10% = ₹0                      │
│  └─ Final: ₹0 - ₹0 = ₹0                                     │
│                                                               │
│  Item 2: ₹200 (after coupon)                                 │
│  ├─ Promotion: 10% off = ₹200 × 10% = ₹20                   │
│  └─ Final: ₹200 - ₹20 = ₹180                                │
│                                                               │
│  Item 3: ₹200 (after coupon)                                 │
│  ├─ Promotion: 10% off = ₹200 × 10% = ₹20                   │
│  └─ Final: ₹200 - ₹20 = ₹180                                │
│                                                               │
│  Create OrderDetail records with final amounts               │
└──────────────────────────────────────────────────────────────┘
Final Order: ₹360 (User pays this amount)


💰 TRANSACTION SUMMARY
┌──────────────────────────────────────────────────────────────┐
│  Original Total:        ₹1,000                               │
│  Coupon Discount:      -₹600                                 │
│  After Coupon:          ₹400                                 │
│  Promotion Discount:   -₹40 (10% on remaining ₹400)          │
│  Final Amount:          ₹360  ← User pays this               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🤔 Why Three Phases?

### ❌ If We Did It In One Loop:
```javascript
let remainingCoupon = 600;

// Single loop attempt
for (item of cartItems) {
  calculate base amount
  apply coupon
  apply promotion
  create record
  
  // ⚠️ Problem: What if item 3 is out of stock?
  // We already consumed coupon on items 1 & 2!
  // Can't rollback coupon distribution!
}
```

### ✅ With Three Phases:
```javascript
// Phase 1: Collect & validate ALL items first
lineItems = collect_and_validate();

// Phase 2: Calculate coupon distribution
lineItemsWithCoupon = distribute_coupon(lineItems);
// At this point, we can preview what user will pay
// If error occurs, no database changes yet!

// Phase 3: Create database records
for (item of lineItemsWithCoupon) {
  create_order_detail(item);
}
```

---

## 📊 Discount Order Matters!

### Scenario: Item costs ₹1000, Coupon ₹500, Promotion 10% off

#### ✅ Correct Order (Coupon First):
```
Step 1: Apply coupon
  ₹1000 - ₹500 = ₹500

Step 2: Apply promotion (10% of ₹500)
  ₹500 - ₹50 = ₹450

User pays: ₹450 ✅
```

#### ❌ Wrong Order (Promotion First):
```
Step 1: Apply promotion (10% of ₹1000)
  ₹1000 - ₹100 = ₹900

Step 2: Apply coupon
  ₹900 - ₹500 = ₹400

User pays: ₹400 ❌
```

**Difference:** ₹50! Order matters!

---

## 🎯 Key Takeaways

1. **Sequential Distribution:** Coupon applied item by item, not split evenly
2. **Three Phases:** Collect → Distribute → Create
3. **Order Matters:** Coupon before promotion
4. **Transaction Safety:** All in one database transaction
5. **Matches Database:** Same logic as stored procedure

---

## 💡 Remember

> "We need to know ALL items before distributing the coupon, just like you need to see the entire restaurant bill before deciding which items to use your coupon on!"

---

**File:** `services/createOrder.service.js`
**Documentation:** `NOTES/coupon_two_loops_explanation.md`
