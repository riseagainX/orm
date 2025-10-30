const CryptoUtil = require('../utils/crypto.util');

class DecryptionMiddleware {

  constructor(decryptionKey) {
    this.crypto = new CryptoUtil(decryptionKey);
  }

  decryptBody(req, res, next) {
    const { encryptedBody } = req.body;

    if (!encryptedBody) {
      return res.status(400).json({
        code: 400,
        status: 'Error',
        message: '`encryptedBody` key is required'
      });
    }
    
    try {
      const decryptedText = this.crypto.decrypt(encryptedBody);
      const decryptedBody = JSON.parse(decryptedText);
      req.body = decryptedBody; // main line ( important logic (work for multiple files , do not need to add separate files))
      return next();
    } catch (err) {
      return res.status(400).json({ code: 400, status: 'Error', message: 'Invalid encrypted payload' });
    }
  }
}

module.exports = DecryptionMiddleware