'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cart_items', {
      id: {
        type: Sequelize.BIGINT, // BIGINT(19)
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      product_id: {
        type: Sequelize.INTEGER, // INT(10)
        allowNull: false
      },
      user_id: {
        type: Sequelize.BIGINT, // BIGINT(19)
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER.UNSIGNED, // INT(10) UNSIGNED
        allowNull: false
      },
      delivery_sender_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      delivery_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      delivery_email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      delivery_phone: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      state: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      buy_later: {
        type: Sequelize.CHAR(1),
        allowNull: false,
        defaultValue: 'N'
      },
      gift: {
        type: Sequelize.ENUM('Y', 'N'),
        allowNull: false,
        defaultValue: 'N'
      },
      gift_text: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      gift_img_url: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      template_id: {
        type: Sequelize.INTEGER, // INT(10)
        allowNull: true
      },
      delivery_date: {
        type: Sequelize.DATE, // DATETIME
        allowNull: true
      },
      promocode_id: {
        type: Sequelize.INTEGER, // INT(10)
        allowNull: true
      },
      buynow: {
        type: Sequelize.INTEGER, // INT(10)
        allowNull: false,
        defaultValue: 0
      },
      zero_emi_status: {
        type: Sequelize.ENUM('A', 'I'),
        allowNull: false,
        defaultValue: 'I'
      },
      point_against_product: {
        type: Sequelize.INTEGER, // INT(10)
        allowNull: true,
        defaultValue: 0
      },
      display_type: {
        type: Sequelize.STRING(10),
        allowNull: true,
        defaultValue: 'WEBSITE'
      },
      created: {
        type: Sequelize.DATE, // DATETIME
        allowNull: false
      }
    }, {
      // Table options
      charset: 'latin1',
      collate: 'latin1_swedish_ci'
    });

    // Indexes to match DDL
    await queryInterface.addIndex('cart_items', ['product_id'], {  // first parameter (model name) , second parameter (column name (atitribute name/ field name))
      name: 'cart_items_ibfk_1',
      using: 'BTREE'
    });

    await queryInterface.addIndex('cart_items', ['promocode_id'], {
      name: 'cart_items_ibfk_2',
      using: 'BTREE'
    });

    await queryInterface.addIndex('cart_items', ['user_id', 'created'], {
      name: 'cart_items_ibfk_4',
      using: 'BTREE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first, then table
    await queryInterface.removeIndex('cart_items', 'cart_items_ibfk_1');
    await queryInterface.removeIndex('cart_items', 'cart_items_ibfk_2');
    await queryInterface.removeIndex('cart_items', 'cart_items_ibfk_4');
    await queryInterface.dropTable('cart_items');
  }
};