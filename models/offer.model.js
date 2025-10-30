

const { DataTypes } = require('sequelize');

// The model is exported as a function that will be called by /models/index.js
module.exports = (sequelize) => {
  const Offer = sequelize.define('Offer', {
    // --- ATTRIBUTES (COLUMNS) DEFINITION ---

    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },

    title: {
      type: DataTypes.STRING(500),
      allowNull: false
    },

    image_url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },

    image_url_200: {
      type: DataTypes.STRING(500)
    },

    sub_title: {
      type: DataTypes.STRING(500)
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    brand_id: {
      type: DataTypes.INTEGER
    },

    denomination: {
      type: DataTypes.INTEGER
    },

    promocode: {
      type: DataTypes.STRING(50)
    },

    status: {
      type: DataTypes.ENUM('A', 'I'),
      allowNull: false,
      defaultValue: 'I'
    },

    order_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    start_date: {
      type: DataTypes.DATE
    },

    end_date: {
      type: DataTypes.DATE
    },
    
    // --- EXPLICIT TIMESTAMP DEFINITION ---
    // Since there is no 'updated' column, we define 'created' manually.
    created: {
        type: DataTypes.DATE,
        allowNull: false
    }

  }, {
    // --- MODEL OPTIONS ---

    tableName: 'offers',

    // We disable automatic timestamps because we are handling 'created' manually above.
    timestamps: false,

    // Translate the KEY statement from your SQL into a Sequelize index for performance.
    indexes: [
      { name: 'offers_ibfk_1', fields: ['brand_id'] }
    ]
  });

  return Offer;
};