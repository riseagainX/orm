// File: /seeders/YYYYMMDDHHMMSS-initial-promocodes-data.js
'use strict';

/**
 * This seeder populates the 'promocodes' table with its initial dataset.
 * The 'up' function inserts the data, and the 'down' function removes it,
 * allowing for a clean and repeatable database setup.
 */
module.exports = {
  /**
   * The 'up' function is executed when you run `db:seed`.
   * Note: The keys (e.g., 'promotion_id') MUST be snake_case, matching the database column names.
   */
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('promocodes', [
      {
        id: 1,
        promotion_id: 1,
        promocode: 'MYN23',
        start_date: '2023-05-09',
        expiry_date: '2023-12-31',
        usage_type: 'M',
        status: 'VALID',
        blasted: 'N',
        blasted_date: null,
        created_on: '2023-05-09 08:15:23',
        created_by: 8,
        updated_on: null,
        updated_by: null,
        total_max_usage: null,
        user_max_usage: null
      },
      {
        id: 2,
        promotion_id: 2,
        promocode: 'VERO23',
        start_date: '2023-05-09',
        expiry_date: '2023-12-31',
        usage_type: 'M',
        status: 'VALID',
        blasted: 'N',
        blasted_date: null,
        created_on: '2023-05-09 08:33:18',
        created_by: 8,
        updated_on: null,
        updated_by: null,
        total_max_usage: null,
        user_max_usage: null
      },
      {
        id: 3,
        promotion_id: 3,
        promocode: 'BATA23',
        start_date: '2023-05-09',
        expiry_date: '2026-12-31',
        usage_type: 'M',
        status: 'VALID',
        blasted: 'N',
        blasted_date: null,
        created_on: '2023-05-09 08:40:26',
        created_by: 8,
        updated_on: null,
        updated_by: null,
        total_max_usage: null,
        user_max_usage: null
      },
      {
        id: 4,
        promotion_id: 4,
        promocode: 'TATA23',
        start_date: '2023-05-09',
        expiry_date: '2023-12-31',
        usage_type: 'M',
        status: 'VALID',
        blasted: 'N',
        blasted_date: null,
        created_on: '2023-05-09 10:34:31',
        created_by: 8,
        updated_on: null,
        updated_by: null,
        total_max_usage: null,
        user_max_usage: null
      },
      {
        id: 5,
        promotion_id: 5,
        promocode: 'ARROW23',
        start_date: '2023-05-10',
        expiry_date: '2023-12-31',
        usage_type: 'M',
        status: 'VALID',
        blasted: 'N',
        blasted_date: null,
        created_on: '2023-05-10 15:36:45',
        created_by: 8,
        updated_on: null,
        updated_by: null,
        total_max_usage: null,
        user_max_usage: null
      },
      {
        id: 6,
        promotion_id: 6,
        promocode: 'AURE23',
        start_date: '2023-05-10',
        expiry_date: '2023-12-31',
        usage_type: 'M',
        status: 'VALID',
        blasted: 'N',
        blasted_date: null,
        created_on: '2023-05-10 15:39:21',
        created_by: 8,
        updated_on: null,
        updated_by: null,
        total_max_usage: null,
        user_max_usage: null
      },
      {
        id: 7,
        promotion_id: 7,
        promocode: 'BEAUTY23',
        start_date: '2023-05-10',
        expiry_date: '2023-12-31',
        usage_type: 'M',
        status: 'VALID',
        blasted: 'N',
        blasted_date: null,
        created_on: '2023-05-10 15:42:16',
        created_by: 8,
        updated_on: null,
        updated_by: null,
        total_max_usage: null,
        user_max_usage: null
      },
      {
        id: 8,
        promotion_id: 8,
        promocode: 'BENETT23',
        start_date: '2023-05-10',
        expiry_date: '2023-12-31',
        usage_type: 'M',
        status: 'VALID',
        blasted: 'N',
        blasted_date: null,
        created_on: '2023-05-10 15:45:18',
        created_by: 8,
        updated_on: null,
        updated_by: null,
        total_max_usage: null,
        user_max_usage: null
      },
      {
        id: 9,
        promotion_id: 9,
        promocode: 'BEYOUNG23',
        start_date: '2023-05-10',
        expiry_date: '2023-12-31',
        usage_type: 'M',
        status: 'VALID',
        blasted: 'N',
        blasted_date: null,
        created_on: '2023-05-10 15:47:37',
        created_by: 8,
        updated_on: null,
        updated_by: null,
        total_max_usage: null,
        user_max_usage: null
      },
      {
        id: 10,
        promotion_id: 10,
        promocode: 'BIBA23',
        start_date: '2023-05-10',
        expiry_date: '2023-12-31',
        usage_type: 'M',
        status: 'VALID',
        blasted: 'N',
        blasted_date: null,
        created_on: '2023-05-10 15:49:55',
        created_by: 8,
        updated_on: null,
        updated_by: null,
        total_max_usage: null,
        user_max_usage: null
      },
      {
        id: 11,
        promotion_id: 11,
        promocode: 'NYKAA23',
        start_date: '2023-05-10',
        expiry_date: '2023-12-31',
        usage_type: 'M',
        status: 'VALID',
        blasted: 'N',
        blasted_date: null,
        created_on: '2023-05-10 15:51:30',
        created_by: 8,
        updated_on: null,
        updated_by: null,
        total_max_usage: null,
        user_max_usage: null
      },
      {
        id: 12,
        promotion_id: 12,
        promocode: 'TRENDS23',
        start_date: '2023-05-10',
        expiry_date: '2023-12-31',
        usage_type: 'M',
        status: 'VALID',
        blasted: 'N',
        blasted_date: null,
        created_on: '2023-05-10 15:55:01',
        created_by: 8,
        updated_on: null,
        updated_by: null,
        total_max_usage: null,
        user_max_usage: null
      },
      {
        id: 13,
        promotion_id: 13,
        promocode: 'TAJ23',
        start_date: '2023-05-10',
        expiry_date: '2023-12-31',
        usage_type: 'M',
        status: 'VALID',
        blasted: 'N',
        blasted_date: null,
        created_on: '2023-05-10 15:57:27',
        created_by: 8,
        updated_on: null,
        updated_by: null,
        total_max_usage: null,
        user_max_usage: null
      }
    ], {});
  },

  /**
   * The 'down' function is executed when you want to undo the seeder.
   */
  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('promocodes', null, {});
  }
};