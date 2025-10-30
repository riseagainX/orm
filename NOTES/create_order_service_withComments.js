const { sequelize } = require('../models/index');
const { Order, OrderDetail, CartItem, Product, Brand, PromotionXProduct, Promotion, Promocode, Transaction, User, CouponCode } = require('../models');
const { getMonthlyBrandOrderTotal } = require('./orderHelpers.service');
const { checkCouponDetails, markCouponAsUsed, distributeCouponDiscount } = require('./couponHelpers.service');
const constants = require('../utils/constants');
const { Op } = require('sequelize');



const createOrder = async (orderData) => {
  const { userId, cartItemIds, displayType, ipAddress, utmSource, whatsapp, couponCode } = orderData;
  
  console.log(' Starting createOrder service with data:', orderData);
  
  // Start transaction
  const transaction = await sequelize.transaction();
  console.log(' Transaction started');   
  

  try {

    // STEP 1: COUPON VALIDATION (if provided)
  
    // We validate the coupon BEFORE processing cart items to fail fast if invalid
    // This saves processing time and provides immediate feedback to the user
    
    let validatedCoupon = null;
    let couponAmount = 0;
    let couponId = null;
    
    if (couponCode && couponCode.trim() !== '') {
      console.log(' Step 1: Validating coupon code:', couponCode);
      
      // OPTIMIZATION: Do a quick preliminary calculation to check min order value
      // This is a lightweight query to avoid processing if coupon won't be valid anyway
      const preliminaryCartItems = await CartItem.findAll({
        where: {
          id: { [Op.in]: cartItemIds.split(',') },
          user_id: userId
        },
        include: [{
          model: Product,
          where: {
            status: 'A',
            expiry_date: { [Op.gte]: new Date() },
            available_qty: { [Op.gt]: 0 }
          }
        }],
        transaction
      });
      
      // Calculate total order value (product price × quantity for all items) 

      // reduce take array and return a single varialbe ( first parameter is variable and 2nd is iteratior)
      const preliminaryTotal = preliminaryCartItems.reduce((sum, item) => {
        return sum + (item.Product ? item.Product.price * item.quantity : 0);
      }, 0);
      
      console.log(' Preliminary order total:', preliminaryTotal);
      
      // Validate coupon with 7 checks (see couponHelpers.service.js for details):
      // 1. Coupon exists
      // 2. Not already used
      // 3. Is active
      // 4. Not expired
      // 5. Not already in cart
      // 6. Not already in previous orders
      // 7. Minimum order value met
      const couponValidation = await checkCouponDetails(couponCode, userId, preliminaryTotal);
      
      if (!couponValidation.isValid) {
        throw new Error(couponValidation.message);
      }
      
      // Store validated coupon details for later use
      validatedCoupon = couponValidation.coupon;
      couponAmount = validatedCoupon.amount;
      couponId = validatedCoupon.id;
      
      console.log(' Coupon validated:', {
        couponId,
        couponAmount,
        code: validatedCoupon.coupon_code
      });
    }
    
   
    // STEP 2: INITIALIZE ORDER TRACKING VARIABLES

    
    // Get conversion ratios from constants
    const pointsToInrRatio = constants.POINTS_TO_INR_RATIO;
    const inrToPointsRatio = constants.INR_TO_POINTS_RATIO;
    console.log(' Using conversion ratios:', { pointsToInrRatio, inrToPointsRatio });
    
    // Initialize totals and flags
    let totalPoints = 0;
    let totalAmount = 0;           // Total sticker price (before any discounts)
    let offerPoints = 0;
    let offerAmount = 0;
    let payuAmount = 0;            // Final amount user needs to pay
    let totalCartAmount = 0;
    let payunor = 0;               // Payment gateway redirect flag
    let amzOrderAmount = 0;        // Track Amazon brand orders (for monthly cap)
    let fktOrderAmount = 0;        // Track Flipkart brand orders
    let productInfo = '';          // Comma-separated product names
    let totalPromotionCash = 0;    // Total promotion discounts
    
    console.log(' Initialized order totals and flags');
    
   
    // STEP 3: CREATE INITIAL ORDER RECORD
  
    // We create order first (within transaction) to get order ID for GUID generation
    // This is a safe approach - if anything fails, transaction will rollback
    
    const order = await Order.create({
      display_type: displayType,
      user_id: userId,
      coupon_id: couponId,         //  Link coupon to order (null if no coupon)
      total_points: 0,
      cash_spent: 0,
      offer_points: 0,
      payback_points_spent: 0,
      points_to_inr_ratio: pointsToInrRatio,
      inr_to_points_ratio: inrToPointsRatio,
      payback_points_earned: 0,
      extra_payback_points_earned: 0,
      status: constants.ORDER_STATUS.INITIATED,
      created: new Date(),
      ip_address: ipAddress,
      whats_app: whatsapp,
      utm_source: utmSource
    }, { transaction });
    
  
    // STEP 4: GENERATE ORDER GUID
    
    // Format: DBS-{timestamp_offset + order_id}-{current_timestamp}
    // This creates a unique identifier for tracking
    
    const orderGuid = `DBS-${(Math.floor(Date.now() / 1000) - 1483452128) + order.id}-${Math.floor(Date.now() / 1000)}`;
    await order.update({ guid: orderGuid }, { transaction });
    
 
    // STEP 5: FETCH CART ITEMS WITH PRODUCTS, BRANDS, AND PROMOTIONS
   
    
    // Get cart items with related data
    const cartItemIdArray = cartItemIds.split(',');
    console.log(' Finding cart items with IDs:', cartItemIdArray);
    
    // Handle display types: if 'ALL' is requested, allow common display types too
    const allowedDisplayTypes = (displayType === 'ALL')
      ? ['ALL', 'WEBSITE', 'WEB', 'MOBILE', 'APP', 'GAME']
      : ['ALL', displayType];
    console.log(' Allowed display types:', allowedDisplayTypes);

    // Simplified query to ensure we get results
    const cartItems = await CartItem.findAll({
      where: {
        id: { [Op.in]: cartItemIdArray },
        user_id: userId
      },
      include: [
        {
          model: Product,
          where: {
            status: 'A',
            expiry_date: { [Op.gte]: new Date() },
            available_qty: { [Op.gt]: 0 },
            display_type: { [Op.in]: allowedDisplayTypes }
          },
          include: [
            {
              model: Brand,
              where: {
                status: 'A',
                display_type: { [Op.in]: allowedDisplayTypes }
              }
            }
          ]
        },
        {
          model: Promocode,
          required: false,
          where: {
            status: 'VALID',
            start_date: { [Op.lte]: new Date() },
            expiry_date: { [Op.gte]: new Date() },
            [Op.or]: [
              { usage_type: 'M' },
              { usage_type: 'S', blasted: 'Y' }
            ]
          },
          include: [
            {
              model: Promotion,
              where: {
                status: 'A',
                display_type: { [Op.in]: ['ALL', 'GAME', ...allowedDisplayTypes] }
              }
            }
          ]
        }
      ],
      order: [['created', 'DESC']]
    });

    if (!cartItems || cartItems.length === 0) {
      console.warn(' No cart items found after filters. Check user, display_type, product availability/date.');
    }
    
    console.log("Cart Item lengh _ ",cartItems.length);
   
    
    // STEP 6: PROCESS CART ITEMS WITH COUPON DISTRIBUTION   
   
    // WHY TWO PHASES?
    // Phase 1: Collect all line items and calculate base amounts
    // Phase 2: Distribute coupon discount sequentially across items
    //
    // We need TWO phases because:
    // 1. Coupon discount is applied SEQUENTIALLY (first item, then second, etc.)
    // 2. We need to know ALL item amounts before distributing coupon
    // 3. Stored procedure does this same way - calculate all items first, then apply coupon
    //
    // EXAMPLE:
    // Item 1: ₹500, Item 2: ₹300, Coupon: ₹600
    // Phase 1: Calculate base amounts (₹500, ₹300)
    // Phase 2: Distribute coupon - Item 1 gets ₹500 off, Item 2 gets ₹100 off
   
    
    console.log(` Found ${cartItems.length} cart items to process`);
    
   
    // PHASE 1: COLLECT LINE ITEMS (First Loop)
   
    // Purpose: Gather all cart items, validate them, calculate base amounts
    // Why needed: We need total amounts before applying sequential coupon discount
    
    const lineItemsForCoupon = [];
    let counter = 1;
    
    for (const cartItem of cartItems) {
      console.log(` Processing cart item #${counter}:`, cartItem.id);
      
      // Skip if product or brand is not available
      if (!cartItem.Product || !cartItem.Product.Brand) {
        console.log(' Product or brand not available for cart item:', cartItem.id);
        throw new Error('One or more products in your cart are out of stock.');
      }
      
      const product = cartItem.Product;
      const brand = product.Brand;
      
      console.log(`  Product: ${product.id} (${product.name}), Price: ₹${product.price}`);
      console.log(`  Brand: ${brand.id} (${brand.name})`);
      
      // Add to product info string (for payment gateway)
      productInfo += `,${product.name}`;
      

      // VALIDATION 1: Check promocode validity
 
      if (cartItem.promocode_id && !cartItem.Promocode) {
        throw new Error('Promotion is not valid.');
      }
   
      // VALIDATION 2: Check promocode usage limits
  
      if (cartItem.Promocode) {
        const promocode = cartItem.Promocode;
        
        // Get total usage count for this promocode (by all users)
        const totalUsageCount = await OrderDetail.count({
          include: [{
            model: Order,
            where: { status: { [Op.ne]: 'F' } } // Exclude failed orders
          }],
          where: { promocode_id: promocode.id }
        });
        
        // Get user-specific usage count for this promocode
        const userUsageCount = await OrderDetail.count({
          include: [{
            model: Order,
            where: {
              user_id: userId,
              status: { [Op.ne]: 'F' }
            }
          }],
          where: { promocode_id: promocode.id }
        });
        
        // Get total quantity of this product in user's cart
        const cartItemTotalQty = await CartItem.sum('quantity', {
          where: {
            user_id: userId,
            product_id: product.id
          }
        });
        
        // Check total usage limit (across all users)
        if (promocode.total_max_usage && promocode.total_max_usage < totalUsageCount + cartItemTotalQty) {
          if (promocode.total_max_usage > totalUsageCount) {
            throw new Error(`Only ${promocode.total_max_usage - totalUsageCount} quantity is available for the promotion of ${product.name}. Please remove ${cartItemTotalQty - (promocode.total_max_usage - totalUsageCount)} quantity from the cart.`);
          } else {
            throw new Error(`The promotion is no more available for ${product.name}. Please delete the item from the cart.`);
          }
        }
        
        // Check user-specific usage limit
        if (promocode.user_max_usage && promocode.user_max_usage < userUsageCount + cartItemTotalQty) {
          throw new Error(`You can buy / redeem a maximum of ${promocode.user_max_usage} ${product.name} using this PROMOCODE. Please remove the excess items from your cart.`);
        }
      }
      
    
      // TRACKING: Payment gateway redirect flags

      // Determine if payment needs redirect based on brand settings
      if (brand.payu === 1 && payunor !== 2) {
        payunor = 1;
      } else if (brand.payu === 2) {
        payunor = 2;
      }
      
     
      // TRACKING: Brand-specific caps (Amazon, Flipkart)
 
      // Track amounts for brands with monthly purchase limits
      if (brand.id === 4) {        // Amazon
        amzOrderAmount += (product.price * cartItem.quantity);
      }
      if (brand.id === 158) {      // Flipkart
        fktOrderAmount += (product.price * cartItem.quantity);
      }
     
      // CALCULATION: Base line item amount (before any discounts)
   
      const lineItemAmount = product.price * cartItem.quantity;
      
      console.log(`  Line item: ₹${product.price} × ${cartItem.quantity} = ₹${lineItemAmount}`);
      
      // Add to total order amount (sticker price)
      totalAmount += lineItemAmount;
      
     
      // STORE: Save line item for coupon distribution in Phase 2

      lineItemsForCoupon.push({
        cartItem,
        product,
        brand,
        lineItemAmount, // sticker price for 1 cart item(with quantity)  price *qty
        counter
      });

      // console.log(` ${counter} line items for coupon `,lineItemsForCoupon);
      
      counter++;
    }    
  
    //  PHASE 2: DISTRIBUTE COUPON DISCOUNT (Why this is needed)

    // COUPON DISTRIBUTION LOGIC:
    // Coupons are applied SEQUENTIALLY to line items until coupon amount is exhausted
    //
    // EXAMPLE SCENARIO:
    // Cart: Item1 (₹500), Item2 (₹300), Item3 (₹200)
    // Coupon: ₹600
    //
    // Distribution:
    // - Item1: Gets ₹500 discount (full discount) → Pays ₹0
    // - Item2: Gets ₹100 discount (remaining coupon) → Pays ₹200
    // - Item3: Gets ₹0 discount (coupon exhausted) → Pays ₹200
    //
    // This matches the stored procedure behavior!

    
    let remainingCoupon = couponAmount; // Track how much coupon is left to apply
    
    const lineItemsWithCoupon = lineItemsForCoupon.map(item => {
      let couponDiscountForItem = 0;
      
      if (remainingCoupon > 0) {
        // Apply coupon to this line item (up to the item's amount)
        // Math.min ensures we don't discount more than the item's value
        couponDiscountForItem = Math.min(remainingCoupon, item.lineItemAmount);
        
        // Reduce remaining coupon by what we just applied
        remainingCoupon -= couponDiscountForItem;
      }
      return {
        ...item,
        couponDiscount: couponDiscountForItem,                          // How much coupon applied to this item
        lineItemCash: item.lineItemAmount - couponDiscountForItem      // Amount after coupon discount
      };
    });
    
    console.log(' Coupon distribution completed. Remaining coupon:', remainingCoupon);
    
    
    // PHASE 3A: PREPARE ORDER DETAILS (Calculate all, don't write yet)
    
    // Purpose: Calculate all order details including promotions and offer products
    // Collect everything in an array for bulk insert (PERFORMANCE OPTIMIZATION)
    //
    // WHY COLLECT FIRST?
    // - Bulk insert is MUCH faster than individual inserts
    // - 10 items: Individual = 100ms, Bulk = 20ms (80ms saved!)
    // - Still atomic: all or nothing within transaction
    
    
    const orderDetailsToCreate = []; // Collect all order details here
    let offerProductCounter = lineItemsWithCoupon.length; // Counter for offer products
    
    for (const lineItem of lineItemsWithCoupon) {
      const { cartItem, product, brand, lineItemAmount, lineItemCash, couponDiscount, counter: itemCounter } = lineItem;
      
     
      // PROMOTION CALCULATION (Applied AFTER coupon discount)
     
      // ORDER OF DISCOUNTS:
      // 1. Coupon discount (already applied above)
      // 2. Promotion discount (calculated now)
      // 
      // Final amount = lineItemAmount - couponDiscount - promotionDiscount
     
      let offerAmountThisLine = 0;
      let tempPromotionAmount = 0;
      
      if (cartItem.Promocode && cartItem.Promocode.Promotion) {
        const promotion = cartItem.Promocode.Promotion;
        
        // Get promotion x product details
        const promotionXProduct = await PromotionXProduct.findOne({
          where: {
            status: 'A',
            promotion_id: promotion.id,
            product_id: product.id
          }
        });
        
        if (promotionXProduct) {
          // Calculate promotion based on type:
          
          if (promotion.offer_type === 'DIS') {
            // DISCOUNT: Percentage discount (e.g., 10% off)
            //  IMPORTANT: Applied on lineItemCash (AFTER coupon discount)
            // This ensures user gets coupon first, then % discount on remaining
            tempPromotionAmount = (lineItemCash * promotion.value) / 100;
            
          } else if (promotion.offer_type === 'COMBO') {
            // COMBO: Buy X get Y discount (e.g., Buy phone get 20% off case)
            // Applied on original price (before coupon)
            tempPromotionAmount = ((product.price * promotionXProduct.product_discount) / 100) * cartItem.quantity;
            
          } else if (promotion.offer_type === 'ABS') {
            // ABSOLUTE: Fixed amount off (e.g., ₹100 off)
            tempPromotionAmount = promotion.value;
          }
        }
        console.log(`   Promotion discount: ₹${tempPromotionAmount}`);
      }
      
      offerAmountThisLine += tempPromotionAmount;
      totalPromotionCash += tempPromotionAmount;
      
      //-----------------------------------------------------------------------
      // FINAL CALCULATION: Amount user pays for this line item
      //-----------------------------------------------------------------------
      // cashSpent = lineItemCash (after coupon) - promotionDiscount
      const cashSpent = lineItemCash - offerAmountThisLine;
      payuAmount += cashSpent;
      
      console.log(`   Line item #${itemCounter} breakdown:`, {
        originalPrice: lineItemAmount,
        couponDiscount: couponDiscount,
        afterCoupon: lineItemCash,
        promotionDiscount: tempPromotionAmount,
        finalCashSpent: cashSpent
      });
      console.log(`   Running total - Order: ₹${totalAmount}, To Pay: ₹${payuAmount}`);
      
      //-----------------------------------------------------------------------
      // PREPARE ORDER DETAIL RECORD (Don't save yet - collect for bulk insert)
      //-----------------------------------------------------------------------
      // Instead of creating immediately, we collect the data in an array
      // This allows us to use bulkCreate later (much faster!)
      
      const orderDetailGuid = `${orderGuid}-${itemCounter}`;
      
      // Add to collection array (not database yet)
      orderDetailsToCreate.push({
        order_id: order.id,
        guid: orderDetailGuid,
        order_guid: orderGuid,
        cart_item_id: cartItem.id,
        brand_id: brand.id,
        product_id: product.id,
        product_price: product.price,
        quantity: cartItem.quantity,
        promocode_id: cartItem.promocode_id,
        promotion_cash: tempPromotionAmount,
        cash_spent: cashSpent,
        point_spent: 0,
        delivery_sender_name: cartItem.delivery_sender_name,
        delivery_name: cartItem.delivery_name,
        delivery_email: cartItem.delivery_email,
        delivery_phone: cartItem.delivery_phone,
        created: new Date(),
        delivery_date: cartItem.delivery_date,
        template_id: brand.template_id,
        gift: cartItem.gift,
        gift_text: cartItem.gift_text,
        gift_img_url: cartItem.gift_img_url,
        earning_point_ratio: 0
      });
      
 
      // PREPARE OFFER PRODUCT DETAIL (if applicable)

      // Some promotions include free/discounted products (Buy 1 Get 1, Combos)
      // Collect these too for bulk insert
      
      if (cartItem.Promocode && cartItem.Promocode.Promotion) {
        const promotion = cartItem.Promocode.Promotion;
       
        // Get promotion x product details
        const promotionXProduct = await PromotionXProduct.findOne({
          where: {
            status: 'A',
            promotion_id: promotion.id,
            product_id: product.id
          }
        });
       
        if (promotionXProduct && promotionXProduct.offer_product_id) {
          // Increment offer product counter
          offerProductCounter++;
          
          // Get offer product details
          const offerProduct = await Product.findOne({
            where: {
              id: promotionXProduct.offer_product_id,
              status: 'A',
              expiry_date: { [Op.gte]: new Date() },
              available_qty: { [Op.gt]: 0 },
              display_type: { [Op.in]: ['ALL', displayType] }
            },
            include: [
              {
                model: Brand,
                where: {
                  status: 'A',
                  display_type: { [Op.in]: ['ALL', displayType] }
                }
              }
            ]
          });
          
          if (offerProduct && offerProduct.Brand) {
            const offerDetailGuid = `${orderGuid}-${offerProductCounter}`;
            
            let isOffer = 1;
            let offerCashSpent = 0;
            let offerPromotionAmount = 0;
            
            if (promotion.offer_type === 'COMBO') {
              isOffer = 0;
              const amountRequired = offerProduct.price * cartItem.quantity;
              offerPromotionAmount = ((offerProduct.price * promotionXProduct.offer_product_discount) / 100) * cartItem.quantity;
              offerCashSpent = amountRequired - offerPromotionAmount;
              totalPromotionCash += offerPromotionAmount;
            }
            
            // Add offer product to collection array (not database yet)
            orderDetailsToCreate.push({
              order_id: order.id,
              guid: offerDetailGuid,
              order_guid: orderGuid,
              cart_item_id: null,
              brand_id: offerProduct.Brand.id,
              product_id: offerProduct.id,
              product_price: offerProduct.price,
              quantity: 1,
              promocode_id: null,
              promotion_cash: offerPromotionAmount,
              cash_spent: offerCashSpent,
              promotion_points: null,
              is_offer_product: isOffer,
              extra_cashback_points: 0,
              cashback_points: 0,
              delivery_sender_name: cartItem.delivery_sender_name,
              delivery_name: cartItem.delivery_name,
              delivery_email: cartItem.delivery_email,
              delivery_phone: cartItem.delivery_phone,
              created: new Date(),
              delivery_date: cartItem.delivery_date,
              template_id: brand.template_id,
              gift: cartItem.gift
            });
          }
        }
      }
      
     
      // VALIDATION: Brand monthly purchase cap
    
      // Check if brand has monthly order limit
      if (brand.order_limit === 'A') {
        const monthlyTotal = await getMonthlyBrandOrderTotal(userId, brand.id);
        if (monthlyTotal > brand.order_limit_amt) {
          throw new Error(`Sorry, You cannot place order amount more than INR ${brand.order_limit_amt} worth of ${brand.name} Gift Vouchers in this month.`);
        }
      }
    }

   
    // PHASE 3B: BULK INSERT ORDER DETAILS (PERFORMANCE OPTIMIZATION)
   
    // WHY BULK INSERT?
    // - Individual creates: 10 items × 10ms = 100ms
    // - Bulk create: 1 query × 20ms = 20ms
    // - SAVES 80ms! (4x faster)
    //
    // How it works:
    // - We collected all order details in orderDetailsToCreate array
    // - Now we insert them all at once with bulkCreate
    // - Still atomic: if this fails, transaction rolls back everything
 
    
    if (orderDetailsToCreate.length > 0) {
      await OrderDetail.bulkCreate(orderDetailsToCreate, { transaction });
      console.log(` Bulk created ${orderDetailsToCreate.length} order details`);
    }


    // VALIDATION: Amazon and Flipkart specific caps
   
    if (amzOrderAmount > 10000) {
      throw new Error('Sorry, You cannot place order amount more than INR 10000 worth of Amazon Gift Vouchers in this month.');
    }
    if (amzOrderAmount > 0) {
      const { getAmazonOrderAmountUserCap } = require('./orderHelpers.service');
      const totalAmzThisMonth = await getAmazonOrderAmountUserCap(userId, 4);
      if (totalAmzThisMonth > 10000) {
        throw new Error('Sorry, You cannot place order amount more than INR 10000 worth of Amazon Gift Vouchers in this month.');
      }
    }
    
    // Update order with final totals
    console.log(' Final order totals:', {
      totalAmount,
      totalPoints,
      payuAmount,
      offerPoints,
      payunor
    });
    
    await order.update({
      total_amount: totalAmount,
      total_points: totalPoints,
      cash_spent: payuAmount,
      offer_points: offerPoints,
      payback_points_spent: 0,
      offer_cash: totalPromotionCash,
      payunor: payunor,
      // If no payment required, mark as Verified like the procedure
      status: payuAmount === 0 ? constants.ORDER_STATUS.VERIFIED : constants.ORDER_STATUS.INITIATED
    }, { transaction });
    
    console.log(' Order updated with final totals');
    
    // Create transaction records as per stored procedure
    // Determine payment source
    let txnSource = 'PAYU';
    if (utmSource === 'PAYTMUPI') {
      txnSource = 'PAYTMUPI';
    }
    // Force to SEAMLESSPG as per stored procedure logic  -- > we will change this later
    txnSource = 'SEAMLESSPG';
    
    // Determine transaction status
    let payuStatus = 'I'; // Initiated
    if (payuAmount === 0) {
      //If payuAmount is exactly 0, it means the order is fully covered (e.g., by promotions or points)
      // If no payment required, mark transaction as Complete and order as Verified
      payuStatus = 'C';
      await order.update({ status: constants.ORDER_STATUS.VERIFIED }, { transaction });
    }
    
    // Create transaction record if payment amount > 0  //
    if (payuAmount > 0) {
      const payuGuid = `${orderGuid}`;
      
      await Transaction.create({
        user_id: userId,
        guid: payuGuid,
        source: txnSource,
        txn_type: 'DB', // Debit
        amount: payuAmount,
        order_id: order.id,
        via: 'ORDER',
        description: '',
        status: payuStatus,
        created: new Date(),
        payunor: payunor
      }, { transaction });
      
      console.log(' Transaction record created:', { guid: payuGuid, amount: payuAmount, status: payuStatus });
    }
    
    //  COUPON TRANSACTION - Create coupon transaction if coupon was used
    if (couponId && couponAmount > 0) {
      const couponGuid = `${orderGuid}-COUPON`;
      
      await Transaction.create({
        user_id: userId,
        guid: couponGuid,
        source: 'COUPON',
        txn_type: 'CR', // Credit (discount)
        amount: couponAmount,
        order_id: order.id,
        via: 'COUPON',
        description: `Coupon discount: ${validatedCoupon.coupon_code}`,
        status: 'C', // Complete
        created: new Date(),
        payunor: 0
      }, { transaction });
      
      console.log(' Coupon transaction created:', {
        guid: couponGuid,
        amount: couponAmount,
        code: validatedCoupon.coupon_code
      });
      
      //  Mark coupon as used if order is fully paid (payuAmount = 0)
      if (payuAmount === 0) {
        await markCouponAsUsed(couponId);
        console.log(' Coupon marked as used (order fully paid with coupon)');
      }
    }
    
    // Get user details for response (optional - like stored procedure does)
    const user = await User.findByPk(userId);
    
    // Get total voucher quantity
    const voucherQty = await OrderDetail.sum('quantity', {
      where: { order_guid: orderGuid },
      transaction
    });
    
    console.log(' Order summary:', {
      orderGuid,
      email: user?.email,
      phone: user?.phone,
      voucherQuantity: voucherQty || 0,
      productInfo: productInfo.replace(/^,/, '') // trim leading comma
    });
    
    // Commit transaction
    await transaction.commit();
    console.log(' Transaction committed successfully');
   

    // finall response
    const result = {
      // Order details
      orderId: order.id,
      orderGuid: order.guid,
      
      // Payment details
      payuGuid: payuAmount > 0 ? orderGuid : '',
      payuAmount: payuAmount,
      source: txnSource,
      payunor: payunor,
      
      // Amount details
      totalAmount: totalAmount,
      cashSpent: payuAmount,
      
      //  Coupon details
      couponApplied: couponId ? true : false,
      couponCode: validatedCoupon ? validatedCoupon.coupon_code : null,
      couponDiscount: couponAmount,
      
      // User details (from stored procedure)
      email: user?.email || '',
      phone: user?.phone || '',
      userLevel: user?.user_level || null,
      
      // Product and voucher info
      productInfo: productInfo.replace(/^,/, '').trim(), //  (^ anchor op)    Remove leading comma  ...The final output for productInfo is guaranteed to be a clean list of product names that does not start with a comma and has no extra spaces at the beginning or end.
      voucherQuantity: voucherQty || 0
    };
    
    console.log(' Order creation completed:', result);
    return result;
  } catch (error) {
    // Rollback transaction on error
    console.error(' Error in createOrder service:', error);
    console.log(' Rolling back transaction');
    await transaction.rollback();
    console.log(' Transaction rolled back');
    throw error;
  }
};

module.exports = {
  createOrder
}; 