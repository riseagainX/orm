const { Op, literal } = require("sequelize");
const { CartItem, Product } = require("../../models");
// Log: import centralized logger
const logger = require('../../utils/logger.util');

class UpdateCartItemService {
  /**
   * Update cart item quantity per the provided procedure.
   * Inputs:
   *  - given_user_id: authenticated user id (number)
   *  - given_cart_item_id: target cart item id (number)
   *  - given_cart_item_qty: always 1 per procedure validation (number)
   *  - given_update_type: 1 => increment, 0 => decrement (number)
   */
  async updateCartItem({ given_user_id, given_cart_item_id, given_cart_item_qty, given_update_type }) {
    // Log: function start
    logger.info('updateCartItemService.updateCartItem started', { given_user_id, given_cart_item_id, given_update_type });
    // 1) Validate presence of required inputs early
    if (!given_user_id || !given_cart_item_id && given_cart_item_id !== 0) {
      throw new Error("Missing required fields (user_id, cart_item_id).");
    }

    // 2) Check cart item exists for this user
    const cartItem = await CartItem.findOne({
      where: { id: given_cart_item_id, user_id: given_user_id },
      attributes: ['id', 'user_id', 'product_id', 'quantity']
    });

    if (!cartItem) {
      return { status: 'error', message: 'Not a cart item.' };
    }

    // 3) Validate product availability against requested operation
    const productCount = await Product.count({
      include: [{
        model: CartItem,
        required: true,
        attributes: [],
        where: { id: given_cart_item_id }
      }],
      where: {
        id: cartItem.product_id,
        available_qty: { [Op.gte]: given_cart_item_qty }
      }
    });

    if (productCount === 0) {
      return { status: 'error', message: 'Invalid product.' };
    }

    // 4) Load current quantity
    const currentQty = cartItem.quantity;

    // Procedure validations
    if (currentQty === 1 && given_update_type === 0) {
      return { status: 'error', message: 'Can not use quantity less than 1.' };
    }
    if (currentQty === 10 && given_update_type === 1) {
      return { status: 'error', message: 'Can not use quantity greater than 10.' };
    }
    if (given_cart_item_qty == null || given_cart_item_qty !== 1) {
      return { status: 'error', message: 'Invalid request.' };
    }

    // 5) Perform the update
    if (given_update_type === 1) {
      // increment
      await CartItem.update(
        { quantity: literal(`quantity + ${given_cart_item_qty}`) },
        { where: { id: given_cart_item_id } }
      );
    } else if (given_update_type === 0) {
      // decrement
      await CartItem.update(
        { quantity: literal(`quantity - ${given_cart_item_qty}`) },
        { where: { id: given_cart_item_id } }
      );
    } else {
      return { status: 'error', message: 'Invalid request.' };
    }

    // 6) Return the updated quantity
    const updated = await CartItem.findOne({
      where: { id: given_cart_item_id },
      attributes: ['id', 'quantity']
    });

    // Log: success
    logger.success('updateCartItemService.updateCartItem success', { cart_item_id: updated.id, updated_quantity: updated.quantity });
    return {
      status: 'success',
      message: 'Cart item updated successfully.',
      data: { cart_item_id: updated.id, updated_quantity: updated.quantity }
    };
  }
}

module.exports = new UpdateCartItemService();

