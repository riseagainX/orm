const CryptoJS = require('crypto-js');
class CryptoUtil {
	
	constructor(encryptionKey) {
		this.ENC_KEY = encryptionKey;
	}


	encrypt(plain) {
		if (plain === undefined || plain === null) throw new Error('encrypt: input is required');
		const text = typeof plain === 'object' ? JSON.stringify(plain) : `${plain}`;
		return CryptoJS.AES.encrypt(text, this.ENC_KEY).toString();
	}

	

	decrypt(cipher) {
		if (!cipher) throw new Error('decrypt: cipher is required');
		const bytes = CryptoJS.AES.decrypt(cipher, this.ENC_KEY);
		const decoded = bytes.toString(CryptoJS.enc.Utf8);
		return decoded;
	}
}

module.exports = CryptoUtil;


