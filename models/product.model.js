
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
   

    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },

    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    display_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'WEBSITE'
    },

    product_guid: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    expiry_date: {
      type: DataTypes.DATEONLY, // DATEONLY for SQL DATE type
      allowNull: true
    },

    available_qty: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },

    tnc: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM('A', 'I'),
      allowNull: false,
    },

    pre_status: {
      type: DataTypes.ENUM('A', 'I'),
      allowNull: true
    },

    remark: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: '',
    },

    max_point_limit: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    is_show: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      defaultValue: 'Y'
    },

    created: {
      type: DataTypes.DATE, // Corresponds to DATETIME
      allowNull: true,
    },

    updated: {
      type: DataTypes.DATE, // Corresponds to DATETIME
      allowNull: true,
    },

    is_payback_plus: {
      type: DataTypes.ENUM('Y', 'N'),
      allowNull: false,
      defaultValue: 'N'
    },

    product_guid_live: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
  }, {
   
    tableName: 'products',
    
    // Sequelize's automatic timestamping is disabled because the 'created'
    // and 'updated' columns are explicitly defined in our model to match the schema.
    timestamps: false,
    
    // Defining indexes to match the keys in the DDL for performance.
    indexes: [
      { name: 'brand_vouchers_ibfk_1', fields: ['brand_id'] },
      { name: 'Combine_Index1', fields: ['display_type', 'expiry_date', 'available_qty', 'status'] },
    ],
  });

Product.associate = (models) => {
    // Product belongs to a Brand
    Product.belongsTo(models.Brand, {
      foreignKey: 'brand_id'
    });

    // Product has many PromotionXProduct entries
    Product.hasMany(models.PromotionXProduct, {
      foreignKey: 'product_id'
    });

    // Many-to-Many relationship with Promotion through PromotionXProduct
    Product.belongsToMany(models.Promotion, {
      through: models.PromotionXProduct,
      foreignKey: 'product_id',
      otherKey: 'promotion_id'
    });

    // Product has many CartItems (one-to-many)
    Product.hasMany(models.CartItem, {
      foreignKey: 'product_id'
    });
    
    // Product has many OrderDetails
    Product.hasMany(models.OrderDetail, {
      foreignKey: 'product_id'
    });
  };

  return Product;
};