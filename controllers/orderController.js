const { createOrder } = require('../services/createOrder.service');



const createOrderController = async (req, res) => {
  try {
    console.log('Starting order creation process...');
    const { cart_item_ids, display_type, whatsapp, coupon_code } = req.body;
    console.log('Request body:', req.body);
    
    
  
   
    const userId = req.user?.userID;
    console.log(' Using userId from token:', userId);
    
    if (!userId) {
      return res.status(401).json({ 
        status: false, 
        message: 'Unauthorized: user not found in token' 
      });
    }
    
   
    const ipAddress = req.ip || req.connection.remoteAddress;
    const utmSource = req.body.utm_source || req.query.utm_source || null;
    
    
    const couponCode = coupon_code || null;
    
    if (couponCode) {
      console.log(' Coupon code provided:', couponCode);
    }


    if (!cart_item_ids) {
      return res.status(400).json({
        status: false,
        message: 'Cart item IDs are required'
      });
    }

    console.log(' Calling createOrder service with params:', {
      userId,
      cartItemIds: cart_item_ids,
      displayType: display_type || 'ALL',
      whatsapp: whatsapp || 'N',
      couponCode: couponCode || 'None'
    });
    
    const orderResult = await createOrder({
      userId,
      cartItemIds: cart_item_ids,
      displayType: display_type || 'ALL',
      ipAddress,
      utmSource,
      whatsapp: whatsapp || 'N',
      couponCode: couponCode  
    });
    
    console.log(' Order created successfully:', orderResult);

   
    
    return res.status(200).json({
      status: true,
      message: 'Order created successfully',
      data: {

        order_id: orderResult.orderId,
        order_guid: orderResult.orderGuid,
        total_amount: orderResult.totalAmount,        // Original cart total
        cash_spent: orderResult.cashSpent,            // Final amount to pay
        payunor: orderResult.payunor,

        payu_guid: orderResult.payuGuid || '',        // Payment transaction ID
        payu_amount: orderResult.payuAmount ?? orderResult.cashSpent ?? 0,  // Amount for payment
        txn_source: orderResult.source || 'SEAMLESSPG',  // Payment method
        
       
        coupon_applied: orderResult.couponApplied || false,      // Was coupon used?
        coupon_code: orderResult.couponCode || null,             // Which coupon?
        coupon_discount: orderResult.couponDiscount || 0,        // How much saved?
        
      
        productinfo: orderResult.productInfo || '',              // Product names
        email: orderResult.email || '',                          // User email
        phone: orderResult.phone || '',                          // User phone
        user_level: orderResult.userLevel ?? null,               // User tier
        voucher_quantity: orderResult.voucherQuantity ?? 0       // Total vouchers
      }
    });
  } catch (error) {
    console.error(' Error in createOrderController:', error);
    
    return res.status(400).json({
      status: false,
      message: error.message || 'Failed to create order'
    });
  }
};

module.exports = {
  createOrderController
};