/**
 * Sequelize Model Definition for the 'coupon_code' table.
 * 
 * This model represents coupon codes that can be applied to orders.
 * Coupons are linked to users and can have usage limits and validity periods.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CouponCode = sequelize.define('CouponCode', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    mobile: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    batch_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    coupon_code: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true
    },
    valid_from: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    valid_till: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    min_order_value: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    max_order_value: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    total_user_usage: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },
    user_max_usage: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_used: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: '0=unused,1=used'
    },
    status: {
      type: DataTypes.ENUM('A', 'I'),
      allowNull: false,
      defaultValue: 'I'
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'coupon_code',
    timestamps: false,
    indexes: [
      {
        name: 'coupon_code',
        unique: true,
        fields: ['coupon_code']
      },
      {
        name: 'idx_users',
        fields: ['coupon_code']
      },
      {
        name: 'batch_id',
        fields: ['batch_id']
      }
    ]
  });

  /**
   * ASSOCIATIONS
   * 
   * CouponCode belongs to User (via user_id)
   * - A coupon code can be assigned to a specific user
   * 
   * CouponCode has many CartItems
   * - Multiple cart items can use the same coupon
   * 
   * CouponCode has many Orders
   * - Multiple orders can use the same coupon (if total_user_usage > 1)
   * 
   * Note: batch_id might link to a batch table if you have one,
   * but I don't see it in your current schema, so leaving it unassociated for now.
   */
  CouponCode.associate = (models) => {
    // CouponCode belongs to User
    // A coupon can be assigned to a specific user
    CouponCode.belongsTo(models.User, {
      foreignKey: 'user_id'
    });

    // CouponCode has many CartItems
    CouponCode.hasMany(models.CartItem, {
      foreignKey: 'coupon_id'
    });

    // CouponCode has many Orders
    CouponCode.hasMany(models.Order, {
      foreignKey: 'coupon_id'
    });
  };

  return CouponCode;
};
