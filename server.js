const express = require("express");
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());
const config = require('./config/config.json');
const dbConfig = config.development;

const db= require('./models/index'); 
const sequelize =db.sequelize;
app.use(express.urlencoded({ extended: true }));

// Import Logger helper for application logging
const logger = require('./utils/logger.util');

// Import CryptoUtil helper for encryption/decryption
const CryptoUtil = require('./utils/crypto.util');
// Example: Initialize with your encryption key
// const cryptoHelper = new CryptoUtil('your-secret-key');
// Usage:
// const encrypted = cryptoHelper.encrypt('mydata');
// const decrypted = cryptoHelper.decrypt(encrypted);


const webroutes = require('./routes/web.routes');
 app.use('/dbsbank-api/api/v1', webroutes);




const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.success('Database connection successful');
    
    const [result] = await sequelize.query('SELECT DATABASE();');
    logger.info('Connected to database', { database: result[0]['DATABASE()'] });

    logger.info('All models loaded and synced successfully');
    
    // START THE SERVER
    const serverPort = dbConfig.serverPort || 5000;
    app.listen(serverPort, () => {
      logger.success(`Server running on port ${serverPort}`);
      logger.info(`API Base URL: http://localhost:${serverPort}/dbsbank-api/api/v1/home/content/HOME`);
    
    });

  } catch (err) {
    logger.error('Unable to connect or sync database', err);
    if (err.parent) {
      logger.error('Database error details', { sqlMessage: err.parent.sqlMessage });
    }
    process.exit(1); // exit the process no matter what 
  }
}; 

// Execute the startup function
startServer();