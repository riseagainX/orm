const CryptoUtil = require('../utils/crypto.util');

class EncryptionMiddleware {
  
  constructor(encryptionKey) {
    this.crypto = new CryptoUtil(encryptionKey);
  }
  
  encryptBody(dataToEncrypt) {
    if (dataToEncrypt === undefined || dataToEncrypt === null) throw new Error('dataToEncrypt is required');
    return this.crypto.encrypt(dataToEncrypt);
  }

  /**
   * Express middleware that wraps res.json to send { encryptedBody } instead
   * of the plain JSON. Useful if you want full-response encryption without
   * changing controller logic. Not used on check/mobile or login now.
   */
  // encryptResponse(req, res, next) {
  //   const originalJson = res.json.bind(res);
  //   res.json = (data) => {
  //     try {
  //       const encrypted = this.encryptBody(data);
  //       return originalJson({ encryptedBody: encrypted });
  //     } catch (e) {
  //       return res.status(500).json({ code: 500, status: 'Error', message: 'Encryption failed' });
  //     }
  //   };
  //   next();
  // }

}

module.exports = EncryptionMiddleware;