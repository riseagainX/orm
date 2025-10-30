// File: /seeders/YYYYMMDDHHMMSS-initial-categories-data.js
'use strict';

/**
 * This seeder populates the 'categories' table with its initial dataset.
 */
module.exports = {
  /**
   * The 'up' function is executed when you run `db:seed`.
   * Note: The keys (e.g., 'display_type') MUST be snake_case, matching the database column names.
   */
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('categories', [
      {
        id: 464,
        display_type: 'WEBSITE',
        cat_id: '',
        name: 'Luxury Gifting',
        description: '<p>No need to go out to find that perfect gift for your friend or family member. We bring to you Gift Vouchers from your favourite brands in one place. Choose a voucher for a leading fashion brand, a popular restaurant, or a renowned health centre&mdash;the choices are plenty. Let them choose the gift they love!!</p>\r\n',
        more_description: null,
        order_number: 10,
        icon_url: 'images/categories/online.png',
        category_banner_image: '{"1":{"desk_image":"https:\\/\\/cdn.gvhelpdesk.net\\/dbsinstavouchers\\/categories\\/banner\\/2696_Screenshot%20%282%29.png","mob_image":"https:\\/\\/cdn.gvhelpdesk.net\\/hsbc\\/categories\\/banner\\/79870_Gifting_M.jpg"}}',
        image_url: 'categories/banner/79870_Gifting_M.jpg',
        mobile_image_url: 'images/categories/3086_Gifting.jpg',
        slug: 'gifting',
        status: 'A',
        trending_category: 'N',
        trending_category_image: null,
        trending_description: null,
        seo_title: '',
        seo_keyword: '',
        seo_description: '',
        created: new Date('2021-10-07 08:01:28'),
        updated: new Date('2023-02-27 09:55:33'),
        new_arrival: 1
      }
      // Add the other ~8 data objects here, separated by commas.
    ], {});
  },

  /**
   * The 'down' function is executed when you want to undo the seeder.
   */
  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};