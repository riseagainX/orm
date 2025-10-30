'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('coupon_code', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(250),
        allowNull: true
      },
      mobile: {
        type: Sequelize.STRING(250),
        allowNull: true
      },
      batch_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      coupon_code: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true
      },
      valid_from: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      valid_till: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      min_order_value: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      max_order_value: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      total_user_usage: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1
      },
      user_max_usage: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      is_used: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: '0=unused,1=used'
      },
      status: {
        type: Sequelize.ENUM('A', 'I'),
        allowNull: false,
        defaultValue: 'I'
      },
      created: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('coupon_code', ['coupon_code'], {
      name: 'idx_users',
      using: 'BTREE'
    });

    await queryInterface.addIndex('coupon_code', ['batch_id'], {
      name: 'batch_id',
      using: 'BTREE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('coupon_code');
  }
};
