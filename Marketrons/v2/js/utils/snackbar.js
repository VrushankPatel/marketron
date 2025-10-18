/**
 * @class SnackbarService
 * @description Handles snackbar notifications with queue support
 * @author Vrushank Patel
 */
class SnackbarService {
    constructor() {
        this.currentSnackbar = null;
        this.queue = [];
    }

    /**
     * @method show
     * @description Shows a snackbar message
     * @param {string} message - Message to display
     * @param {string} type - Type of message (success/error)
     */
    show(message, type = 'info') {
        // If there's a current snackbar, remove it immediately
        if (this.currentSnackbar) {
            this.currentSnackbar.remove();
            this.currentSnackbar = null;
        }

        const snackbar = document.createElement('div');
        snackbar.className = `snackbar ${type}`;
        snackbar.textContent = message;
        document.body.appendChild(snackbar);
        
        this.currentSnackbar = snackbar;

        // Show the snackbar
        setTimeout(() => {
            snackbar.classList.add('show');
        }, 10);

        // Remove after 2 seconds (reduced from default 3 seconds)
        setTimeout(() => {
            snackbar.classList.remove('show');
            setTimeout(() => {
                if (snackbar.parentElement) {
                    snackbar.remove();
                }
                if (this.currentSnackbar === snackbar) {
                    this.currentSnackbar = null;
                }
            }, 200);
        }, 2000); // Reduced duration
    }
}

const snackbarService = new SnackbarService(); 