/**
 * @class PersistenceService
 * @description Handles data persistence using localStorage
 * @author Vrushank Patel
 */
class PersistenceService {
    constructor() {
        this.STORAGE_KEY = 'marketron_data';
    }

    /**
     * @method saveData
     * @description Encrypts and saves data to localStorage
     * @param {Object} data - Data to save
     * @author Vrushank Patel
     */
    saveData(data) {
        const clonedData = JSON.parse(JSON.stringify(data));
        const encryptedData = cryptoUtil.encrypt(clonedData);
        if (encryptedData) {
            localStorage.setItem(this.STORAGE_KEY, encryptedData);
        }
    }

    /**
     * @method loadData
     * @description Loads and decrypts data from localStorage
     * @returns {Object|null} Decrypted data or null if loading fails
     * @author Vrushank Patel
     */
    loadData() {
        const encryptedData = localStorage.getItem(this.STORAGE_KEY);
        if (!encryptedData) return null;

        const decryptedData = cryptoUtil.decrypt(encryptedData);
        if (!decryptedData) {
            this.handleCorruptedData();
            return null;
        }

        if (!this.isValidData(decryptedData)) {
            this.handleCorruptedData();
            return null;
        }

        return decryptedData;
    }

    /**
     * @method isValidData
     * @description Validates the structure of loaded data
     * @param {Object} data - Data to validate
     * @returns {boolean} Whether the data is valid
     * @author Vrushank Patel
     */
    isValidData(data) {
        try {
            if (data.orderBook) {
                if (!Array.isArray(data.orderBook.bids) || !Array.isArray(data.orderBook.asks)) {
                    return false;
                }
            }
            if (data.trades && !Array.isArray(data.trades)) {
                return false;
            }
            if (data.marketData) {
                if (typeof data.marketData.prices !== 'object') return false;
                if (typeof data.marketData.priceHistory !== 'object') return false;
                for (const symbol in data.marketData.priceHistory) {
                    if (!Array.isArray(data.marketData.priceHistory[symbol])) return false;
                }
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * @method handleCorruptedData
     * @description Handles corrupted data scenario
     * @author Vrushank Patel
     */
    handleCorruptedData() {
        localStorage.removeItem(this.STORAGE_KEY);
        Swal.fire({
            title: 'Data Corruption Detected',
            text: 'Previous data appears to be tampered with and cannot be loaded. Refreshing Marketron now.',
            icon: 'error',
            confirmButtonText: 'OK'
        }).then(() => {
            window.location.href = window.location.href;
        });
    }
}

const persistenceService = new PersistenceService(); 