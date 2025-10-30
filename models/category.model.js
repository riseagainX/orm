

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    // Primary Key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    display_type: {
      type: DataTypes.STRING(20),
      defaultValue: 'All'
    },
    cat_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    more_description: {
      type: DataTypes.TEXT
    },
    order_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    icon_url: {
      type: DataTypes.TEXT
    },
    category_banner_image: {
      type: DataTypes.TEXT
    },
    image_url: {
      type: DataTypes.TEXT
    },
    mobile_image_url: {
      type: DataTypes.TEXT
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('A', 'I'),
      allowNull: false,
      comment: 'I=>inactive A=>active'
    },
    trending_category: {
      type: DataTypes.ENUM('Y', 'N'),
      allowNull: false,
      defaultValue: 'N'
    },
    trending_category_image: {
      type: DataTypes.STRING(500)
    },
    trending_description: {
      type: DataTypes.STRING(256)
    },
    seo_title: {
      type: DataTypes.STRING(256)
    },
    seo_keyword: {
      type: DataTypes.TEXT
    },
    seo_description: {
      type: DataTypes.TEXT
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated: {
      type: DataTypes.DATE
    },
    new_arrival: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0
    }
  }, {
    // Model options
    tableName: 'categories',
    timestamps: true, // Enable timestamps
    createdAt: 'created', // Map createdAt to 'created' column
    updatedAt: 'updated' // Map updatedAt to 'updated' column
  });

  /**
   * Defines the associations for the Category model.
   * A Category can have many Brands through the BrandCategory junction table.
   */
  Category.associate = (models) => {

    Category.belongsToMany(models.Brand, {

      through: models.BrandCategory, // The junction model ->> (category ko join krne ke liye kis(brandcatrhory) table ka use krna h)
      foreignKey: 'category_id', // Foreign key in the junction table that points to Category
      otherKey: 'brand_id' // Foreign key in the junction table that points to Brand
    });
  };

  return Category;
};
