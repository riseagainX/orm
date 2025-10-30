'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.BIGINT(19),
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      guid: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
      },
      user_id: {
        type: Sequelize.INTEGER(10),
        allowNull: false
      },
      order_id: {
        type: Sequelize.INTEGER(10),
        allowNull: true
      },
      order_details_id: {
        type: Sequelize.BIGINT(19),
        allowNull: true
      },
      source: {
        type: Sequelize.ENUM('PAYU', 'CERA', 'RBL', 'PAYTMUPI', 'BCH', 'SEAMLESSPG', 'MAT'),
        allowNull: false
      },
      txn_type: {
        type: Sequelize.ENUM('DB', 'CR'),
        allowNull: false,
        comment: "'DB'=>Debit,'CR'=>Credit"
      },
      amount: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false
      },
      reff_id: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      mihpayid: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      request_id: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      via: {
        type: Sequelize.ENUM('ORDER', 'ADMIN', 'PROMOTION', 'CASHBACK', 'REFUND', 'EARNREFUND'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('I', 'P', 'F', 'C', 'R', 'RI', 'RF'),
        allowNull: false,
        comment: "I=>Initiate,F=>Fail,C=>Complete"
      },
      created: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated: {
        type: Sequelize.DATE,
        allowNull: true
      },
      remark: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      reversal_guid: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      sync: {
        type: Sequelize.CHAR(1),
        allowNull: false,
        defaultValue: 'N'
      },
      mode: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      pg_type: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      cardnum: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      name_on_card: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      payunor: {
        type: Sequelize.INTEGER(10),
        allowNull: false,
        defaultValue: 1
      },
      auth_code: {
        type: Sequelize.STRING(255),
        allowNull: true
      }
    });

    // Primary key and guid unique constraint are already defined in the table creation
    // No need to add separate indexes for them

    await queryInterface.addIndex('transactions', ['order_details_id'], {
      name: 'order_details_id',
      using: 'BTREE'
    });

    await queryInterface.addIndex('transactions', ['order_id', 'source', 'txn_type', 'via'], {
      name: 'source_new',
      using: 'BTREE'
    });

    await queryInterface.addIndex('transactions', ['reff_id', 'via', 'source', 'txn_type'], {
      name: 'reff_id_with_via_source',
      using: 'BTREE'
    });

    await queryInterface.addIndex('transactions', ['user_id'], {
      name: 'user_id',
      using: 'BTREE'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('transactions');
  }
};
