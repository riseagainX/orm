'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'COUPON' to the source ENUM in transactions table
    await queryInterface.sequelize.query(
      `ALTER TABLE transactions MODIFY COLUMN source ENUM('PAYU', 'CERA', 'RBL', 'PAYTMUPI', 'BCH', 'SEAMLESSPG', 'MAT', 'COUPON') NOT NULL`
    );
  },

  async down(queryInterface, Sequelize) {
    // Remove 'COUPON' from the source ENUM in transactions table
    await queryInterface.sequelize.query(
      `ALTER TABLE transactions MODIFY COLUMN source ENUM('PAYU', 'CERA', 'RBL', 'PAYTMUPI', 'BCH', 'SEAMLESSPG', 'MAT') NOT NULL`
    );
  }
};
