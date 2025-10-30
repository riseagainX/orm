const brandWithProductsService = require('../services/brandWithProducts.service');

class BrandWithProductsController {
    async getBrandWithProduct(req, res) {
        try {
            const { brand_slug } = req.params;

            if (!brand_slug) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand slug is required'
                });
            }

            const result = await brandWithProductsService.getBrandWithProducts(brand_slug);

            if (!result.brandDetails) {
                return res.status(404).json({
                    success: false,
                    message: 'Brand not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error("Error in brand with products controller:", error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports= new BrandWithProductsController();