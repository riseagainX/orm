

module.exports = (sequelize, DataTypes) => {
  const BrandCategory = sequelize.define('BrandCategory', {
    // Primary Key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    // Foreign Key for the Brand model
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'brands', // This is a reference to another model
        key: 'id' // This is the column name of the referenced model
      }
    },
    // Foreign Key for the Category model
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('A', 'I'),
      allowNull: false
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    // Model options
    tableName: 'brand_categories',
    timestamps: true,
    createdAt: 'created',
    updatedAt: 'updated'
  });

  /**
   * It's good practice to also define the inverse relationship from the junction table,
   * although it's not strictly required for the belongsToMany association to work.
   */
  BrandCategory.associate = (models) => {
    BrandCategory.belongsTo(models.Brand, { foreignKey: 'brand_id' });
    BrandCategory.belongsTo(models.Category, { foreignKey: 'category_id' });
  };

  return BrandCategory;
};
