
const { DataTypes } = require('sequelize');

// The model is exported as a function that will be called by /models/index.js
module.exports = (sequelize) => {
  const Promotion = sequelize.define('Promotion', {
    // --- ATTRIBUTES (COLUMNS) DEFINITION ---

    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    value: {
      type: DataTypes.DECIMAL(10, 2) // Correct data type for currency or percentage values.
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    offer_type: {
      type: DataTypes.ENUM('DIS', 'ABS', 'OFFER', 'COMBO'),
      allowNull: false
    },

    promotion_type: {
      type: DataTypes.ENUM('SYSTEM', 'MANUAL'),
      allowNull: false
    },

    promocode_type: {
      type: DataTypes.ENUM('alpnanumeric', 'numeric', 'alphanumeric'), // Note: Typo 'alpnanumeric' from schema is preserved.
      allowNull: false
    },

    status: {
      type: DataTypes.ENUM('A', 'I'),
      allowNull: false
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
    },

    display_type: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: 'ALL'
    },

    display_text: {
      type: DataTypes.STRING(500),
      allowNull: false
    },

    tnc: {
      type: DataTypes.TEXT
    }

  }, {
    // --- MODEL OPTIONS ---

    tableName: 'promotions',

    // By explicitly defining the timestamp columns above, we turn this off to prevent conflicts.
    timestamps: false,

    // Translate all KEY statements from your SQL into Sequelize indexes for performance.
    indexes: [
      { name: 'Combine_index2', fields: ['value', 'offer_type'] },
      { name: 'Combine_index1', fields: ['offer_type', 'display_type', 'status'] },
      { name: 'idx_status_offer_type', fields: ['status', 'offer_type'] }
    ]
  });

  
  Promotion.associate = (models) => {
    // A Promotion has many PromotionXProduct entries
    Promotion.hasMany(models.PromotionXProduct, {
      foreignKey: 'promotion_id'
    });

    // Many-to-Many relationship with Product through PromotionXProduct
    Promotion.belongsToMany(models.Product, {
      through: models.PromotionXProduct,
      foreignKey: 'promotion_id',
      otherKey: 'product_id'
    });

    // One-to-Many relationship with Promocode
    Promotion.hasMany(models.Promocode, {
      foreignKey: 'promotion_id'
    });
    
    // Promotion has many OrderDetails
      Promotion.hasMany(models.OrderDetail, {
        foreignKey: 'promotion_id'
      });
  };


  return Promotion;
};