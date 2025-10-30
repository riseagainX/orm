'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.INTEGER(10),
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      display_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Website'
      },
      guid: {
        type: Sequelize.STRING(200),
        allowNull: true,
        unique: true
      },
  user_id: {
        type: Sequelize.BIGINT, // <--- THIS IS THE FIX
        allowNull: false,
        references: {
          model: 'users', // The name of the table
          key: 'id'       // The column in that table
        }
      },
      total_points: {
        type: Sequelize.INTEGER(10),
        allowNull: false
      },
      total_amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      offer_points: {
        type: Sequelize.INTEGER(10),
        allowNull: false
      },
      offer_cash: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      payback_points_spent: {
        type: Sequelize.INTEGER(10),
        allowNull: false,
        defaultValue: 0
      },
      cash_spent: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false
      },
      payback_points_earned: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false
      },
      extra_payback_points_earned: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false
      },
      additional_points_earned: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      remark: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      total_cashback: {
        type: Sequelize.INTEGER(10),
        allowNull: true
      },
      points_to_inr_ratio: {
        type: Sequelize.INTEGER(10),
        allowNull: false
      },
      inr_to_points_ratio: {
        type: Sequelize.DECIMAL(11, 4),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('I', 'P', 'V', 'F', 'C', 'E', 'RI', 'RP', 'RF', 'R', 'RM'),
        allowNull: false,
        comment: 'I=>Initiate,P=>Processing,V=>Verifing,F=>Fail,C=>Complete,E=>Expired,RI=>Refund Initiate,RP=>Refund Processing,RF=>Refund Fail,RC=>Refund Complete,RM=>Refund Manual'
      },
      created: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      voucher_send_datetime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      ref_id: {
        type: Sequelize.INTEGER(10),
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      whats_app: {
        type: Sequelize.ENUM('Y', 'N'),
        allowNull: true,
        defaultValue: 'N'
      },
      is_play: {
        type: Sequelize.ENUM('Y', 'N'),
        allowNull: true,
        defaultValue: 'N'
      },
      refund_type: {
        type: Sequelize.ENUM('P', 'F'),
        allowNull: true
      }
    });

    // Primary key and guid unique constraint are already defined in the table creation
    // No need to add separate indexes for them
    await queryInterface.addIndex('orders', ['status', 'updated'], {
      name: 'status',
      using: 'BTREE'
    });
    await queryInterface.addIndex('orders', ['user_id'], {
      name: 'idx_user',
      using: 'BTREE'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
  }
};
