const { sequelize } = require('../models/index');
const { Order, OrderDetail, CartItem, Product, Brand, PromotionXProduct, Promotion, Promocode, Transaction, User, CouponCode } = require('../models');
const { getMonthlyBrandOrderTotal } = require('./orderHelpers.service');
const { checkCouponDetails, markCouponAsUsed, distributeCouponDiscount } = require('./couponHelpers.service');
const constants = require('../utils/constants');
const { Op } = require('sequelize');
// Log: import centralized logger
const logger = require('../utils/logger.util');


const createOrder = async (orderData) => {
  const { userId, cartItemIds, displayType, ipAddress, utmSource, whatsapp, couponCode } = orderData;
  
  console.log(' Starting createOrder service with data:', orderData);
  // Log: service start with key params
  logger.info('createOrder.service.createOrder started', { userId, cartItemIds, displayType, couponCode });
  
  // Start transaction
  const transaction = await sequelize.transaction();
  console.log(' Transaction started');   
  

  
  try {
    // Step 1: Validate coupon code if provided
    let validatedCoupon = null;
    let couponAmount = 0;
    let couponId = null;
    
    if (couponCode && couponCode.trim() !== '') {

      console.log(' Step 1: Validating coupon code:', couponCode);
      
      // Fetch cart items to calculate preliminary order total
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
      
      // Calculate total order value
      const preliminaryTotal = preliminaryCartItems.reduce((sum, item) => {
        return sum + (item.Product ? item.Product.price * item.quantity : 0);
      }, 0);
      
      console.log(' Preliminary order total:', preliminaryTotal);
      
      // Validate coupon (exists, active, not expired, not used, meets min order value)
      const couponValidation = await checkCouponDetails(couponCode, userId, preliminaryTotal);
      
      if (!couponValidation.isValid) {
        throw new Error(couponValidation.message);
      }
      
      // Store validated coupon details
      validatedCoupon = couponValidation.coupon;
      couponAmount = validatedCoupon.amount;
      couponId = validatedCoupon.id;
      
      console.log(' Coupon validated:', {
        couponId,
        couponAmount,
        code: validatedCoupon.coupon_code
      });
    }
    
    // Step 2: Initialize order tracking variables
    const pointsToInrRatio = constants.POINTS_TO_INR_RATIO;
    const inrToPointsRatio = constants.INR_TO_POINTS_RATIO;
    console.log(' Using conversion ratios:', { pointsToInrRatio, inrToPointsRatio });
    
    let totalPoints = 0;
    let totalAmount = 0;
    let offerPoints = 0;
    let offerAmount = 0;
    let payuAmount = 0;
    let totalCartAmount = 0;
    let payunor = 0;               // Payment gateway redirect flag
    let amzOrderAmount = 0;        // Track Amazon brand orders (for monthly cap)
    let fktOrderAmount = 0;        // Track Flipkart brand orders
    let productInfo = '';          // Comma-separated product names
    let totalPromotionCash = 0;    // Total promotion discounts
    
    console.log(' Initialized order totals and flags');
    
    // Step 3: Create initial order record
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
    
    // Step 4: Generate order GUID
    const orderGuid = `DBS-${(Math.floor(Date.now() / 1000) - 1483452128) + order.id}-${Math.floor(Date.now() / 1000)}`;
    await order.update({ guid: orderGuid }, { transaction });
    
    // Step 5: Fetch cart items with products, brands, and promotions
    const cartItemIdArray = cartItemIds.split(',');
    console.log(' Finding cart items with IDs:', cartItemIdArray);
    
    // Determine allowed display types
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
   
    // Step 6: Process cart items with coupon distribution
    console.log(` Found ${cartItems.length} cart items to process`);
    
    // Phase 1: Collect line items and calculate base amounts
    const lineItemsForCoupon = [];
    let counter = 1;
    
    for (const cartItem of cartItems) {
      console.log(` Processing cart item #${counter}:`, cartItem.id);
      
      if (!cartItem.Product || !cartItem.Product.Brand) {
        console.log(' Product or brand not available for cart item:', cartItem.id);
        throw new Error('One or more products in your cart are out of stock.');
      }
      
      const product = cartItem.Product;
      const brand = product.Brand;
      
      console.log(`  Product: ${product.id} (${product.name}), Price: ₹${product.price}`);
      console.log(`  Brand: ${brand.id} (${brand.name})`);
      
      productInfo += `,${product.name}`;
      
      // Validate promocode exists if referenced
      if (cartItem.promocode_id && !cartItem.Promocode) {
        throw new Error('Promotion is not valid.');
      }
   
      // Validate promocode usage limits
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
      
      // Set payment gateway redirect flag
      if (brand.payu === 1 && payunor !== 2) {
        payunor = 1;
      } else if (brand.payu === 2) {
        payunor = 2;
      }
      
      // Track brand-specific order amounts for monthly caps
      if (brand.id === 4) {
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
      
      // Store line item for coupon distribution
      lineItemsForCoupon.push({
        cartItem,
        product,
        brand,
        lineItemAmount,
        counter
      });
      
      counter++;
    }    
  
    // Phase 2: Distribute coupon discount sequentially across line items
    let remainingCoupon = couponAmount;
    
    const lineItemsWithCoupon = lineItemsForCoupon.map(item => {
      let couponDiscountForItem = 0;
      
      if (remainingCoupon > 0) {
        couponDiscountForItem = Math.min(remainingCoupon, item.lineItemAmount);
        remainingCoupon -= couponDiscountForItem;
      }
      return {
        ...item,
        couponDiscount: couponDiscountForItem,
        lineItemCash: item.lineItemAmount - couponDiscountForItem
      };
    });
    
    console.log(' Coupon distribution completed. Remaining coupon:', remainingCoupon);
    
    // Phase 3A: Prepare order details for bulk insert
    const orderDetailsToCreate = [];
    let offerProductCounter = lineItemsWithCoupon.length;
    
    for (const lineItem of lineItemsWithCoupon) {
      const { cartItem, product, brand, lineItemAmount, lineItemCash, couponDiscount, counter: itemCounter } = lineItem;
      
      // Calculate promotion discount (applied after coupon)
      let offerAmountThisLine = 0;
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
        console.log(`   Promotion discount: ₹${tempPromotionAmount}`);
      }
      
      offerAmountThisLine += tempPromotionAmount;
      totalPromotionCash += tempPromotionAmount;
      
      // Calculate final amount user pays for this line item
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
      
      // Prepare order detail record
      const orderDetailGuid = `${orderGuid}-${itemCounter}`;
      
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
      
      // Prepare offer product detail if promotion includes one
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
          offerProductCounter++;
          
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
      
      // Validate brand monthly purchase cap
      if (brand.order_limit === 'A') {
        const monthlyTotal = await getMonthlyBrandOrderTotal(userId, brand.id);
        if (monthlyTotal > brand.order_limit_amt) {
          throw new Error(`Sorry, You cannot place order amount more than INR ${brand.order_limit_amt} worth of ${brand.name} Gift Vouchers in this month.`);
        }
      }
    }

    // Phase 3B: Bulk insert all order details
    if (orderDetailsToCreate.length > 0) {
      await OrderDetail.bulkCreate(orderDetailsToCreate, { transaction });
      console.log(` Bulk created ${orderDetailsToCreate.length} order details`);
    }

    // Validate Amazon and Flipkart order caps
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
    
    console.log(' Final order totals:', {
      totalAmount,
      totalPoints,
      payuAmount,
      offerPoints,
      payunor
    });
    
    // Update order with final totals
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
    
    console.log(' Order updated with final totals');
    
    // Determine payment source
    let txnSource = 'PAYU';
    if (utmSource === 'PAYTMUPI') {
      txnSource = 'PAYTMUPI';
    }
    txnSource = 'SEAMLESSPG';
    
    let payuStatus = 'I';
    if (payuAmount === 0) {
      payuStatus = 'C';
      await order.update({ status: constants.ORDER_STATUS.VERIFIED }, { transaction });
    }
    
    // Create transaction record for payment
    if (payuAmount > 0) {
      const payuGuid = `${orderGuid}`;
      
      await Transaction.create({
        user_id: userId,
        guid: payuGuid,
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
      
      console.log(' Transaction record created:', { guid: payuGuid, amount: payuAmount, status: payuStatus });
    }
    
    // Create coupon transaction if coupon was used
    if (couponId && couponAmount > 0) {
      const couponGuid = `${orderGuid}-COUPON`;
      
      await Transaction.create({
        user_id: userId,
        guid: couponGuid,
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
      
      console.log(' Coupon transaction created:', {
        guid: couponGuid,
        amount: couponAmount,
        code: validatedCoupon.coupon_code
      });
      
      // Mark coupon as used if order is fully paid
      if (payuAmount === 0) {
        await markCouponAsUsed(couponId);
        console.log(' Coupon marked as used (order fully paid with coupon)');
      }
    }
    
    // Get user details and voucher quantity
    const user = await User.findByPk(userId);
    
    const voucherQty = await OrderDetail.sum('quantity', {
      where: { order_guid: orderGuid },
      transaction
    });
    
    console.log(' Order summary:', {
      orderGuid,
      email: user?.email,
      phone: user?.phone,
      voucherQuantity: voucherQty || 0,
      productInfo: productInfo.replace(/^,/, '')
    });
    
  await transaction.commit();
  console.log(' Transaction committed successfully');
  // Log: success
  logger.success('createOrder.service.createOrder committed', { orderGuid: order.guid, orderId: order.id, payuAmount });
   
    // Prepare final response
    const result = {
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
    
    console.log(' Order creation completed:', result);
    return result;
  } catch (error) {
    console.error(' Error in createOrder service:', error);
    // Log: error
    logger.error('createOrder.service.createOrder failed', error);
    console.log(' Rolling back transaction');
    await transaction.rollback();
    console.log(' Transaction rolled back');
    throw error;
  }
};

module.exports = {
  createOrder
}; 