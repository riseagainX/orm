
// if table 1 left join with table 2 inner join with table 3.. so this should be treated like this table 1 inner join with table 2 inner join with table 3 


const { where, Model, Op, Sequelize } = require('sequelize');
const {
  Brand,
  Category,
  Product,
  PromotionXProduct,
  Promotion,
  Promocode,
} = require('../models');
// Log: import centralized logger
const logger = require('../utils/logger.util');

class BrandWithProductsService {
    async getBrandWithProducts(brand_slug) {
        try {
            // Log: service start
            logger.info('BrandWithProductsService.getBrandWithProducts started', { brand_slug });
            // First query: Get brand details with category
            const brandData = await Brand.findOne({
                attributes: [
                    'id',
                    'slug',
                    'name',
                    'important_instructions',
                    'long_description',
                    'description',
                    'more_description_tilte',
                    'new_arrival',
                    'how_to_redeem_url',
                    'how_to_redeem',
                    'redemption_type',
                    'online_redeem_url',
                    'seo_title',
                    'seo_keyword',
                    'seo_description',
                    'default_category_id',
                    ['status', 'brandstatus'],
                    ['earn_point_ratio', 'inr_to_points_ratio'],
                    ['max_earn_point', 'max_earn_point'],
                    ['tnc', 'tnc'],
                    [Sequelize.literal(`CASE WHEN brand_type IN ('OTT','OTTVOUCHER') THEN 'OTT' ELSE 'VOUCHER' END`), 'brand_type'],
                    [Sequelize.literal("''"), 'online_video_url']
                ],
                where: {
                    status: 'A',
                    slug: brand_slug
                },
                include: [{
                    model: Category,
                    attributes: [
                        ['slug', 'catslug'],
                        ['name', 'defaultcategory']
                    ],
                    required: false
                }]
            });

            if (!brandData) {
                // Log: brand not found
                logger.warn('BrandWithProductsService.getBrandWithProducts brand not found', { brand_slug });
                throw new Error('Brand not found');
            }

            // Second query: Get products with promotions
            const productsData = await Product.findAll({
                attributes: [
                    'id',
                    'available_qty',
                    'price',
                    'name',
                    'max_point_limit'
                ],
                where: {
                    status: 'A',
                    is_show: 'Y',
                    expiry_date: { [Op.gte]: new Date() },
                    brand_id: brandData.id,
                    available_qty: { [Op.gt]: 0 }
                },
                include: [{
                    model: PromotionXProduct,
                    where: {
                        status: 'A',
                        promotion_type: 'D'
                    },
                    required: false, // LEFT JOIN with PromotionXProduct
                    attributes: [
                        ['product_qty', 'default_product_qty'],
                        ['offer_product_qty', 'default_offer_product_qty']
                    ],
                    include: [{
                        model: Promotion,
                        where: {
                            status: 'A',
                            display_type: {
                                [Op.in]: ['ALL', 'WEBSITE']
                            }
                        },
                        required: true, // INNER JOIN with Promotion
                        attributes: [
                            ['value', 'default_promocode_value'],
                            ['offer_type', 'default_offer_type'],
                            ['display_text', 'default_offer_display_text'],
                            ['tnc', 'default_offer_tnc']
                        ],
                        include: [{
                            model: Promocode,
                            where: {
                                status: 'VALID',
                                start_date: { [Op.lte]: new Date() },
                                expiry_date: { [Op.gte]: new Date() },
                                [Op.or]: [
                                    { usage_type: 'M' },
                                    {
                                        usage_type: 'S',
                                        blasted: 'Y'
                                    }
                                ]
                            },
                            required: true, // INNER JOIN with Promocode
                            attributes: [
                                ['promocode', 'default_promocode']
                            ]
                        }]
                    }]
                }],
                order: [['price', 'DESC']]
            });  

            // console.log("productData ->>❌✅❌" , productsData[0]);
            // console.log("productdata after use of .get(plan)✅ " , productsData[0].get({plain:true}));
            
            // return {
            //     brandDetails: brandData.get({plain: true}),
            //     products:productsData[0]
            // }

            // Transform the nested product data to flat structure
            const flattenedProducts = productsData.map(product => {
                const plainProduct = product.get({ plain: true });
                const promotionXProduct = plainProduct.PromotionXProducts?.[0] || {}; //The [0] is used to access the first element of that array. In this business logic, we are assuming that a product will have only one default promotion (promotion_type: 'D'), so we are only interested in the first (and only) result.
                const promotion = promotionXProduct.Promotion || {};
                const promocode = promotion.Promocodes?.[0] || {};

                return {
                    id: plainProduct.id,
                    available_qty: plainProduct.available_qty,
                    price: plainProduct.price,
                    name: plainProduct.name,
                    max_point_limit: plainProduct.max_point_limit,
                    default_promocode: promocode.default_promocode || null,
                    default_promocode_value: promotion.default_promocode_value || null,
                    default_offer_type: promotion.default_offer_type || null,
                    default_offer_display_text: promotion.default_offer_display_text || null,
                    default_product_qty: promotionXProduct.default_product_qty || null,
                    default_offer_product_qty: promotionXProduct.default_offer_product_qty || null,
                    default_offer_tnc: promotion.default_offer_tnc || null
                };
            });

            // Log: success with counts
            logger.success('BrandWithProductsService.getBrandWithProducts success', { brand_id: brandData.id, products: flattenedProducts.length });
            return {
                brandDetails: brandData.get({ plain: true }), // .get ( works only on findOne result (not on findAll result))
                products: flattenedProducts
            };

        } catch (error) {
            // Log: error
            logger.error("BrandWithProductsService.getBrandWithProducts failed", error);
            console.error("Error in brand with products service:", error);
            throw error;
        }
    }
}

module.exports= new BrandWithProductsService();