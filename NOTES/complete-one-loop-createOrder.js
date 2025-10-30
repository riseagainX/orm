/**
 * COMPLETE ONE-LOOP VERSION OF createOrder
 * 
 * This is a full working implementation using a single loop approach.
 * It shows ALL the code you would need and highlights the problems.
 * 
 * ⚠️ WARNING: This approach has hidden dangers (see why-reset-coupon-is-hard.md)
 */

const { sequelize } = require('../models/index');
const { Order, OrderDetail, CartItem, Product, Brand, PromotionXProduct, Promotion, Promocode, Transaction, User, CouponCode } = require('../models');
const { getMonthlyBrandOrderTotal } = require('./orderHelpers.service');
const { checkCouponDetails, markCouponAsUsed } = require('./couponHelpers.service');
const constants = require('../utils/constants');
const { Op } = require('sequelize');

const createOrderOneLoop = async (orderData) => {
  const { userId, cartItemIds, displayType, ipAddress, utmSource, whatsapp, couponCode } = orderData;
  
  console.log('🔄 Starting ONE-LOOP createOrder service');
  
  // Start transaction
  const transaction = await sequelize.transaction();
  
  try {
    //=============================================================================
    // STEP 1: COUPON VALIDATION
    //=============================================================================
    let validatedCoupon = null;
    let couponAmount = 0;
    let couponId = null;
    
    if (couponCode && couponCode.trim() !== '') {
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
      
      const preliminaryTotal = preliminaryCartItems.reduce((sum, item) => {
        return sum + (item.Product ? item.Product.price * item.quantity : 0);
      }, 0);
      
      const couponValidation = await checkCouponDetails(couponCode, userId, preliminaryTotal);
      
      if (!couponValidation.isValid) {
        throw new Error(couponValidation.message);
      }
      
      validatedCoupon = couponValidation.coupon;
      couponAmount = validatedCoupon.amount;
      couponId = validatedCoupon.id;
    }
    
    //=============================================================================
    // STEP 2: INITIALIZE VARIABLES
    //=============================================================================
    const pointsToInrRatio = constants.POINTS_TO_INR_RATIO;
    const inrToPointsRatio = constants.INR_TO_POINTS_RATIO;
    
    let totalPoints = 0;
    let totalAmount = 0;
    let offerPoints = 0;
    let payuAmount = 0;
    let payunor = 0;
    let amzOrderAmount = 0;
    let fktOrderAmount = 0;
    let productInfo = '';
    let totalPromotionCash = 0;
    
    //=============================================================================
    // STEP 3: CREATE ORDER
    //=============================================================================
    const order = await Order.create({
      display_type: displayType,
      user_id: userId,
      coupon_id: couponId,
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
    
    const orderGuid = `DBS-${(Math.floor(Date.now() / 1000) - 1483452128) + order.id}-${Math.floor(Date.now() / 1000)}`;
    await order.update({ guid: orderGuid }, { transaction });
    
    //=============================================================================
    // STEP 4: FETCH CART ITEMS
    //=============================================================================
    const cartItemIdArray = cartItemIds.split(',');
    const allowedDisplayTypes = (displayType === 'ALL')
      ? ['ALL', 'WEBSITE', 'WEB', 'MOBILE', 'APP', 'GAME']
      : ['ALL', displayType];

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
          include: [{
            model: Brand,
            where: {
              status: 'A',
              display_type: { [Op.in]: allowedDisplayTypes }
            }
          }]
        },
        {
          model: Promocode,
          required: false,
          where: {
            status: 'VALID',
            start_date: { [Op.lte]: new Date() },
            expiry_date: { [Op.gte]: new Date() }
          },
          include: [{
            model: Promotion,
            where: {
              status: 'A',
              display_type: { [Op.in]: ['ALL', 'GAME', ...allowedDisplayTypes] }
            }
          }]
        }
      ],
      order: [['created', 'DESC']]
    });

    //=============================================================================
    // ⚠️ SINGLE LOOP - EVERYTHING IN ONE LOOP
    //=============================================================================
    // THIS IS THE KEY DIFFERENCE: We do EVERYTHING in one loop:
    // - Calculate amounts
    // - Apply coupon (MUTATE remainingCoupon)
    // - Apply promotions
    // - Validate
    // - Write to database
    //
    // DANGER: If validation fails halfway through, we have already:
    // 1. Changed remainingCoupon in memory
    // 2. Written some order_details to DB
    //=============================================================================
    
    let remainingCoupon = couponAmount; // ⚠️ THIS GETS MUTATED IN THE LOOP
    let counter = 1;
    
    for (const cartItem of cartItems) {
      console.log(`📦 Processing item ${counter}`);
      
      // Skip if product not available
      if (!cartItem.Product || !cartItem.Product.Brand) {
        throw new Error('Product not available');
      }
      
      const product = cartItem.Product;
      const brand = product.Brand;
      
      productInfo += `,${product.name}`;
      
      //-----------------------------------------------------------------------
      // VALIDATION: Promocode
      //-----------------------------------------------------------------------
      if (cartItem.promocode_id && !cartItem.Promocode) {
        throw new Error('Promotion is not valid.');
      }
      
      if (cartItem.Promocode) {
        const promocode = cartItem.Promocode;
        
        const totalUsageCount = await OrderDetail.count({
          include: [{
            model: Order,
            where: { status: { [Op.ne]: 'F' } }
          }],
          where: { promocode_id: promocode.id }
        });
        
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
        
        const cartItemTotalQty = await CartItem.sum('quantity', {
          where: {
            user_id: userId,
            product_id: product.id
          }
        });
        
        if (promocode.total_max_usage && promocode.total_max_usage < totalUsageCount + cartItemTotalQty) {
          // ⚠️ ERROR THROWN HERE - But remainingCoupon already changed!
          throw new Error(`Promotion limit reached for ${product.name}`);
        }
        
        if (promocode.user_max_usage && promocode.user_max_usage < userUsageCount + cartItemTotalQty) {
          // ⚠️ ERROR THROWN HERE - But remainingCoupon already changed!
          throw new Error(`You have reached max usage for ${product.name}`);
        }
      }
      
      //-----------------------------------------------------------------------
      // TRACKING: Payment gateway flags
      //-----------------------------------------------------------------------
      if (brand.payu === 1 && payunor !== 2) {
        payunor = 1;
      } else if (brand.payu === 2) {
        payunor = 2;
      }
      
      //-----------------------------------------------------------------------
      // TRACKING: Brand caps
      //-----------------------------------------------------------------------
      if (brand.id === 4) {
        amzOrderAmount += (product.price * cartItem.quantity);
      }
      if (brand.id === 158) {
        fktOrderAmount += (product.price * cartItem.quantity);
      }
      
      //-----------------------------------------------------------------------
      // CALCULATION: Base amount
      //-----------------------------------------------------------------------
      const lineItemAmount = product.price * cartItem.quantity;
      totalAmount += lineItemAmount;
      
      //-----------------------------------------------------------------------
      // ⚠️ COUPON APPLICATION - MUTATING remainingCoupon HERE
      //-----------------------------------------------------------------------
      // THIS IS THE PROBLEM:
      // We change remainingCoupon while we're still validating
      // If a later item fails validation, we've already consumed the coupon
      //-----------------------------------------------------------------------
      let couponDiscountForItem = 0;
      
      if (remainingCoupon > 0) {
        couponDiscountForItem = Math.min(remainingCoupon, lineItemAmount);
        
        // ⚠️ MUTATION HAPPENS HERE - Point of no return!
        remainingCoupon -= couponDiscountForItem;
        
        console.log(`💳 Applied ₹${couponDiscountForItem} coupon. Remaining: ₹${remainingCoupon}`);
      }
      
      const lineItemCash = lineItemAmount - couponDiscountForItem;
      
      //-----------------------------------------------------------------------
      // PROMOTION CALCULATION
      //-----------------------------------------------------------------------
      let tempPromotionAmount = 0;
      
      if (cartItem.Promocode && cartItem.Promocode.Promotion) {
        const promotion = cartItem.Promocode.Promotion;
        
        const promotionXProduct = await PromotionXProduct.findOne({
          where: {
            status: 'A',
            promotion_id: promotion.id,
            product_id: product.id
          }
        });
        
        if (promotionXProduct) {
          if (promotion.offer_type === 'DIS') {
            tempPromotionAmount = (lineItemCash * promotion.value) / 100;
          } else if (promotion.offer_type === 'COMBO') {
            tempPromotionAmount = ((product.price * promotionXProduct.product_discount) / 100) * cartItem.quantity;
          } else if (promotion.offer_type === 'ABS') {
            tempPromotionAmount = promotion.value;
          }
        }
      }
      
      totalPromotionCash += tempPromotionAmount;
      const cashSpent = lineItemCash - tempPromotionAmount;
      payuAmount += cashSpent;
      
      //-----------------------------------------------------------------------
      // ⚠️ DATABASE WRITE - WHILE LOOP IS STILL RUNNING
      //-----------------------------------------------------------------------
      // DANGER: We're writing to DB before all validations are complete
      // If item 5 fails validation, we've already written items 1-4
      //-----------------------------------------------------------------------
      const orderDetail = await OrderDetail.create({
        order_id: order.id,
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
      }, { transaction });
      
      const orderDetailGuid = `${orderGuid}-${counter}`;
      await orderDetail.update({ guid: orderDetailGuid }, { transaction });
      
      console.log(`✅ OrderDetail created for item ${counter}`);
      
      //-----------------------------------------------------------------------
      // HANDLE OFFER PRODUCTS
      //-----------------------------------------------------------------------
      if (cartItem.Promocode && cartItem.Promocode.Promotion) {
        const promotion = cartItem.Promocode.Promotion;
        
        const promotionXProduct = await PromotionXProduct.findOne({
          where: {
            status: 'A',
            promotion_id: promotion.id,
            product_id: product.id
          }
        });
        
        if (promotionXProduct && promotionXProduct.offer_product_id) {
          const offerProduct = await Product.findOne({
            where: {
              id: promotionXProduct.offer_product_id,
              status: 'A',
              expiry_date: { [Op.gte]: new Date() },
              available_qty: { [Op.gt]: 0 }
            },
            include: [{
              model: Brand,
              where: { status: 'A' }
            }]
          });
          
          if (offerProduct && offerProduct.Brand) {
            let isOffer = 1;
            let offerCashSpent = 0;
            let offerPromotionAmount = 0;
            
            if (promotion.offer_type === 'COMBO') {
              isOffer = 0;
              offerPromotionAmount = ((offerProduct.price * promotionXProduct.offer_product_discount) / 100) * cartItem.quantity;
              offerCashSpent = (offerProduct.price * cartItem.quantity) - offerPromotionAmount;
              totalPromotionCash += offerPromotionAmount;
            }
            
            await OrderDetail.create({
              order_id: order.id,
              guid: `${orderGuid}-${counter + 100}`,
              order_guid: orderGuid,
              brand_id: offerProduct.Brand.id,
              product_id: offerProduct.id,
              product_price: offerProduct.price,
              quantity: 1,
              promotion_cash: offerPromotionAmount,
              cash_spent: offerCashSpent,
              is_offer_product: isOffer,
              delivery_sender_name: cartItem.delivery_sender_name,
              delivery_name: cartItem.delivery_name,
              delivery_email: cartItem.delivery_email,
              delivery_phone: cartItem.delivery_phone,
              created: new Date(),
              delivery_date: cartItem.delivery_date,
              template_id: brand.template_id
            }, { transaction });
          }
        }
      }
      
      //-----------------------------------------------------------------------
      // BRAND LIMIT VALIDATION (After DB write!)
      //-----------------------------------------------------------------------
      if (brand.order_limit === 'A') {
        const monthlyTotal = await getMonthlyBrandOrderTotal(userId, brand.id);
        if (monthlyTotal > brand.order_limit_amt) {
          // ⚠️ ERROR THROWN HERE - But we already:
          // 1. Mutated remainingCoupon
          // 2. Written order_details to DB
          throw new Error(`Monthly limit exceeded for ${brand.name}`);
        }
      }
      
      counter++;
    } // End of single loop
    
    //=============================================================================
    // VALIDATION: Amazon/Flipkart Caps (After loop)
    //=============================================================================
    if (amzOrderAmount > 10000) {
      // ⚠️ ERROR HERE - After all items processed!
      throw new Error('Amazon order limit exceeded');
    }
    
    //=============================================================================
    // UPDATE ORDER
    //=============================================================================
    await order.update({
      total_amount: totalAmount,
      total_points: totalPoints,
      cash_spent: payuAmount,
      offer_points: offerPoints,
      payback_points_spent: 0,
      offer_cash: totalPromotionCash,
      payunor: payunor,
      status: payuAmount === 0 ? constants.ORDER_STATUS.VERIFIED : constants.ORDER_STATUS.INITIATED
    }, { transaction });
    
    //=============================================================================
    // CREATE TRANSACTIONS
    //=============================================================================
    let txnSource = utmSource === 'PAYTMUPI' ? 'PAYTMUPI' : 'SEAMLESSPG';
    let payuStatus = payuAmount === 0 ? 'C' : 'I';
    
    if (payuAmount > 0) {
      await Transaction.create({
        user_id: userId,
        guid: orderGuid,
        source: txnSource,
        txn_type: 'DB',
        amount: payuAmount,
        order_id: order.id,
        via: 'ORDER',
        description: '',
        status: payuStatus,
        created: new Date(),
        payunor: payunor
      }, { transaction });
    }
    
    if (couponId && couponAmount > 0) {
      await Transaction.create({
        user_id: userId,
        guid: `${orderGuid}-COUPON`,
        source: 'COUPON',
        txn_type: 'CR',
        amount: couponAmount,
        order_id: order.id,
        via: 'COUPON',
        description: `Coupon discount: ${validatedCoupon.coupon_code}`,
        status: 'C',
        created: new Date(),
        payunor: 0
      }, { transaction });
      
      if (payuAmount === 0) {
        await markCouponAsUsed(couponId);
      }
    }
    
    //=============================================================================
    // COMMIT
    //=============================================================================
    await transaction.commit();
    console.log('✅ Transaction committed');
    
    const user = await User.findByPk(userId);
    const voucherQty = await OrderDetail.sum('quantity', {
      where: { order_guid: orderGuid }
    });
    
    return {
      orderId: order.id,
      orderGuid: order.guid,
      payuGuid: payuAmount > 0 ? orderGuid : '',
      payuAmount: payuAmount,
      source: txnSource,
      payunor: payunor,
      totalAmount: totalAmount,
      cashSpent: payuAmount,
      couponApplied: couponId ? true : false,
      couponCode: validatedCoupon ? validatedCoupon.coupon_code : null,
      couponDiscount: couponAmount,
      email: user?.email || '',
      phone: user?.phone || '',
      userLevel: user?.user_level || null,
      productInfo: productInfo.replace(/^,/, '').trim(),
      voucherQuantity: voucherQty || 0
    };
    
  } catch (error) {
    //===========================================================================
    // ⚠️ ROLLBACK - THE PROBLEM AREA
    //===========================================================================
    // When we reach here:
    // 1. Database writes are rolled back ✅
    // 2. remainingCoupon is still modified ❌
    //
    // Example scenario:
    // - Started with couponAmount = 600
    // - Item 1: applied 500, remainingCoupon = 100
    // - Item 2: applied 100, remainingCoupon = 0
    // - Item 3: validation failed
    // - Rollback happens
    // - Database is clean (no rows)
    // - BUT remainingCoupon is still 0 in this function scope
    //
    // If user retries immediately, where does remainingCoupon come from?
    // From the fresh function call! So it WILL be reset to couponAmount.
    //
    // SO WHY IS THIS STILL A PROBLEM?
    // Read why-reset-coupon-is-hard.md for the full explanation!
    //===========================================================================
    
    console.error('❌ Error in createOrder:', error);
    console.log('🔄 Rolling back transaction');
    
    await transaction.rollback();
    
    // ⚠️ NOTE: remainingCoupon is still modified here
    // But since this is a function scope, it will be garbage collected
    // On retry, a new function call will start fresh with original couponAmount
    //
    // HOWEVER: This pattern is fragile and error-prone (see notes)
    
    throw error;
  }
};

module.exports = {
  createOrderOneLoop
};

/**
 * SUMMARY OF PROBLEMS WITH ONE-LOOP APPROACH:
 * 
 * 1. STATE MUTATION DURING VALIDATION
 *    - remainingCoupon changes while we're still checking if order is valid
 *    - If validation fails, we've already consumed the coupon in memory
 * 
 * 2. DATABASE WRITES DURING VALIDATION
 *    - We write order_details before knowing if all items are valid
 *    - Requires database rollback if later items fail
 * 
 * 3. MIXED CONCERNS
 *    - Calculation + Validation + Persistence all in one loop
 *    - Hard to test individual parts
 *    - Hard to debug when something goes wrong
 * 
 * 4. FRAGILE ERROR HANDLING
 *    - Must rely on database transaction rollback
 *    - In-memory state and database state can get out of sync
 *    - Easy to introduce bugs when code changes
 * 
 * 5. HARDER TO OPTIMIZE
 *    - Can't easily add bulk operations
 *    - Can't parallelize safe parts
 *    - Can't cache calculations
 * 
 * See why-reset-coupon-is-hard.md for detailed explanation!
 */
