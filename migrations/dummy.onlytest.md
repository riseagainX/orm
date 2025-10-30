//  migrations/20251005123456-add-phone-number-to-users.js
// 'use strict';
////////////// this is database layer, dont talk to application layer directly about schema change
// module.exports = {
//   // The 'up' function is what happens when you run the migration
//   async up(queryInterface, Sequelize) {
//     await queryInterface.addColumn('Users', 'phone_number', {
//       type: Sequelize.STRING,
//       allowNull: true, // It's good practice to allow null for new columns on existing tables
//     });
//   },

//   // The 'down' function is what happens when you undo (rollback) the migration
//   async down(queryInterface, Sequelize) {
//     await queryInterface.removeColumn('Users', 'phone_number');
//   },
// };



// How to Create and Run Migrations (The Workflow)
// You'll need the sequelize-cli package to do this.

// Step 1: Install the CLI
// If you haven't already, install it as a development dependency.

// Bash

// npm install --save-dev sequelize-cli
// Step 2: Create a New Migration File
// Use the CLI to generate a blank migration file. The name should describe the change you're making.

// Bash

// npx sequelize-cli migration:generate --name add-phone-number-to-users
// This will create a new file in your migrations folder with a timestamped name.

// Step 3: Edit the Migration File
// Open the new file and add your logic to the up and down functions, just like in the example above.

// Step 4: Run the Migration 🚀
// To apply all pending migrations to your database, run:

// Bash

// npx sequelize-cli db:migrate
// Sequelize will look for any migration files that haven't been run yet, execute their up function in order, and record that it ran them in a special table called SequelizeMeta so it never runs the same one twice.

// How to Undo a Migration ⏪
// If you need to roll back the very last migration you ran, the command is:

// Bash

// npx sequelize-cli db:migrate:undo
// This will execute the down function of the last migration that was successfully run.