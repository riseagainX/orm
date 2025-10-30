
const {
    Brand,
    Category,
    Product,
    PromotionXProduct,
    Promotion,
    Promocode,
    BrandCategory
} = require('../models');
const { Op, literal, fn, col, where } = require('sequelize');
// Log: import centralized logger
const logger = require('../utils/logger.util');

class BrandsByCategoryService {


//     {
//   "categorySlug": "health-wellness",
//   "page": 1,
//   "limit": 10,
//   "user_id": 123,
//   "discount_filter": null,
//   "from_price_range": null,
//   "to_price_range": null,
//   "brand_filter": null,
//   "new_arrival": null,
//   "display_type": "WEBSITE"
// }
 
    async getBrandsByCategory(params) {
        try {
            // Log: service start with key params
            logger.info('BrandsByCategoryService.getBrandsByCategory started', {
                categorySlug: params?.categorySlug,
                page: params?.page,
                limit: params?.limit,
                displayType: params?.displayType
            });
            const {
                categorySlug,
                page = 1,
                limit = 10,
                userId,
                discountFilter,
                fromPriceRange,
                toPriceRange,
                brandFilter,
                newArrival,
                displayType = 'ALL'
            } = params;

            console.log('Debug - Service parameters: ❌❌❌', params);
            // if (!categorySlug) {
            //     throw new Error('Category slug is required');
            // }

            const offset = (page - 1) * limit;
            const pointsToInrRatio = 1; // Configurable ratio as in stored procedure

            // First find the category ID from the slug
            // const category = await Category.findOne({
            //     where: { slug: categorySlug }
            // });

            // if (!category) {
            //     throw new Error('Category not found');
            // }

            // Common where conditions for both queries
            const whereConditions = {
                status: 'A',
                is_show: 'Y',
                display_type: {
                    [Op.in]: ['ALL', displayType]
                },
                // '$BrandCategories.category_id$': category.id,  // Add category filter
                ...(newArrival !== undefined && { new_arrival: newArrival }),
                ...(brandFilter && {
                    slug: {
                        [Op.in]: brandFilter.split(',')
                    }
                })
                // The ... is the JavaScript Spread Syntax. When used inside an object literal {...}, it takes all the properties from another object and adds them to the object being created.
            };

            // Common include conditions for products
            const productInclude = {
                model: Product,
                as: 'Products',
                required: true,
                where: {
                    status: 'A',
                    available_qty: {
                        [Op.gt]: 0
                    },
                    expiry_date: {
                        [Op.gte]: literal('CURDATE()')
                    },
                    display_type: {
                        [Op.in]: ['ALL', displayType]
                    },
                    ...(fromPriceRange && { //  ... add fromPriceRange in where obbjet
                        price: {
                            [Op.gte]: fromPriceRange / pointsToInrRatio
                        }
                    }),
                    ...(toPriceRange && {
                        price: {
                            [Op.lte]: toPriceRange / pointsToInrRatio
                        }
                    })
                }
            };

            // Promotion include structure
            const promotionInclude = {
                model: PromotionXProduct,
                required: false,
                as: 'PromotionXProducts',
                where: {
                    status: 'A',
                    promotion_type: 'D'
                },
                include: [{
                    model: Promotion,
                    required: false,
                    where: {
                        status: 'A',
                        offer_type: {
                            [Op.in]: ['DIS', 'ABS', 'OFFER']
                        },
                        display_type: {
                            [Op.in]: ['ALL', displayType]
                        },
                        ...(discountFilter && {
                            value: {
                                [Op.gte]: discountFilter
                            },
                            offerType: 'DIS'
                        })
                    },
                    include: [{
                        model: Promocode,
                        required: false,
                        where: {
                            status: 'VALID',
                            start_date: {
                                [Op.lte]: literal('CURDATE()')
                            },
                            expiry_date: {
                                [Op.gte]: literal('CURDATE()')
                            },
                            [Op.or]: [
                                { usage_type: 'M' },
                                {
                                    usage_type: 'S',
                                    blasted: 'Y'
                                }
                            ]
                        }
                    }]
                }]
            };

            // Main query for fetching brands
            //A Promise.all is a helpful function (a method) in JavaScript that lets you manage multiple tasks (multiple Promises) running at the same time and wait for all of them to finish before your program moves on.
            const [brands, totalCount] = await Promise.all([
                Brand.findAll({
                    attributes: [
                        'id', 'name', 'description', 'redemption_type', 'slug',
                        'new_arrival', 'updated', 'order_number'
                    ],
                    where: whereConditions,
                    include: [
                        {
                            model: Category,
                            through: {
                                model: BrandCategory,
                                where: {
                                    status: 'A'
                                }
                            },
                            where: {
                                status: 'A',
                                display_type: {
                                    [Op.in]: ['ALL', displayType]
                                },
                                ...(categorySlug && { slug: categorySlug })
                            },
                            attributes: [
                                'id', 'name', 'category_banner_image',
                                'seo_title', 'seo_keyword', 'seo_description'
                            ]
                        },
                        productInclude,
                        promotionInclude
                    ],
                    order: [
                        ['order_number', 'ASC'],
                        ['name', 'ASC']
                    ],
                    offset,
                    limit,
                    distinct: true
                }),
                Brand.count({
                    where: whereConditions,
                    include: [
                        {
                            model: Category,
                            through: {
                                model: BrandCategory,
                                where: {
                                    status: 'A'
                                }
                            },
                            where: {
                                status: 'A',
                                display_type: {
                                    [Op.in]: ['ALL', displayType]
                                },
                                ...(categorySlug && { slug: categorySlug })
                            }
                        },
                        productInclude,
                        promotionInclude
                    ],
                    distinct: true
                })
            ]);

            // Transform the data to match the stored procedure output format
            const transformedBrands = brands.map(brand => {
                const brandData = brand.get({ plain: true });
                const category = brandData.Categories[0];
                const product = brandData.Products[0];
                const promotion = brandData.PromotionXProducts?.[0]?.Promotion;
                const promocode = promotion?.Promocodes?.[0];

                return {
                    id: brand.id,
                    product_id: product?.id,
                    name: brand.name,
                    description: brand.description,
                    redemption_type: brand.redemption_type,
                    slug: brand.slug,
                    new_arrival: brand.new_arrival,
                    updated: brand.updated,
                    offer_value: promotion?.value,
                    offer_type: promotion?.offer_type,
                    display_text: promotion?.display_text,
                    category_id: category?.id,
                    category_name: category?.name,
                    category_product: category?.name,
                    category_banner_image: category?.category_banner_image,
                    category_seo_title: category?.seo_title,
                    category_seo_keyword: category?.seo_keyword,
                    category_seo_description: category?.seo_description,
                    available_qty: product?.available_qty,
                    price: product?.price,
                    product_name: product?.name,
                    default_promocode: promocode?.promocode,
                    default_promocode_value: promotion?.value,
                    default_offer_type: promotion?.offer_type,
                    default_offer_display_text: promotion?.display_text,
                    default_product_qty: brandData.PromotionXProducts?.[0]?.product_qty,
                    default_offer_product_qty: brandData.PromotionXProducts?.[0]?.offer_product_qty,
                    default_offer_tnc: promotion?.tnc,
                    max_point_limit: product?.max_point_limit
                };
            });

            // Log: success with counts
            logger.success('BrandsByCategoryService.getBrandsByCategory success', { brands: transformedBrands.length, total: totalCount });
            return {
                brands: transformedBrands,
                pagination: {
                    total: totalCount,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalCount / limit)
                }
            };

        } catch (error) {
            // Log: error
            logger.error('BrandsByCategoryService.getBrandsByCategory failed', error);
            console.error('Error in getBrandsByCategory:', error);
            throw error;
        }
    }
}

module.exports = new BrandsByCategoryService();