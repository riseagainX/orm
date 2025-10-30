

const { DataTypes } = require('sequelize');

// The model is exported as a function that will be called by /models/index.js
module.exports = (sequelize) => {
  const PageContent = sequelize.define('PageContent', {


    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },

    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    description: {
      type: DataTypes.TEXT
    },

    content1: {
      type: DataTypes.TEXT
    },

    content2: {
      type: DataTypes.TEXT
    },

    carausel1: {
      type: DataTypes.TEXT
    },

    carausel2: {
      type: DataTypes.TEXT
    },

    carausel3: {
      type: DataTypes.TEXT
    },

    static_banners: {
      type: DataTypes.TEXT
    },

    banner: {
      type: DataTypes.TEXT
    },

    mob_banner: {
      type: DataTypes.STRING(255)
    },

    seo_title: {
      type: DataTypes.STRING(255)
    },

    seo_keyword: {
      type: DataTypes.STRING(255)
    },

    seo_description: {
      type: DataTypes.TEXT('medium')
    },

    // --- EXPLICIT TIMESTAMP DEFINITION (THE FIX) ---
    // We define the timestamp columns here instead of using the 'timestamps' option.
    created: {
      type: DataTypes.DATE,
      allowNull: true // Match the 'datetime DEFAULT NULL' schema
    },

    status: {
      type: DataTypes.STRING(5),
      allowNull: false
    },

    updated_by: {
      type: DataTypes.INTEGER
    },

    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    updated: {
      type: DataTypes.DATE,
      allowNull: true // Match the 'datetime DEFAULT NULL' schema
    }

  }, {
    // --- MODEL OPTIONS ---

    tableName: 'page_content',

    // By explicitly defining the columns above, we now turn this off to prevent conflicts.
    timestamps: false

  });

  return PageContent;
};