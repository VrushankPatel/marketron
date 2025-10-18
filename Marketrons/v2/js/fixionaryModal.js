class FixionaryModal {
    constructor() {
        this.modal = new bootstrap.Modal(document.getElementById('fixionaryModal'), {
            keyboard: true  // Enable keyboard events (Esc key)
        });
        this.iframe = document.getElementById('fixionaryFrame');
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('fixionaryButton').addEventListener('click', () => {
            this.openModal();
        });

        // Set iframe src when modal is about to show
        document.getElementById('fixionaryModal').addEventListener('show.bs.modal', () => {
            this.iframe.src = 'https://thefixionary.web.app/';
        });

        // Clear iframe src when modal is hidden
        document.getElementById('fixionaryModal').addEventListener('hidden.bs.modal', () => {
            this.iframe.src = 'about:blank';
        });

        // Add keyboard event listener
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal._isShown) {
                this.modal.hide();
            }
        });
    }

    openModal() {
        this.modal.show();
    }
}

const fixionaryModal = new FixionaryModal(); 