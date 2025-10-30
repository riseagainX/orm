const { Sequelize, Op, literal } = require("sequelize");
const {
  CartItem,
  Product,
  Brand,
  Promotion,
  Promocode,
  PromotionXProduct,
} = require("../../models");
// Log: import centralized logger
const logger = require('../../utils/logger.util');

class AddToCartService {
  
  async addToCart(cartData,given_user_id) {
    // Log: function start
    logger.info('addToCartService.addToCart started', { given_user_id, product_id: cartData?.given_product_id });
    // OPTIMIZATION: Destructure all needed properties from the input object. (previously we are destucting in controller file then passing here )
    const {
      given_product_id,
      given_quantity,
      given_promocode,
      given_delivery_name,
      given_delivery_email,
      given_delivery_phone,
      given_cart_mode,
      given_gift_status,
      given_gift_text,
      given_gift_img_url,
      given_sender_name,
    } = cartData;

    try {
       // step 1 -->  Validate Product Availability
      const productCount = await Product.count({
        where: {
          id: given_product_id,
          expiry_date: { [Op.gte]: literal("CURDATE()") },
          available_qty: { [Op.gte]: given_quantity },
        },
        include: [{
            model: Brand,
            attributes: [],
            where: { status: "A", is_show: "Y" },
            required: true,
          },
        ],
      });

      if (productCount === 0) {
        throw new Error("Product not found, is expired, or has insufficient stock.");
      }
      // step 2 -->  Validate Promocode Availability
      let promocodeIdToUse = null;

      if (given_promocode) {
         // we  can Start with PromotionXProduct model (because Product availability is already have checked ) , but however we getting error in identify the promotion id.
        // This is proven to work with your model associations without needing an 'on' clause.
        const productWithPromo = await Product.findOne({
          where: { id: given_product_id, status: "A" },
          attributes: ["id"],
          include: [{
              model: PromotionXProduct,
              required: true,
              attributes: ["id"],
              where: { status: "A" },
              include: [{
                  model: Promotion,
                  required: true,
                  attributes: ["id"],
                  where: { status: "A" },
                  include: [{
                      model: Promocode,
                      required: true,
                      attributes: ["id"],
                      where: {
                        promocode: given_promocode,
                        status: "VALID",
                        start_date: { [Op.lte]: literal("CURDATE()") },
                        expiry_date: { [Op.gte]: literal("CURDATE()") },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        });


        // not using .get(plain:true ) here  
        //         // Use optional chaining for safe navigation to prevent crashes if no promo is found.
        const foundPromoId = productWithPromo?.PromotionXProducts?.[0]?.Promotion?.Promocodes?.[0]?.id;

        if (!foundPromoId) {
          throw new Error("The provided promocode is invalid or not applicable to this product.");
        }
        promocodeIdToUse = foundPromoId;
      }

      // Step 3: Check for an Existing Cart Item ( if found then update quantity )
      const existingCartItem = await CartItem.findOne({
        where: { user_id: given_user_id, product_id: given_product_id },
      });

      // Step 4: update the quantity if an existing cart item is found.
      if (existingCartItem) {
        // 
        await CartItem.update({ quantity: literal(`quantity + ${given_quantity}`) }, { where: { id: existingCartItem.id } }
        );
        
        // Log: success update
        logger.success('addToCartService.addToCart updated existing cart item', { cart_item_id: existingCartItem.id });
        return {
          status: "updated",
          message: `Product quantity updated successfully for cart item ID ${existingCartItem.id}.`,
          data: { cart_item_id: existingCartItem.id },
        };

      } else {
        // crate the new cart item if not found above
        const newCartItem = await CartItem.create({
          product_id: given_product_id,
          user_id: given_user_id,
          quantity: given_quantity,
          promocode_id: promocodeIdToUse,
          delivery_name:given_delivery_name,
          delivery_phone : given_delivery_phone,
          delivery_email : given_delivery_email,
          delivery_sender_name: given_sender_name,
          gift: given_gift_status,
          gift_text :given_gift_text,
          gift_img_url : given_gift_img_url,
          buynow: given_cart_mode
        });

        // Log: success create
        logger.success('addToCartService.addToCart created new cart item', { cart_item_id: newCartItem.id });
        return {
          status: "created",
          message: "Product added to cart successfully.",
          data: { cart_item_id: newCartItem.id },
        };
      }
    } catch (error) {
      // Log: error
      logger.error('addToCartService.addToCart failed', error);
      console.error("Error in addToCartService:", error.message);
      // Re-throw the error so the controller can catch it and send a proper HTTP response.
      throw error;
    }
  }
}

module.exports = new AddToCartService();