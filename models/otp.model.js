/**
 * Sequelize Model Definition for the 'otp' table.
 * 
 * This model represents OTP (One Time Password) records used for various
 * authentication and verification processes in the system.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Otp = sequelize.define('Otp', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    otp: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'VALID'
    },
    mobile: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    section: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
    valid_till: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    order_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    }
  }, {
    tableName: 'otp',
    timestamps: false
  });

  Otp.associate = (models) => {
    // OTP belongs to a User through mobile number
    Otp.belongsTo(models.User, {
      foreignKey: 'mobile',
      targetKey: 'phone'
    });
  };

  return Otp;
};