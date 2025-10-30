// exports.decryptBody = async (req, res, next) => {
//   // return next();
//   const { encryptedBody } = req.body;
//   if (!encryptedBody)
//     return res.json({
//       code: 400,
//       status: 'Error',
//       message: '`encryptedBody` key is required'
//     });

//   const clientDecrypted = gyftr.clientDecrypt(encryptedBody); // encrypted from client side
//   const decryptedBody = JSON.parse(clientDecrypted);

//   req.body = decryptedBody;
//   next();
// };

// exports.encryptBody = dataToEncrypt => {
//   // return dataToEncrypt;
//   if (!dataToEncrypt) throw new Error('dataToEncrypt is required');
//   dataToEncrypt = typeof dataToEncrypt === 'object' ? JSON.stringify(dataToEncrypt) : `${dataToEncrypt}`;
//   const clientEncrypted = gyftr.clientEncrypt(dataToEncrypt);
//   return clientEncrypted;
// };



// // actual decrption method
//  clientDecrypt(encryptedStr) {
//     try {
//       if (!encryptedStr) return null;
//       var bytes = CryptoJS.AES.decrypt(encryptedStr, this.ENC_KEY);
//       var decrypted = bytes.toString(CryptoJS.enc.Utf8);
//       return decrypted;
//     } catch (err) {
//       throw err;
//     }
//   }

//   // actual encryption method
//   clientEncrypt(plainText) {
//     try {
//       if (!plainText) return null;
//       var encrypted = CryptoJS.AES.encrypt(plainText, this.ENC_KEY).toString();
//       return encrypted;
//     } catch (err) {
//       throw err;
//     }
//   }
