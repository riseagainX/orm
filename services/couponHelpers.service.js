/*
 * Return codes:
 * -1: Coupon not found
 *  2: Coupon already used (is_used = 1)
 *  3: Coupon is inactive (status != 'A')
 *  4: Coupon is expired (valid_till < current date)
 *  5: Coupon already exists in user's cart
 *  6: Coupon already exists in user's orders
 *  7: Minimum order value not met
 *  >0: Success - returns coupon ID
 */

const { Op } = require('sequelize');
const { CouponCode, CartItem, Order } = require('../models');
// Log: import centralized logger
const logger = require('../utils/logger.util');

async function checkCouponDetails(couponCodeValue, userId, totalOrderValue) {
  try {
    // Log: validate coupon start
    logger.info('couponHelpers.checkCouponDetails started', { couponCodeValue, userId, totalOrderValue });
    // 1. Check if coupon exists
    const coupon = await CouponCode.findOne({
      where: { coupon_code: couponCodeValue },
      raw: true // filter metadeta (sequilze = prvious value etc)
    });

    // console.log("coupon --- ",coupon);

    if (!coupon) {
      // Log: not found
      logger.warn('couponHelpers.checkCouponDetails coupon not found', { couponCodeValue });
      return {
        isValid: false,
        code: -1,
        coupon: null,
        message: 'Coupon not found'
      };
    }

    // 2. Check if coupon is already used
    if (coupon.is_used === 1) {
      // Log: already used
      logger.warn('couponHelpers.checkCouponDetails coupon already used', { couponId: coupon.id });
      return {
        isValid: false,
        code: 2,
        coupon: null,
        message: 'Coupon already used'
      };
    }

    // 3. Check if coupon is active
    if (coupon.status !== 'A') {
      // Log: inactive
      logger.warn('couponHelpers.checkCouponDetails coupon inactive', { couponId: coupon.id });
      return {
        isValid: false,
        code: 3,
        coupon: null,
        message: 'Coupon is inactive'
      };
    }

    // 4. Check if coupon is expired
    const today = new Date();
    const validTill = new Date(coupon.valid_till);
    
    // Set time to end of day for valid_till comparison
    validTill.setHours(23, 59, 59, 999);
    
    if (today > validTill) {
      // Log: expired
      logger.warn('couponHelpers.checkCouponDetails coupon expired', { couponId: coupon.id });
      return {
        isValid: false,
        code: 4,
        coupon: null,
        message: 'Coupon has expired'
      };
    }

    // 5. Check if coupon already exists in user's cart (excluding current cart operation)
    const existingInCart = await CartItem.count({
      where: {
        user_id: userId,
        coupon_id: coupon.id
      }
    });

    if (existingInCart > 0) {
      // Log: already in cart
      logger.warn('couponHelpers.checkCouponDetails coupon in cart', { couponId: coupon.id, userId });
      return {
        isValid: false,
        code: 5,
        coupon: null,
        message: 'Coupon already exists in your cart'
      };
    }

    // 6. Check if coupon already exists in user's orders
    const existingInOrders = await Order.count({
      where: {
        user_id: userId,
        coupon_id: coupon.id
      }
    });

    if (existingInOrders > 0) {
      // Log: already in orders
      logger.warn('couponHelpers.checkCouponDetails coupon used in previous order', { couponId: coupon.id, userId });
      return {
        isValid: false,
        code: 6,
        coupon: null,
        message: 'Coupon already used in a previous order'
      };
    }

    // 7. Check minimum order value
    if (coupon.min_order_value && totalOrderValue < coupon.min_order_value) {
      // Log: min order not met
      logger.warn('couponHelpers.checkCouponDetails min order not met', { couponId: coupon.id, min: coupon.min_order_value, totalOrderValue });
      return {
        isValid: false,
        code: 7,
        coupon: null,
        message: `Minimum order value of ₹${coupon.min_order_value} not met`
      };
    }

    // All checks passed - coupon is valid
    logger.success('couponHelpers.checkCouponDetails valid coupon', { couponId: coupon.id, amount: coupon.amount });
    return {
      isValid: true,
      code: coupon.id,
      coupon: coupon,
      message: 'Coupon is valid',
      amount: coupon.amount
    };

  } catch (error) {
    // Log: error
    logger.error('couponHelpers.checkCouponDetails failed', error);
    console.error('Error in checkCouponDetails:', error);
    throw error;
  }
}




async function markCouponAsUsed(couponId) {
  try {
    // Log: mark used start
    logger.info('couponHelpers.markCouponAsUsed started', { couponId });
    await CouponCode.update(
      { 
        is_used: 1,
        updated: new Date()
      },
      { 
        where: { id: couponId } 
      }
    );
    // Log: success
    logger.success('couponHelpers.markCouponAsUsed success', { couponId });
    return true;
  } catch (error) {
    // Log: error
    logger.error('couponHelpers.markCouponAsUsed failed', error);
    console.error('Error marking coupon as used:', error);
    throw error;
  }
}





function distributeCouponDiscount(lineItems, couponAmount) {
  // Log: distribution start
  logger.debug('couponHelpers.distributeCouponDiscount started', { items: lineItems?.length || 0, couponAmount });
  let remainingCoupon = couponAmount;
  
  return lineItems.map(item => {
    if (remainingCoupon <= 0) {
      return {
        ...item,
        couponDiscount: 0,
        finalAmount: item.amount
      };
    }

    // Calculate discount for this line item
    const discountForItem = Math.min(remainingCoupon, item.amount);
    remainingCoupon -= discountForItem;

    return {
      ...item,
      couponDiscount: discountForItem,
      finalAmount: item.amount - discountForItem
    };
  });
}

module.exports = {
  checkCouponDetails,
  markCouponAsUsed,
  distributeCouponDiscount
};
