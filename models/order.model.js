/**
 * Sequelize Model Definition for the 'orders' table.
 * 
 * This model represents order data in the system with all transaction details,
 * payment information, and order status tracking.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER(10),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    display_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Website'
    },
    guid: {
      type: DataTypes.STRING(200),
      allowNull: true,
      unique: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    coupon_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    total_points: {
      type: DataTypes.INTEGER(10),
      allowNull: false
    },
    total_amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    offer_points: {
      type: DataTypes.INTEGER(10),
      allowNull: false
    },
    offer_cash: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    payback_points_spent: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      defaultValue: 0
    },
    cash_spent: {
      type: DataTypes.DECIMAL(11, 2),
      allowNull: false
    },
    payback_points_earned: {
      type: DataTypes.DECIMAL(11, 2),
      allowNull: false
    },
    extra_payback_points_earned: {
      type: DataTypes.DECIMAL(11, 2),
      allowNull: false
    },
    additional_points_earned: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    remark: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    total_cashback: {
      type: DataTypes.INTEGER(10),
      allowNull: true
    },
    points_to_inr_ratio: {
      type: DataTypes.INTEGER(10),
      allowNull: false
    },
    inr_to_points_ratio: {
      type: DataTypes.DECIMAL(11, 4),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('I', 'P', 'V', 'F', 'C', 'E', 'RI', 'RP', 'RF', 'R', 'RM'),
      allowNull: false,
      comment: 'I=>Initiate,P=>Processing,V=>Verifing,F=>Fail,C=>Complete,E=>Expired,RI=>Refund Initiate,RP=>Refund Processing,RF=>Refund Fail,RC=>Refund Complete,RM=>Refund Manual'
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated: {
      type: DataTypes.DATE,
      allowNull: true
    },
    voucher_send_datetime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ref_id: {
      type: DataTypes.INTEGER(10),
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    whats_app: {
      type: DataTypes.ENUM('Y', 'N'),
      allowNull: true,
      defaultValue: 'N'
    },
    is_play: {
      type: DataTypes.ENUM('Y', 'N'),
      allowNull: true,
      defaultValue: 'N'
    },
    refund_type: {
      type: DataTypes.ENUM('P', 'F'),
      allowNull: true
    }
  }, {
    tableName: 'orders',
    timestamps: false,
    indexes: [
      {
        name: 'PRIMARY',
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
        name: 'status',
        using: 'BTREE',
        fields: ['status', 'updated']
      },
      {
        name: 'idx_user',
        using: 'BTREE',
        fields: ['user_id']
      }
    ]
  });

  Order.associate = (models) => {
    // Order belongs to User
    Order.belongsTo(models.User, {
      foreignKey: 'user_id'
    });

    // Order belongs to CouponCode (optional)
    Order.belongsTo(models.CouponCode, {
      foreignKey: 'coupon_id'
    });

    // Order has many OrderDetails
    Order.hasMany(models.OrderDetail, {
      foreignKey: 'order_id'
    });

    // Order has many Transactions
    Order.hasMany(models.Transaction, {
      foreignKey: 'order_id'
    });
  };

  return Order;
};