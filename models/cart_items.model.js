const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CartItem = sequelize.define('CartItem', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    coupon_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
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
    buy_later: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      defaultValue: 'N'
    },
    gift: {
      type: DataTypes.ENUM('Y', 'N'),
      allowNull: false,
      defaultValue: 'N'
    },
    gift_text: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    gift_img_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    template_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    delivery_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    promocode_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    buynow: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    zero_emi_status: {
      type: DataTypes.ENUM('A', 'I'),
      allowNull: false,
      defaultValue: 'I'
    },
    point_against_product: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    display_type: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: 'WEBSITE'
    },
   created: {
        type: DataTypes.DATE,
        allowNull: false,
        // 💡 UPDATE: Tell Sequelize to expect the database to set this value
        defaultValue: DataTypes.NOW 
    }
  }, {
    tableName: 'cart_items',
    timestamps: false,
    indexes: [
      { name: 'cart_items_ibfk_1', fields: ['product_id'] },
      { name: 'cart_items_ibfk_2', fields: ['promocode_id'] },
      { name: 'cart_items_ibfk_4', fields: ['user_id', 'created'] }
    ],
    // Optional: match table collation
    // collate: 'latin1_swedish_ci'
  });

  CartItem.associate = (models) => {
    // CartItem belongs to Product (many-to-one)
    CartItem.belongsTo(models.Product, { 
      foreignKey: 'product_id'
    });
    
    // CartItem belongs to User (many-to-one)
    CartItem.belongsTo(models.User, { 
      foreignKey: 'user_id'
    });
    
    // CartItem belongs to Promocode (many-to-one, optional)
    CartItem.belongsTo(models.Promocode, { 
      foreignKey: 'promocode_id'
    });
    
    // CartItem belongs to CouponCode (many-to-one, optional)
    CartItem.belongsTo(models.CouponCode, { 
      foreignKey: 'coupon_id'
    });
    
    // CartItem has many OrderDetails
    CartItem.hasMany(models.OrderDetail, {
      foreignKey: 'cart_item_id'
    });
  };

  return CartItem;
};