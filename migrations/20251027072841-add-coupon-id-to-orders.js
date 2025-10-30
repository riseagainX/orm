'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'coupon_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: 'user_id'
    });

    // Add index for coupon_id
    await queryInterface.addIndex('orders', ['coupon_id'], {
      name: 'idx_coupon_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('orders', 'idx_coupon_id');
    await queryInterface.removeColumn('orders', 'coupon_id');
  }
};
