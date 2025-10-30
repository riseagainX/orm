

const brandsByCategoryService = require('../services/brandsByCategory.service');

class BrandsByCategoryController {
    
    async getBrandsByCategory(req, res) {
        try {
            console.log('Debug - Query parameters:', req.query);
            const params = {
                categorySlug: req.body.categorySlug,
                page: parseInt(req.query.page) || req.body.page ||  1,
                limit: parseInt(req.query.limit) || req.body.limit|| 10,
                userId: req.query.user_id ? parseInt(req.query.user_id) : undefined,
                discountFilter: req.query.discount_filter ? parseInt(req.query.discount_filter) : undefined,
                fromPriceRange: req.query.from_price_range ? parseInt(req.query.from_price_range) : undefined,
                toPriceRange: req.query.to_price_range ? parseInt(req.query.to_price_range) : undefined,
                brandFilter: req.query.brand_filter,
                newArrival: req.query.new_arrival ? parseInt(req.query.new_arrival) : undefined,
                displayType: req.query.display_type || req.body.display_type || 'ALL'
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