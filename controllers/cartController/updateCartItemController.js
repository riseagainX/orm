const updateCartItemService = require("../../services/cartService/updateCartItemService");

class UpdateCartItemController {
  async updateCartItem(req, res) {
    try {
      // Extract inputs from body and user content ( we bind it on auth middleware )
      const given_user_id = req.user?.userID;
      const { given_cart_item_id, given_cart_item_qty, given_update_type } = req.body;

      // Basic validation similar to your style
      if (!given_user_id || given_cart_item_id == null || given_cart_item_qty == null || given_update_type == null) {
        return res.status(400).json({
          success: false,
          message: "Required fields are missing (user_id, cart_item_id, cart_item_qty, update_type).",
        });
      }

      const result = await updateCartItemService.updateCartItem({
        given_user_id,
        given_cart_item_id,
        given_cart_item_qty,
        given_update_type,
      });

      if (result.status === 'error') {
        return res.status(400).json({ success: false, message: result.message });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });

    } catch (error) {
      console.error("Error in updateCartItem controller:", error.message);
      const statusCode = error.name === 'SequelizeDatabaseError' ? 500 : 400;
      return res.status(statusCode).json({ success: false, message: error.message || 'An internal server error occurred.' });
    }
  }
}

module.exports = new UpdateCartItemController();

