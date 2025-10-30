'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('order_details', {
      id: {
        type: Sequelize.INTEGER(10),
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      guid: {
        type: Sequelize.STRING(36),
        allowNull: true,
        unique: true
      },
      order_id: {
        type: Sequelize.INTEGER(10),
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        }
      },
      order_guid: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      cart_item_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'cart_items',
          key: 'id'
        }
      },
      brand_id: {
        type: Sequelize.INTEGER(10),
        allowNull: false,
        references: {
          model: 'brands',
          key: 'id'
        }
      },
      product_id: {
        type: Sequelize.INTEGER(10),
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        }
      },
      product_price: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER(10),
        allowNull: false
      },
      promotion_id: {
        type: Sequelize.INTEGER(10),
        allowNull: true,
        references: {
          model: 'promotions',
          key: 'id'
        }
      },
      promotion_points: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: true
      },
      promotion_cash: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      point_spent: {
        type: Sequelize.INTEGER(10),
        allowNull: false,
        defaultValue: 0
      },
      cash_spent: {
        type: Sequelize.FLOAT(10, 2),
        allowNull: false,
        defaultValue: 0.00
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
      delivery_status: {
        type: Sequelize.ENUM('I', 'F', 'C', 'D', 'R', 'RI', 'RF'),
        allowNull: false,
        defaultValue: 'I',
        comment: 'I=>Initiated,F=>Fail,C=>Complete,R=>Refunded'
      },
      promocode_id: {
        type: Sequelize.INTEGER(10),
        allowNull: true,
        references: {
          model: 'promocodes',
          key: 'id'
        }
      },
      is_offer_product: {
        type: Sequelize.TINYINT(3),
        allowNull: false,
        defaultValue: 0
      },
      cashback_offer_product_id: {
        type: Sequelize.INTEGER(10),
        allowNull: true
      },
      cashback_points: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      extra_cashback_points: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      created: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      delivery_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      delivered_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      template_id: {
        type: Sequelize.INTEGER(10),
        allowNull: true
      },
      gift: {
        type: Sequelize.STRING(1),
        allowNull: false,
        defaultValue: 'N'
      },
      gift_text: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      gift_img_url: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      earning_point_ratio: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0.03
      },
      is_game: {
        type: Sequelize.ENUM('1', '0'),
        allowNull: false,
        defaultValue: '0'
      },
      campaign_spin_wheel_prod_id: {
        type: Sequelize.INTEGER(10),
        allowNull: true,
        defaultValue: 0
      },
      remark: {
        type: Sequelize.STRING(300),
        allowNull: true
      },
      refund_type: {
        type: Sequelize.ENUM('P', 'F'),
        allowNull: true
      },
      refund_cash: {
        type: Sequelize.FLOAT(10, 2),
        allowNull: true,
        defaultValue: 0.00
      }
    });

    // Primary key and guid unique constraint are already defined in the table creation
    // No need to add separate indexes for them
    await queryInterface.addIndex('order_details', ['order_id'], {
      name: 'order_id',
      using: 'BTREE'
    });
    await queryInterface.addIndex('order_details', ['delivery_status', 'brand_id'], {
      name: 'ind_delivery_status_brand_id',
      using: 'BTREE'
    });
    await queryInterface.addIndex('order_details', ['promocode_id'], {
      name: 'promocodeid',
      using: 'BTREE'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('order_details');
  }
};
