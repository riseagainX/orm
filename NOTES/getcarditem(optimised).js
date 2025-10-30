// Import necessary Sequelize operators and database models.
const { Op } = require("sequelize");
const {
  CartItem,
  Product,
  Brand,
  Promotion,
  Promocode,
  PromotionXProduct,
} = require("../../models");

// Small helpers to keep logic readable for beginners
function findApplicablePromotion(promocode, cartItem) {
  if (!promocode || !promocode.Promotion) return null;
  const promotion = promocode.Promotion;
  const rule = promotion.PromotionXProducts.find(
    (pxp) =>
      pxp.product_id === cartItem.product_id &&
      (pxp.product_qty === null || pxp.product_qty <= cartItem.quantity)
  );
  if (!rule) return null;

  return {
    promotion,
    rule,
    offerProduct: rule.Product,
    offerBrand: rule.Product?.Brand,
  };
}

function buildCartItemResponse(cartItem, promo) {
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

  if (promo) {
    dto.promocode_value = promo.promotion.value;
    dto.promocode_offer_type = promo.promotion.offer_type;
    dto.default_offer_display_text = promo.promotion.display_text;
    dto.product_qty = promo.rule.product_qty;
    dto.offer_product_qty = promo.rule.offer_product_qty;
    dto.product_discount = promo.rule.product_discount;
    dto.offer_product_discount = promo.rule.offer_product_discount;
    if (promo.offerBrand) {
      dto.offer_brand_icon_url = promo.offerBrand.brand_icon_url;
      dto.offer_brand_image_url = promo.offerBrand.image_url;
      dto.offer_brand_name = promo.offerBrand.name;
    }
    if (promo.offerProduct) {
      dto.offer_product_price = promo.offerProduct.price;
      dto.offer_product_name = promo.offerProduct.name;
    }
  }

  return dto;
}

/**
 * A service class to handle fetching and validating user cart items.
 */
class GetCartItemsService {
  /**
   * Fetches, validates, and enriches a user's cart items using an efficient two-query approach.
   */
  async getCartItems(given_user_id, given_cart_item_id = null) {
    try {
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

      // Step 3: Fetch promotion data in batch (Query 2)
      // Gather all unique promocode IDs from the cart items and fetch them in one go.
      const promocodeIds = [];
      for (const item of cartItems) {
        if (item.promocode_id != null && !promocodeIds.includes(item.promocode_id)) {
          promocodeIds.push(item.promocode_id);
        }
      }

      const promotionMap = new Map();
      if (promocodeIds.length > 0) {
        const promotions = await Promocode.findAll({
          where: {
            id: { [Op.in]: promocodeIds },
            status: 'VALID',
            [Op.or]: [{ usage_type: 'M' }, { usage_type: 'S', blasted: 'Y' }],
          },
          include: [{
            model: Promotion,
            required: true,
            where: { status: 'A' },
            include: [{
              model: PromotionXProduct,
              required: true,
              where: { status: 'A' },
              include: [{
                model: Product,
                required: true,
                include: [{ model: Brand, required: true }],
              }],
            }],
          }],
        });

        // Store promotions in a Map for quick lookup.
        promotions.forEach((p) => promotionMap.set(p.id, p));
      }

      // Step 4: Merge and transform data
      // Enrich the cart items with the associated promotion data.
      const transformedData = cartItems.map((cartItem) => {
        const promocode = promotionMap.get(cartItem.promocode_id);
        const promo = findApplicablePromotion(promocode, cartItem);
        return buildCartItemResponse(cartItem, promo);
      });

      return {
        status: 'success',
        message: `Found ${transformedData.length} valid cart item(s).`,
        data: transformedData,
      };

    } catch (error) {
      console.error("Error in getCartItemsService:", error.message);
      // Re-throw the error so the controller can catch it and send a proper HTTP response.
      throw error;
    }
  }
}

module.exports = new GetCartItemsService();