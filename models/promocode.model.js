
const { DataTypes } = require('sequelize');

// The model is exported as a function that will be called automatically by /models/index.js
module.exports = (sequelize) => {
  const Promocode = sequelize.define('Promocode', {
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

    promocode: {
      type: DataTypes.STRING(50),
      allowNull: false
    },

    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    usage_type: {
      type: DataTypes.ENUM('S', 'M'),
      allowNull: false,
      defaultValue: 'M'
    },

    status: {
      type: DataTypes.ENUM('VALID', 'INVALID', 'USED', 'PENDING'),
      allowNull: false,
      defaultValue: 'VALID'
    },

    blasted: {
      type: DataTypes.ENUM('Y', 'N'),
      allowNull: false,
      defaultValue: 'N'
    },

    blasted_date: {
      type: DataTypes.DATEONLY
    },
    
    // --- EXPLICIT TIMESTAMP DEFINITION (THE FIX) ---
    // We define the timestamp columns here instead of using the 'timestamps' option.
    created_on: {
        type: DataTypes.DATE,
        allowNull: true // Match the 'datetime DEFAULT NULL' schema
    },

    created_by: {
      type: DataTypes.INTEGER
    },

    updated_on: {
        type: DataTypes.DATE,
        allowNull: true // Match the 'datetime DEFAULT NULL' schema
        
    },

    updated_by: {
      type: DataTypes.INTEGER
    },

    total_max_usage: {
      type: DataTypes.INTEGER
    },

    user_max_usage: {
      type: DataTypes.INTEGER
    }

  }, {
    // --- MODEL OPTIONS ---

    tableName: 'promocodes',

    // By explicitly defining the columns above, we now turn this off to prevent conflicts.
    timestamps: false,

    // Translate the KEY statements from your SQL into Sequelize indexes for performance.
    indexes: [
      { name: 'promocodes_ibfk_1', fields: ['promotion_id'] },
      { name: 'idx_status', fields: ['status'] }
    ]
  });


  Promocode.associate = (models) => {
    // A Promocode belongs to one Promotion. (The "many" side of the relationship)
    // This creates methods like `promocode.getPromotion()`.
    Promocode.belongsTo(models.Promotion, {
      foreignKey: 'promotion_id', // The key in this model that links to Promotion
      targetKey: 'id' // The key in the target model (Promotion)
    });

    // Promocode has many CartItems (one-to-many, optional)
    Promocode.hasMany(models.CartItem, {
      foreignKey: 'promocode_id'
    });
    
    // Promocode has many OrderDetails
    Promocode.hasMany(models.OrderDetail, {
      foreignKey: 'promocode_id'
    });
  };

  return Promocode;
};