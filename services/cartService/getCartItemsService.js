
const { Op } = require("sequelize");
const {
  CartItem,
  Product,
  Brand,
} = require("../../models");
// Log: import centralized logger
const logger = require('../../utils/logger.util');

function buildCartItemResponse(cartItem) {
  const product = cartItem.Product;
  const brand = product.Brand;

  const dto = {
    cart_item_id: cartItem.id,
    cart_item_qty: cartItem.quantity,
    cart_delivery_name: cartItem.delivery_name,
    cart_delivery_email: cartItem.delivery_email,
    cart_delivery_phone: cartItem.delivery_phone,
    delivery_date: cartItem.delivery_date,
    brand_name: brand.name,
    slug: brand.slug,
    payu: brand.payu,
    checkout_step: brand.checkout_step,
    product_id: product.id,
    product_available_qty: product.available_qty,
    product_price: product.price,
    product_name: product.name,
  };

  return dto;
}


class GetCartItemsService {

  async getCartItems(given_user_id, given_cart_item_id = null) {
    try {
      // Log: function start
      logger.info('getCartItemsService.getCartItems started', { given_user_id, given_cart_item_id });
      // step 0 --> Validate required input
      if (!given_user_id && given_user_id !== 0) {
        throw new Error("Missing required field (user_id).");
      }

      // Step 1: Clean up temporary "Buy Now" items.
      await CartItem.destroy({
        where: { user_id: given_user_id, buynow: 1 },
      });

      // Step 2: Fetch core cart data (Query 1)
      // Get all valid cart items with their associated product and brand using INNER JOINs.
      const cartItems = await CartItem.findAll({
        where: {
          user_id: given_user_id,
          ...(given_cart_item_id && { id: given_cart_item_id }),
        },
        attributes: [
          'id', 'quantity', 'delivery_name', 'delivery_email',
          'delivery_phone', 'delivery_date', 'product_id', 'promocode_id'
        ],
        include: [
          {
            model: Product,
            required: true,
            attributes: ['id', 'name', 'price', 'available_qty'],
            where: { status: 'A', available_qty: { [Op.gt]: 0 } },
            include: [{
              model: Brand,
              required: true,
              attributes: ['id', 'name', 'slug', 'payu', 'checkout_step'],
              where: { status: 'A' },
            }],
          },
        ],
        order: [['created', 'DESC']],
      });

      if (cartItems.length === 0) {
        return {
          status: 'success',
          message: given_cart_item_id ? `Cart item ${given_cart_item_id} not found or is invalid.` : `No valid cart items found for user ${given_user_id}.`,
          data: [],
        };
      }

      // Step 3: Transform data (no promotion logic here)
      const transformedData = cartItems.map((cartItem) => {
        return buildCartItemResponse(cartItem);
      });

      // Log: success
      logger.success('getCartItemsService.getCartItems success', { count: transformedData.length });
      return {
        status: 'success',
        message: `Found ${transformedData.length} valid cart item(s).`,
        data: transformedData,
      };

    } catch (error) {
      // Log: error
      logger.error('getCartItemsService.getCartItems failed', error);
      console.error("Error in getCartItemsService:", error.message);
      // Re-throw the error so the controller can catch it and send a proper HTTP response.
      throw error;
    }
  }
}

module.exports = new GetCartItemsService();