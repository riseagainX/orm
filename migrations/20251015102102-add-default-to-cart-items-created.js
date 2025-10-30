// Migration File: 20251015xxxxxx-add-default-to-cart-items-created.js

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Action: Change the column definition for 'created' on 'cart_items'
    await queryInterface.changeColumn('cart_items', 'created', {
      type: Sequelize.DATE,
      allowNull: false,
      // 💡 THE FIX: Use the SQL function to prevent NULL error on insert
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Action: Revert the change by setting the defaultValue back to null
    await queryInterface.changeColumn('cart_items', 'created', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: null // Removing the default is the undo operation
    });
  }
};