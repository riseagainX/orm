'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      profile_image: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      gst: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      address: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('A', 'P', 'I', 'N'),
        allowNull: false
      },
      dob: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      gender: {
        type: Sequelize.STRING(40),
        allowNull: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated: {
        type: Sequelize.DATE,
        allowNull: true
      },
      password_changed: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_login_ip: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      login_attempt: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      block_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      user_level: {
        type: Sequelize.INTEGER,
        allowNull: true
      }
    });

    // Add the index for phone field
    await queryInterface.addIndex('users', ['phone'], {
      name: 'idx_phone',
      using: 'BTREE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the index first
    await queryInterface.removeIndex('users', 'idx_phone');
    // Then drop the table
    await queryInterface.dropTable('users');
  }
};
