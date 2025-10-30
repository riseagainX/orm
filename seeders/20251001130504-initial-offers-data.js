// File: /seeders/YYYYMMDDHHMMSS-initial-offers-data.js
'use strict';

/**
 * This seeder populates the 'offers' table with its initial dataset.
 */
module.exports = {
  /**
   * The 'up' function is executed when you run `db:seed`.
   * Note: The keys (e.g., 'image_url') MUST be snake_case, matching the database column names.
   */
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('offers', [
      {
        id: 1,
        title: 'Buy / Redeem INR 250. Get INR 100 FREE!',
        image_url: 'offer-1.jpg',
        image_url_200: null,
        sub_title: 'GET UPTO 40% EXTRA',
        description: 'Buy / Redeem Myntra Gift Voucher. Get an additional Promo Code Free!',
        brand_id: 3,
        denomination: 250,
        promocode: 'ARCH100FREE',
        status: 'I',
        order_number: 1,
        start_date: new Date('2019-07-14 00:00:00'),
        end_date: new Date('2019-07-24 00:00:00'),
        created: new Date('2019-07-15 00:00:00')
      }
      // Add more offer objects here if needed.
    ], {});
  },

  /**
   * The 'down' function is executed when you want to undo the seeder.
   */
  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('offers', null, {});
  }
};