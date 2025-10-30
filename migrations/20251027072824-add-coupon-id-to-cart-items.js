'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('cart_items', 'coupon_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: 'user_id'
    });

    // Add index for coupon_id
    await queryInterface.addIndex('cart_items', ['coupon_id'], {
      name: 'idx_coupon_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('cart_items', 'idx_coupon_id');
    await queryInterface.removeColumn('cart_items', 'coupon_id');
  }
};
