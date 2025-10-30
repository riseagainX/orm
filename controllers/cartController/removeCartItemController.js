const removeCartItemService = require("../../services/cartService/removeCartItemService");

class RemoveCartItemController {
  async removeCartItem(req, res) {
    try {
      const given_user_id = req.user?.userID;
      const { given_cart_item_id } = req.body; // optional; if null => delete all for this user

      if (!given_user_id && given_user_id !== 0) {
        return res.status(400).json({ success: false, message: "User ID is required." });
      }

      const result = await removeCartItemService.removeCartItem({ given_user_id, given_cart_item_id });

      return res.status(200).json({ success: true, message: result.message, data: result.data });
    } catch (error) {
      console.error("Error in removeCartItem controller:", error.message);
      const statusCode = error.name === 'SequelizeDatabaseError' ? 500 : 400;
      return res.status(statusCode).json({ success: false, message: error.message || 'An internal server error occurred.' });
    }
  }
}

module.exports = new RemoveCartItemController();

