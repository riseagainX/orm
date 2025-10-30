/**
 * Sequelize Model Definition for the 'transactions' table.
 * 
 * This model represents transaction data with relationships to users, orders,
 * and order details.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.BIGINT(19),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    guid: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    user_id: {
      type: DataTypes.INTEGER(10),
      allowNull: false
    },
    order_id: {
      type: DataTypes.INTEGER(10),
      allowNull: true
    },
    order_details_id: {
      type: DataTypes.BIGINT(19),
      allowNull: true
    },
    source: {
      type: DataTypes.ENUM('PAYU', 'CERA', 'RBL', 'PAYTMUPI', 'BCH', 'SEAMLESSPG', 'MAT', 'COUPON'),
      allowNull: false
    },
    txn_type: {
      type: DataTypes.ENUM('DB', 'CR'),
      allowNull: false,
      comment: "'DB'=>Debit,'CR'=>Credit"
    },
    amount: {
      type: DataTypes.DECIMAL(11, 2),
      allowNull: false
    },
    reff_id: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    mihpayid: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    request_id: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    via: {
      type: DataTypes.ENUM('ORDER', 'ADMIN', 'PROMOTION', 'CASHBACK', 'REFUND', 'EARNREFUND', 'COUPON'),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('I', 'P', 'F', 'C', 'R', 'RI', 'RF'),
      allowNull: false,
      comment: "I=>Initiate,F=>Fail,C=>Complete"
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated: {
      type: DataTypes.DATE,
      allowNull: true
    },
    remark: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    reversal_guid: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    sync: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      defaultValue: 'N'
    },
    mode: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    pg_type: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    cardnum: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    name_on_card: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    payunor: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      defaultValue: 1
    },
    auth_code: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'transactions',
    timestamps: false,
    indexes: [
      {
        name: 'PRIMARY',
        unique: true,
        using: 'BTREE',
        fields: ['id']
      },
      {
        name: 'guid',
        unique: true,
        using: 'BTREE',
        fields: ['guid']
      },
      {
        name: 'order_details_id',
        using: 'BTREE',
        fields: ['order_details_id']
      },
      {
        name: 'source_new',
        using: 'BTREE',
        fields: ['order_id', 'source', 'txn_type', 'via']
      },
      {
        name: 'reff_id_with_via_source',
        using: 'BTREE',
        fields: ['reff_id', 'via', 'source', 'txn_type']
      },
      {
        name: 'user_id',
        using: 'BTREE',
        fields: ['user_id']
      }
    ]
  });

  Transaction.associate = (models) => {
    // Transaction belongs to User
    Transaction.belongsTo(models.User, {
      foreignKey: 'user_id'
    });

    // Transaction belongs to Order
    Transaction.belongsTo(models.Order, {
      foreignKey: 'order_id'
    });

    // Transaction belongs to OrderDetail
    Transaction.belongsTo(models.OrderDetail, {
      foreignKey: 'order_details_id'
    });
  };

  return Transaction;
};