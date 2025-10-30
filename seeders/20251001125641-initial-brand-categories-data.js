// File: /seeders/YYYYMMDDHHMMSS-initial-brand-categories-data.js
'use strict';

/**
 * This seeder populates the 'brand_categories' junction table with its initial dataset.
 * This data defines the specific links between brands and their categories.
 */
module.exports = {
  /**
   * The 'up' function is executed when you run `db:seed`.
   * Note: The keys (e.g., 'brand_id') MUST be snake_case, matching the database column names.
   */
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('brand_categories', [
      {
        id: 1,
        brand_id: 3,
        category_id: 465,
        status: 'A',
        created: new Date('2021-10-07 08:04:55'),
        updated: new Date('2023-02-27 04:26:47')
      }
      // Add the other ~714 data objects here, separated by commas.
    ], {});
  },

  /**
   * The 'down' function is executed when you want to undo the seeder.
   */
  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('brand_categories', null, {});
  }
};