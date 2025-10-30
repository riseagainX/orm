

const brandCategoryService = require('../services/brandCategory.service');

class BrandCategoryController {
    
    async getCategoriesWithBrands(req, res) {
        try {
            const result = await brandCategoryService.getCategoriesWithBrands();
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in getCategoriesWithBrands controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = new BrandCategoryController();