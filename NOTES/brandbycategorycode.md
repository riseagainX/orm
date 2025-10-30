/**
 * @file brandsByCategory.service.js
 * This service replicates the logic of the `brands_by_category` stored procedure.
 * Implements complex brand filtering and pagination using Sequelize ORM.
 * @author GitHub Copilot
 * @date October 5, 2025
 */

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

class BrandsByCategoryService {
    /**
     * Get brands by category with complex filtering
     * @param {Object} params - Query parameters
     * @param {string} params.categorySlug - Category slug to filter by
     * @param {number} params.page - Page number for pagination
     * @param {number} params.limit - Number of items per page
     * @param {number} params.userId - User ID
     * @param {number} params.discountFilter - Minimum discount value
     * @param {number} params.fromPriceRange - Minimum price range
     * @param {number} params.toPriceRange - Maximum price range
     * @param {string} params.brandFilter - Comma-separated list of brand slugs
     * @param {number} params.newArrival - Filter by new arrival
     * @param {string} params.displayType - Display type filter
     * @returns {Promise<Object>} Brands data with pagination info
     */
    async getBrandsByCategory(params) {
        try {
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
            if (!categorySlug) {
                throw new Error('Category slug is required');
            }

            const offset = (page - 1) * limit;
            const pointsToInrRatio = 1; // Configurable ratio as in stored procedure

            // First find the category ID from the slug
            const category = await Category.findOne({
                where: { slug: categorySlug }
            });

            if (!category) {
                throw new Error('Category not found');
            }

            // Common where conditions for both queries
            const whereConditions = {
                status: 'A',
                is_show: 'Y',
                display_type: {
                    [Op.in]: ['ALL', displayType]
                },
                '$BrandCategories.category_id$': category.id,  // Add category filter
                ...(newArrival !== undefined && { new_arrival: newArrival }),
                ...(brandFilter && {
                    slug: {
                        [Op.in]: brandFilter.split(',')
                    }
                })
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
                    ...(fromPriceRange && {
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
                        offerType: {
                            [Op.in]: ['DIS', 'ABS', 'OFFER']
                        },
                        displayType: {
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
                            startDate: {
                                [Op.lte]: literal('CURDATE()')
                            },
                            expiryDate: {
                                [Op.gte]: literal('CURDATE()')
                            },
                            [Op.or]: [
                                { usageType: 'M' },
                                {
                                    usageType: 'S',
                                    blasted: 'Y'
                                }
                            ]
                        }
                    }]
                }]
            };

            // Main query for fetching brands
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
            console.error('Error in getBrandsByCategory:', error);
            throw error;
        }
    }
}

module.exports = new BrandsByCategoryService();































/**
 * @file brandsByCategory.controller.js
 * Controller for handling brand queries by category with filtering
 * @author GitHub Copilot
 * @date October 5, 2025
 */

const brandsByCategoryService = require('../services/brandsByCategory.service');

class BrandsByCategoryController {
    /**
     * Get brands by category with filtering
     * @param {Object} req - Express request object
     * @param {Object} req.query - Query parameters
     * @param {string} req.query.categorySlug - Category slug to filter by
     * @param {number} req.query.page - Page number for pagination
     * @param {number} req.query.limit - Number of items per page
     * @param {number} req.query.userId - User ID
     * @param {number} req.query.discountFilter - Minimum discount value
     * @param {number} req.query.fromPriceRange - Minimum price range
     * @param {number} req.query.toPriceRange - Maximum price range
     * @param {string} req.query.brandFilter - Comma-separated list of brand slugs
     * @param {number} req.query.newArrival - Filter by new arrival
     * @param {string} req.query.displayType - Display type filter
     * @param {Object} res - Express response object
     */
    async getBrandsByCategory(req, res) {
        try {
            console.log('Debug - Query parameters:', req.query);
            const params = {
                categorySlug: req.query.categorySlug || req.query.category_slug,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                userId: req.query.user_id ? parseInt(req.query.user_id) : undefined,
                discountFilter: req.query.discount_filter ? parseInt(req.query.discount_filter) : undefined,
                fromPriceRange: req.query.from_price_range ? parseInt(req.query.from_price_range) : undefined,
                toPriceRange: req.query.to_price_range ? parseInt(req.query.to_price_range) : undefined,
                brandFilter: req.query.brand_filter,
                newArrival: req.query.new_arrival ? parseInt(req.query.new_arrival) : undefined,
                displayType: req.query.display_type || 'ALL'
            };

            const result = await brandsByCategoryService.getBrandsByCategory(params);

            res.status(200).json({
                success: true,
                data: result.brands,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Controller Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brands by category',
                error: error.message
            });
        }
    }

    /**
     * Validate query parameters
     * @param {Object} query - Express request query object
     * @returns {Object} Validation result
     */
    validateQueryParams(query) {
        const errors = [];

        // Validate numeric parameters
        ['page', 'limit', 'userId', 'discountFilter', 'fromPriceRange', 'toPriceRange', 'newArrival'].forEach(param => {
            if (query[param] && isNaN(parseInt(query[param]))) {
                errors.push(`${param} must be a number`);
            }
        });

        // Validate ranges
        if (query.fromPriceRange && query.toPriceRange && 
            parseInt(query.fromPriceRange) > parseInt(query.toPriceRange)) {
            errors.push('fromPriceRange cannot be greater than toPriceRange');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = new BrandsByCategoryController();





























/**
 * Brand Category Routes
 * Defines the routes for brand category related endpoints
 * @author GitHub Copilot
 * @date October 5, 2025
 */

const express = require('express');
const router = express.Router();
const brandCategoryController = require('../controllers/brandCategoryController');

// GET /api/brand-categories
// Retrieves all categories with their associated brands
router.get('/', brandCategoryController.getCategoriesWithBrands);

module.exports = router;