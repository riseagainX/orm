/**
 * Sequelize Model Definition for the 'users' table.
 * 
 * This model represents user data in the system with all their profile information,
 * authentication details, and account status tracking.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    profile_image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    gst: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    address: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('A', 'P', 'I', 'N'),
      allowNull: false
    },
    dob: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    gender: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated: {
      type: DataTypes.DATE,
      allowNull: true
    },
    password_changed: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_login_ip: {
      type: DataTypes.STRING,
      allowNull: true
    },
    login_attempt: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    block_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    user_level: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: false,
    indexes: [
      {
        name: 'idx_phone',
        fields: ['phone']
      }
    ]
  });

  User.associate = (models) => {
    // User can have many OTPs
    User.hasMany(models.Otp, {
      foreignKey: 'mobile',
      sourceKey: 'phone'
    });
    
    // User has many Orders
    User.hasMany(models.Order, {
      foreignKey: 'user_id'
    });

    // User has many Transactions
    User.hasMany(models.Transaction, {
      foreignKey: 'user_id'
    });

    // User has many CouponCodes
    User.hasMany(models.CouponCode, {
      foreignKey: 'user_id'
    });
  };

  return User;
};