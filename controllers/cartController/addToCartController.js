const addToCartService = require("../../services/cartService/addToCartService");

class AddToCart {
  async addToCart(req, res) {
    try {
    
      const {
        given_product_id,
        given_quantity,
        given_gift_status,
      } = req.body;

      const given_user_id= req.user.userID;
      console.log("Debug - Request body:", req.user);
      if (!given_user_id || !given_product_id || !given_quantity || !given_gift_status) {
        return res.status(400).json({
          success: false,
          message: "Required fields are missing (user_id, product_id, quantity, gift_status).",
        });
      }

     
      const result = await addToCartService.addToCart(req.body,given_user_id);

      
      // Use a dynamic status code based on whether an item was created or updated.
      const statusCode = result.status === "created" ? 201 : 200;

      return res.status(statusCode).json({
        success: true,
        message: result.message,
        data: result.data,
      });

    } catch (error) {
      // Handle Errors Thrown by the Service 
      console.error("Error in addToCart controller:", error.message);

      // Send a 400 for predictable errors (like invalid promocode) and 500 for unexpected errors.
      const statusCode = error.name === 'SequelizeDatabaseError' ? 500 : 400;

      return res.status(statusCode).json({
        success: false,
        message: error.message || "An internal server error occurred.",
      });
    }
  }
}

module.exports = new AddToCart();