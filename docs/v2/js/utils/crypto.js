/**
 * @class CryptoUtil
 * @description Handles encryption and decryption of data
 * @author Vrushank Patel
 */
class CryptoUtil {
    constructor() {
        this.secretKey = 'marketron-v1'; // Security key for encryption
    }

    /**
     * @method encrypt
     * @description Encrypts data using AES
     * @param {Object} data - Data to encrypt
     * @returns {string} Encrypted data
     * @author Vrushank Patel
     */
    encrypt(data) {
        try {
            const jsonString = JSON.stringify(data);
            return CryptoJS.AES.encrypt(jsonString, this.secretKey).toString();
        } catch (error) {
            console.error('Encryption failed:', error);
            return null;
        }
    }

    /**
     * @method decrypt
     * @description Decrypts data using AES
     * @param {string} encryptedData - Data to decrypt
     * @returns {Object|null} Decrypted data or null if decryption fails
     * @author Vrushank Patel
     */
    decrypt(encryptedData) {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
            return JSON.parse(decryptedString);
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }
}

const cryptoUtil = new CryptoUtil(); 