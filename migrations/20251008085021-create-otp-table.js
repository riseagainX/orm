'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('otp', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      otp: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'VALID'
      },
      mobile: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      section: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      created: {
        type: Sequelize.DATE,
        allowNull: false
      },
      valid_till: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      order_id: {
        type: Sequelize.BIGINT,
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('otp');
  }
};
