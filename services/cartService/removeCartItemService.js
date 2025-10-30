const { CartItem } = require("../../models");
// Log: import centralized logger
const logger = require('../../utils/logger.util');

class RemoveCartItemService {
  
  async removeCartItem({ given_user_id, given_cart_item_id }) {
    // Log: function start
    logger.info('removeCartItemService.removeCartItem started', { given_user_id, given_cart_item_id });
    if (!given_user_id && given_user_id !== 0) {
      throw new Error("Missing required field (user_id).");
    }

    const whereClause = { user_id: given_user_id };
    if (given_cart_item_id != null) {
      whereClause.id = given_cart_item_id;
    }

    const deletedCount = await CartItem.destroy({ where: whereClause });

    // Log: success
    logger.success('removeCartItemService.removeCartItem success', { deletedCount });
    return {
      status: 'success',
      message: deletedCount > 0 ? 'Cart item(s) removed successfully.' : 'No cart items matched for deletion.',
      data: { deletedCount }
    };
  }
}

module.exports = new RemoveCartItemService();

