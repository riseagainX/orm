// File: /models/index.js
'use strict';
/**
 * This file is the central hub for the entire data layer of the application.
 * Its primary job is to find and load all model files in this directory.
 * If a model's console.log isn't appearing, the problem is almost always that
 * this file's discovery logic cannot find it due to a filename mismatch.
 */

// What this file is

// Central registry for all Sequelize models.
// Creates one Sequelize connection.
// Discovers and loads every model file in /models.
// Runs model associations.
// Exports all models plus the Sequelize instance.



const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename); // store the current file name (index.js)

// Load the database configuration from your specific config.json structure.
const config = require(__dirname + '/../config/config.json').development; 
const db = {};

console.log("models/index.js file ...🔁",config);
// Create the single, reusable Sequelize connection instance.
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: 'mysql',
  port: config.port,
  logging: false
});

// THIS IS THE DISCOVERY LOGIC.
// It reads every file in the current directory (__dirname).
fs
  .readdirSync(__dirname)
  .filter(file => {
    // It filters out this file (index.js), hidden files, and any non-JavaScript files.
    
    // If your brand model file has the wrong name, it will be filtered out here.
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    // If the file is found, it is required() and initialized here.
    // This is the point where your console.log should have been triggered.
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// First, load all the models
Object.keys(db).forEach(modelName => {
  console.log(`Loading model: ${modelName}`);
  if (db[modelName].associate) {
    console.log(`Setting up associations for model: ${modelName}`);
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
// module.exports=sequelize;