'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'COUPON' to the via ENUM in transactions table
    await queryInterface.sequelize.query(
      `ALTER TABLE transactions MODIFY COLUMN via ENUM('ORDER', 'ADMIN', 'PROMOTION', 'CASHBACK', 'REFUND', 'EARNREFUND', 'COUPON') NOT NULL`
    );
  },

  async down(queryInterface, Sequelize) {
    // Remove 'COUPON' from the via ENUM in transactions table
    await queryInterface.sequelize.query(
      `ALTER TABLE transactions MODIFY COLUMN via ENUM('ORDER', 'ADMIN', 'PROMOTION', 'CASHBACK', 'REFUND', 'EARNREFUND') NOT NULL`
    );
  }
};
