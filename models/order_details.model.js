/**
 * Sequelize Model Definition for the 'order_details' table.
 * 
 * This model represents order details data with relationships to orders, products,
 * brands, promotions, and other related entities.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrderDetail = sequelize.define('OrderDetail', {
    id: {
      type: DataTypes.INTEGER(10),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    guid: {
      type: DataTypes.STRING(36),
      allowNull: true,
      unique: true
    },
    order_id: {
      type: DataTypes.INTEGER(10),
      allowNull: false
    },
    order_guid: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    cart_item_id: {
      type: DataTypes.INTEGER(10),
      allowNull: true
    },
    brand_id: {
      type: DataTypes.INTEGER(10),
      allowNull: false
    },
    product_id: {
      type: DataTypes.INTEGER(10),
      allowNull: false
    },
    product_price: {
      type: DataTypes.DECIMAL(11, 2),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER(10),
      allowNull: false
    },
    promotion_id: {
      type: DataTypes.INTEGER(10),
      allowNull: true
    },
    promotion_points: {
      type: DataTypes.DECIMAL(11, 2),
      allowNull: true
    },
    promotion_cash: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    point_spent: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      defaultValue: 0
    },
    cash_spent: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    delivery_sender_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    delivery_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    delivery_email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    delivery_phone: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    delivery_status: {
      type: DataTypes.ENUM('I', 'F', 'C', 'D', 'R', 'RI', 'RF'),
      allowNull: false,
      defaultValue: 'I',
      comment: 'I=>Initiated,F=>Fail,C=>Complete,R=>Refunded'
    },
    promocode_id: {
      type: DataTypes.INTEGER(10),
      allowNull: true
    },
    is_offer_product: {
      type: DataTypes.TINYINT(3),
      allowNull: false,
      defaultValue: 0
    },
    cashback_offer_product_id: {
      type: DataTypes.INTEGER(10),
      allowNull: true
    },
    cashback_points: {
      type: DataTypes.DECIMAL(11, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    extra_cashback_points: {
      type: DataTypes.DECIMAL(11, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
    delivery_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    delivered_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    template_id: {
      type: DataTypes.INTEGER(10),
      allowNull: true
    },
    gift: {
      type: DataTypes.STRING(1),
      allowNull: false,
      defaultValue: 'N'
    },
    gift_text: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    gift_img_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    earning_point_ratio: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.03
    },
    is_game: {
      type: DataTypes.ENUM('1', '0'),
      allowNull: false,
      defaultValue: '0'
    },
    campaign_spin_wheel_prod_id: {
      type: DataTypes.INTEGER(10),
      allowNull: true,
      defaultValue: 0
    },
    remark: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    refund_type: {
      type: DataTypes.ENUM('P', 'F'),
      allowNull: true
    },
    refund_cash: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: true,
      defaultValue: 0.00
    }
  }, {
    tableName: 'order_details',
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
        name: 'order_id',
        using: 'BTREE',
        fields: ['order_id']
      },
      {
        name: 'ind_delivery_status_brand_id',
        using: 'BTREE',
        fields: ['delivery_status', 'brand_id']
      },
      {
        name: 'promocodeid',
        using: 'BTREE',
        fields: ['promocode_id']
      }
    ]
  });

  OrderDetail.associate = (models) => {
    // OrderDetail belongs to Order
    OrderDetail.belongsTo(models.Order, {
      foreignKey: 'order_id'
    });

    // OrderDetail belongs to Brand
    OrderDetail.belongsTo(models.Brand, {
      foreignKey: 'brand_id'
    });

    // OrderDetail belongs to Product
    OrderDetail.belongsTo(models.Product, {
      foreignKey: 'product_id'
    });

    // OrderDetail belongs to CartItem
    OrderDetail.belongsTo(models.CartItem, {
      foreignKey: 'cart_item_id'
    });

    // OrderDetail belongs to Promotion
    OrderDetail.belongsTo(models.Promotion, {
      foreignKey: 'promotion_id'
    });

    // OrderDetail belongs to Promocode
    OrderDetail.belongsTo(models.Promocode, {
      foreignKey: 'promocode_id'
    });

    // OrderDetail has many Transactions
    OrderDetail.hasMany(models.Transaction, {
      foreignKey: 'order_details_id'
    });
  };

  return OrderDetail;
};