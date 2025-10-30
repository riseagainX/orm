const getCartItemsService = require("../../services/cartService/getCartItemsService");

class GetCartItems {
  async getCartItems(req, res) {
    try {
      // Extract user_id from authenticated user and cart_item_id from request body
      const given_user_id = req.user.userID;
      const { given_cart_item_id } = req.body;

      console.log("Debug - Request body:", req.body);
      console.log("Debug - User ID:", given_user_id);

      // Validate required fields
      if (!given_user_id) {
        return res.status(400).json({
          success: false,
          message: "User ID is required. Please ensure user is authenticated.",
        });
      }

      // Call service to get cart items
      const result = await getCartItemsService.getCartItems(given_user_id, given_cart_item_id);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });

    } catch (error) {
      // Handle Errors Thrown by the Service 
      console.error("Error in getCartItems controller:", error.message);

      // Send appropriate status code based on error type
      const statusCode = error.name === 'SequelizeDatabaseError' ? 500 : 400;

      return res.status(statusCode).json({
        success: false,
        message: error.message || "An internal server error occurred.",
      });
    }
  }
}

module.exports = new GetCartItems();
