const { Sequelize, Op, literal, fn } = require("sequelize");
const {
  CartItem,
  Product,
  Brand,
  Promotion,
  Promocode,
  PromotionXProduct,
} = require("../../models");

class GetCartItemsService {
  
  async getCartItems(given_user_id, given_cart_item_id = null) {
    try {
      // Step 1: Remove "Buy Now" items from the cart (temporary checkout)
      // This simulates the DELETE operation from the procedure
      await CartItem.destroy({
        where: {
          user_id: given_user_id,
          buynow: 1
        }
      });

      // Step 2: Get cart items that have valid products (filter funnel method)
      const cartItemsWithProducts = await CartItem.findAll({
        attributes: ['id'],
        where: {
          user_id: given_user_id,
          // If given_cart_item_id is provided, filter by it, otherwise get all
          ...(given_cart_item_id && { id: given_cart_item_id })
        },
        include: [
          {
            model: Product,
            where: {
              status: 'A',
              available_qty: { [Op.gt]: 0 }
            },
            required: true, // INNER JOIN
            attributes: []
          }
        ]
      });

      if (cartItemsWithProducts.length === 0) {
        return {
          message: given_cart_item_id 
            ? `Cart item ${given_cart_item_id} not found or has no valid products.`
            : `No cart items found for user ${given_user_id}.`,
          data: []
        };
      }

      const cartItemIds = cartItemsWithProducts.map(item => item.id);

      // Step 3: Get cart items that have valid brands
      const cartItemsWithBrands = await CartItem.findAll({
        attributes: ['id'],
        where: {
          id: cartItemIds
        },
        include: [
          {
            model: Product,
            where: {
              status: 'A',
              available_qty: { [Op.gt]: 0 }
            },
            required: true,
            attributes: [],
            include: [
              {
                model: Brand,
                where: {
                  status: 'A'
                },
                required: true, // INNER JOIN
                attributes: []
              }
            ]
          }
        ]
      });

      if (cartItemsWithBrands.length === 0) {
        return {
          message: `No cart items with valid brands found for user ${given_user_id}.`,
          data: []
        };
      }

      const validCartItemIds = cartItemsWithBrands.map(item => item.id);

      // Step 4: Get the final cart items with all required data
      const finalCartItems = await CartItem.findAll({
        where: {
          id: validCartItemIds
        },
        attributes: [
          'id',
          'quantity',
          'delivery_name',
          'delivery_email', 
          'delivery_phone',
          'delivery_date',
          'product_id',
          'promocode_id'
        ],
        include: [
          {
            model: Product,
            where: {
              status: 'A',
              available_qty: { [Op.gt]: 0 }
            },
            required: true,
            attributes: [
              'id',
              'name',
              'price',
              'available_qty'
            ],
            include: [
              {
                model: Brand,
                where: {
                  status: 'A'
                },
                required: true,
                attributes: [
                  'id',
                  'name',
                  'slug',
                  'payu',
                  'checkout_step'
                ]
              }
            ]
          }
        ],
        order: [['created', 'DESC']]
      });

      // Step 5: Get promotion data separately for cart items that have promocodes
      const cartItemsWithPromocodes = finalCartItems.filter(item => item.promocode_id);
      const promotionData = {};

      for (const cartItem of cartItemsWithPromocodes) {
        try {
          // Get promocode with promotion details
          const promocode = await Promocode.findOne({
            where: {
              id: cartItem.promocode_id,
              status: 'VALID',
              [Op.or]: [
                { usage_type: 'M' },
                { 
                  usage_type: 'S',
                  blasted: 'Y'
                }
              ]
            },
            include: [
              {
                model: Promotion,
                where: {
                  status: 'A'
                },
                required: true,
                attributes: [
                  'id',
                  'value',
                  'offer_type',
                  'display_text'
                ],
                include: [
                  {
                    model: PromotionXProduct,
                    where: {
                      status: 'A',
                      product_id: cartItem.product_id,
                      [Op.or]: [
                        { product_qty: { [Op.lte]: cartItem.quantity } },
                        { product_qty: null }
                      ]
                    },
                    required: true,
                    attributes: [
                      'id',
                      'product_qty',
                      'offer_product_qty',
                      'product_discount',
                      'offer_product_discount',
                      'offer_product_id'
                    ],
                    include: [
                      {
                        model: Product,
                        where: {
                          status: 'A',
                          available_qty: { [Op.gt]: 0 }
                        },
                        required: true,
                        attributes: [
                          'id',
                          'name',
                          'price'
                        ],
                        include: [
                          {
                            model: Brand,
                            where: {
                              status: 'A'
                            },
                            required: true,
                            attributes: [
                              'id',
                              'name',
                              'brand_icon_url',
                              'image_url'
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          });

          if (promocode) {
            promotionData[cartItem.id] = promocode;
          }
        } catch (error) {
          console.log(`Error fetching promotion data for cart item ${cartItem.id}:`, error.message);
          // Continue without promotion data for this item
        }
      }

      // Step 6: Transform the data to match the expected output format
      const transformedData = finalCartItems.map(cartItem => {
        const product = cartItem.Product;
        const brand = product.Brand;
        const promocode = promotionData[cartItem.id];
        
        // Base cart item data
        const result = {
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
          product_name: product.name
        };

        // Add promotion/offer data if promocode exists
        if (promocode && promocode.Promotion && promocode.Promotion.PromotionXProducts && promocode.Promotion.PromotionXProducts.length > 0) {
          const promotion = promocode.Promotion;
          const promotionXProduct = promotion.PromotionXProducts[0];
          const offerProduct = promotionXProduct.Product;
          const offerBrand = offerProduct.Brand;

          result.promocode_value = promotion.value;
          result.promocode_offer_type = promotion.offer_type;
          result.default_offer_display_text = promotion.display_text;
          result.product_qty = promotionXProduct.product_qty;
          result.offer_product_qty = promotionXProduct.offer_product_qty;
          result.product_discount = promotionXProduct.product_discount;
          result.offer_product_discount = promotionXProduct.offer_product_discount;
          result.offer_brand_icon_url = offerBrand.brand_icon_url;
          result.offer_brand_image_url = offerBrand.image_url;
          result.offer_brand_name = offerBrand.name;
          result.offer_product_price = offerProduct.price;
          result.offer_product_name = offerProduct.name;
        }

        return result;
      });

      return {
        message: given_cart_item_id 
          ? `Cart item ${given_cart_item_id} retrieved successfully.`
          : `Found ${transformedData.length} cart items for user ${given_user_id}.`,
        data: transformedData
      };

    } catch (error) {
      console.error("Error in getCartItemsService:", error.message);
      // Re-throw the error so the controller can catch it and send a proper HTTP response
      throw error;
    }
  }
}

module.exports = new GetCartItemsService();
