
module.exports = (sequelize, DataTypes) => {
  const Brand = sequelize.define('Brand', {
    // Primary Key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      comment: 'Primary identifier for the brand.'
    },
    display_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'WEBSITE'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    long_description: {
      type: DataTypes.TEXT
    },
    more_description: {
      type: DataTypes.TEXT
    },
    more_description_tilte: {
      type: DataTypes.STRING(255)
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'URL-friendly unique identifier for the brand.'
    },
    brand_icon_url: {
      type: DataTypes.STRING(500)
    },
    small_brand_icon_url: {
      type: DataTypes.STRING(500)
    },
    image_url: {
      type: DataTypes.STRING(500)
    },
    image_url_mobile: {
      type: DataTypes.STRING(500)
    },
    home_banner: {
      type: DataTypes.STRING(500)
    },
    bogo_brand_logo: {
      type: DataTypes.STRING(500)
    },
    offer_logo: {
      type: DataTypes.STRING(500)
    },
    smart_image_url: {
      type: DataTypes.STRING(500)
    },
    trending_brand: {
      type: DataTypes.ENUM('Y', 'N'),
      defaultValue: 'N'
    },
    trending_brand_image: {
      type: DataTypes.STRING(500)
    },
    important_instructions: {
      type: DataTypes.TEXT
    },
    checkout_instruction: {
      type: DataTypes.STRING(255)
    },
    tnc: {
      type: DataTypes.TEXT
    },
    checkout_step: {
      type: DataTypes.TEXT
    },
    order_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('A', 'I', 'D'),
      allowNull: false
    },
    order_limit: {
      type: DataTypes.ENUM('A', 'I'),
      allowNull: false,
      defaultValue: 'I'
    },
    order_limit_amt: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    new_arrival: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
    },
    default_category_id: {
      type: DataTypes.TINYINT
    },
    brand_master_id: {
      type: DataTypes.INTEGER
    },
    how_to_redeem: {
      type: DataTypes.TEXT
    },
    how_to_redeem_url: {
      type: DataTypes.STRING(100)
    },
    redemption_type: {
      type: DataTypes.ENUM('OFF', 'ON', 'B'),
      allowNull: false,
      defaultValue: 'OFF'
    },
    online_redeem_url: {
      type: DataTypes.STRING(100)
    },
    entertainment_category: {
      type: DataTypes.STRING(100)
    },
    is_show: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      defaultValue: 'Y'
    },
    template_id: {
      type: DataTypes.INTEGER
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
    earn_point_ratio: {
      type: DataTypes.FLOAT,
      defaultValue: 0.03
    },
    max_earn_point: {
      type: DataTypes.FLOAT
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated: {
      type: DataTypes.DATE
    },
    payu: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_gift_show: {
      type: DataTypes.ENUM('Y', 'N'),
      allowNull: false,
      defaultValue: 'N'
    },
    best_seller: {
      type: DataTypes.ENUM('Y', 'N',''),
      allowNull: false,
      defaultValue: 'N'
    },
    best_seller_order_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    best_selling_desk_image: {
      type: DataTypes.STRING(500)
    },
    best_selling_mob_image: {
      type: DataTypes.STRING(500)
    },
    payunor: {
      type: DataTypes.ENUM('Y', 'N'),
      defaultValue: 'Y'
    },
    brand_type: {
      type: DataTypes.ENUM('VOUCHER', 'OTT', 'OTTVOUCHER'),
      defaultValue: 'VOUCHER'
    },
    special_offer: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    gifting_status: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    // Model options
    tableName: 'brands',
    timestamps: true, // Enable timestamps
    createdAt: 'created', // Map createdAt to 'created' column
    updatedAt: 'updated' // Map updatedAt to 'updated' column
  });

  /**
   * Defines the associations for the Brand model.
   * A Brand can belong to many Categories through the BrandCategory junction table.
   */
  Brand.associate = (models) => {
    Brand.belongsToMany(models.Category, {
      through: models.BrandCategory, // The junction model
      foreignKey: 'brand_id', // Foreign key in the junction table that points to Brand
      otherKey: 'category_id' // Foreign key in the junction table that points to Category
    });

    // Direct relationship with BrandCategory (needed for direct queries)
    Brand.hasMany(models.BrandCategory, {
      foreignKey: 'brand_id'
    });

    Brand.hasMany(models.Product, {
    foreignKey: 'brand_id'
  });

  // A Brand can be linked in many promotion records. (One-to-Many)
  Brand.hasMany(models.PromotionXProduct, {
    foreignKey: 'brand_id'
  });
  
  // Brand has many OrderDetails
    Brand.hasMany(models.OrderDetail, {
      foreignKey: 'brand_id'
    });
  };

  return Brand;
};
