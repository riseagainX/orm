

const db = require('../models');
const { Op } = require('sequelize');
// Log: import centralized logger
const logger = require('../utils/logger.util');

class BrandCategoryService {
  
    async getCategoriesWithBrands() {
        try {
            // Log: service start
            logger.info('BrandCategoryService.getCategoriesWithBrands started');
            const categories = await db.Category.findAll({
                attributes: ['name', 'slug', 'order_number'],
                where: {
                    status: 'A'
                },
                include: [{
                    model: db.Brand,
                    through: {
                        attributes: [],  // We don't need junction table attributes
                        model: db.BrandCategory,
                        where: {
                            status: 'A'
                        }
                    },
                    where: {
                        status: 'A',
                        is_show: 'Y'
                    },
                    attributes: ['name', 'slug', 'id'],
                    required: true
                }],
                order: [
                    ['order_number', 'ASC'],
                    ['name', 'ASC']
                ]
            });

            // Transform the data to match the original stored procedure output
            // Log: categories fetched
            logger.info('BrandCategoryService.getCategoriesWithBrands fetched categories', { count: categories.length });
            return categories.map(category => {
                const brands = category.Brands.sort((a, b) => a.name.localeCompare(b.name));
                return {
                    name: category.name,
                    slug: category.slug,
                    brands_name: brands.map(b => b.name).filter(Boolean).join(','),
                    brands_slug: brands.map(b => b.slug).filter(Boolean).join(','),
                    brand_master_id: brands.map(b => b.brand_master_id).filter(Boolean).join(',')
                };
            });
        } catch (error) {
            // Log: error
            logger.error('BrandCategoryService.getCategoriesWithBrands failed', error);
            console.error('Error in getCategoriesWithBrands:', error);
            throw error;
        }
    }
}

module.exports = new BrandCategoryService();
