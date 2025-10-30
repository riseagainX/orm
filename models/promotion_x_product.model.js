
const { DataTypes } = require('sequelize');

// The model is exported as a function that will be called by /models/index.js
module.exports = (sequelize) => {
  // Note the model name 'PromotionXProduct' in PascalCase.
  const PromotionXProduct = sequelize.define('PromotionXProduct', {
    // --- ATTRIBUTES (COLUMNS) DEFINITION ---

    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },

    promotion_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    product_qty: {
      type: DataTypes.INTEGER
    },

    offer_product_id: {
      type: DataTypes.INTEGER
    },

    offer_product_qty: {
      type: DataTypes.INTEGER
    },

    value: {
      type: DataTypes.INTEGER
    },

    product_discount: {
      type: DataTypes.INTEGER
    },

    offer_product_discount: {
      type: DataTypes.INTEGER
    },

    promotion_type: {
      type: DataTypes.ENUM('D', 'ND'), // D=>Default, ND=>Non Default
      allowNull: false,
      defaultValue: 'D'
    },

    short_desc: {
      type: DataTypes.STRING(1000)
    },

    long_desc: {
      type: DataTypes.STRING(255)
    },

    status: {
      type: DataTypes.ENUM('A', 'I'),
      allowNull: false
    },

    remark: {
      type: DataTypes.STRING(255)
    },
    
    // --- EXPLICIT TIMESTAMP DEFINITION (THE FIX PATTERN) ---
    // We explicitly define these to match the schema's `DEFAULT NULL` behavior.
    created_on: {
        type: DataTypes.DATE,
        allowNull: true
    },

    created_by: {
      type: DataTypes.INTEGER
    },

    updated_on: {
        type: DataTypes.DATE,
        allowNull: true
    },

    updated_by: {
      type: DataTypes.INTEGER
    }

  }, {
    // --- MODEL OPTIONS ---

    tableName: 'promotion_x_products',

    // By explicitly defining the timestamp columns above, we turn this off to prevent conflicts.
    timestamps: false,

    // Translate all KEY statements from your SQL into Sequelize indexes for performance.
    indexes: [
      { name: 'promotion_x_products_ibfk_1', fields: ['brand_id'] },
      { name: 'promotion_x_products_ibfk_3', fields: ['product_id'] },
      { name: 'promotion_x_products_ibfk_4', fields: ['promotion_id'] }
    ]
  });

  PromotionXProduct.associate = (models) => {
    // Each record in this table belongs to one Promotion
    PromotionXProduct.belongsTo(models.Promotion, {
      foreignKey: 'promotion_id'
    });

    // Each record belongs to one Product
    PromotionXProduct.belongsTo(models.Product, {
      foreignKey: 'product_id'
    });
    
    // Each record belongs to one Brand
    PromotionXProduct.belongsTo(models.Brand, {
      foreignKey: 'brand_id'
    });
  };

  return PromotionXProduct;
};