class SimulationService {
    constructor() {
        this.isSimulating = false;
        this.simulationInterval = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const simulationButton = document.getElementById('simulationButton');
        simulationButton.addEventListener('click', () => this.toggleSimulation());
    }

    toggleSimulation() {
        this.isSimulating = !this.isSimulating;
        const button = document.getElementById('simulationButton');
        
        if (this.isSimulating) {
            button.classList.add('active');
            this.startSimulation();
            snackbarService.show('Trading simulation started', 'info');
        } else {
            button.classList.remove('active');
            this.stopSimulation();
            snackbarService.show('Trading simulation stopped', 'info');
        }
    }

    startSimulation() {
        this.simulateOrder(); // Initial order
        this.scheduleNextOrder();
    }

    stopSimulation() {
        if (this.simulationInterval) {
            clearTimeout(this.simulationInterval);
            this.simulationInterval = null;
        }
    }

    scheduleNextOrder() {
        if (!this.isSimulating) return;
        
        const delay = Math.random() * 4000 + 1000; // Random delay between 1-5 seconds
        this.simulationInterval = setTimeout(() => {
            this.simulateOrder();
            this.scheduleNextOrder();
        }, delay);
    }

    simulateOrder() {
        const symbol = MARKET_SYMBOLS[Math.floor(Math.random() * MARKET_SYMBOLS.length)];
        const side = Math.random() < 0.5 ? 'BUY' : 'SELL';
        const orderType = Math.random() < 0.7 ? 'LIMIT' : 'MARKET';
        const quantity = Math.floor(Math.random() * 100) + 1;
        
        const currentPrice = marketData.prices[symbol]?.price || 100;
        let price = null;
        
        if (orderType === 'LIMIT') {
            const priceVariation = currentPrice * (Math.random() * 0.1); // 10% variation
            if (side === 'BUY') {
                price = currentPrice - priceVariation;
            } else {
                price = currentPrice + priceVariation;
            }
            price = Math.round(price * 100) / 100; // Round to 2 decimal places
        }

        const order = new Order(
            symbol,
            orderType,
            side,
            quantity,
            price,
            null,
            {
                senderCompId: 'SIM000001',
                senderSubId: 'AUTO',
                targetCompId: 'MKT000001'
            }
        );

        document.dispatchEvent(new CustomEvent('newOrder', { detail: order }));
        document.dispatchEvent(new CustomEvent('orderSubmitted', { detail: order }));
    }
}

const simulationService = new SimulationService();
