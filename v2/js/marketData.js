/**
 * @class MarketData
 * @description Handles market data simulation and chart rendering
 * @author Vrushank Patel
 */
class MarketData {
    /**
     * @constructor
     * @author Vrushank Patel
     */
    constructor() {
        this.symbols = MARKET_SYMBOLS;
        this.prices = {};
        this.priceHistory = {};
        this.HISTORY_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
        this.canvas = document.getElementById('priceChart');
        this.ctx = this.canvas.getContext('2d');
        this.selectedSymbol = this.symbols[0];
        this.timeframe = 15;
        this.loadPersistedData();

        // Add initial price data for all symbols
        const initialPrices = {
            'AAPL': 150.0,
            'GOOGL': 2800.0,
            'MSFT': 300.0,
            'AMZN': 3300.0,
            'TSLA': 750.0,
            'META': 330.0,
            'NFLX': 500.0,
            'NVDA': 450.0,
            'AMD': 120.0
        };

        // Initialize market data for each symbol
        MARKET_SYMBOLS.forEach(symbol => {
            if (!this.prices[symbol]) {
                this.prices[symbol] = {
                    price: initialPrices[symbol],
                    previousPrice: initialPrices[symbol],
                    change: 0
                };
            }
            if (!this.priceHistory[symbol]) {
                this.priceHistory[symbol] = [];
            }
        });

        this.startSimulation();
        this.initializeChart();
        this.initializeTimeButtons();
    }

    /**
     * @method loadPersistedData
     * @description Loads persisted price data from localStorage
     * @author Vrushank Patel
     */
    loadPersistedData() {
        const data = persistenceService.loadData();
        if (data && data.marketData) {
            this.prices = data.marketData.prices || {};
            this.priceHistory = data.marketData.priceHistory || {};
            
            // Reconstruct Date objects for timestamps
            Object.keys(this.priceHistory).forEach(symbol => {
                this.priceHistory[symbol] = this.priceHistory[symbol].map(item => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                }));
                
                // Clean up old data (older than 15 minutes)
                const cutoffTime = new Date(Date.now() - this.HISTORY_DURATION);
                this.priceHistory[symbol] = this.priceHistory[symbol].filter(
                    p => p.timestamp > cutoffTime
                );
            });
        }
    }

    /**
     * @method persistData
     * @description Saves price data to localStorage
     * @author Vrushank Patel
     */
    persistData() {
        const currentData = persistenceService.loadData() || {};
        // Clean up old data before persisting
        Object.keys(this.priceHistory).forEach(symbol => {
            const cutoffTime = new Date(Date.now() - this.HISTORY_DURATION);
            this.priceHistory[symbol] = this.priceHistory[symbol].filter(
                p => p.timestamp > cutoffTime
            );
        });

        currentData.marketData = {
            prices: this.prices,
            priceHistory: this.priceHistory
        };
        persistenceService.saveData(currentData);
    }

    /**
     * @method initializeChart
     * @description Sets up the chart UI and event listeners
     * @author Vrushank Patel
     */
    initializeChart() {
        const selector = document.getElementById('chartSymbol');
        this.symbols.forEach(symbol => {
            const option = document.createElement('option');
            option.value = option.textContent = symbol;
            selector.appendChild(option);
        });

        selector.addEventListener('change', (e) => {
            this.selectedSymbol = e.target.value;
            this.renderChart();
        });

        document.querySelectorAll('.time-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.timeframe = parseInt(e.target.dataset.time);
                document.querySelectorAll('.time-button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderChart();
            });
        });

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    /**
     * @method resizeCanvas
     * @description Adjusts canvas size based on container dimensions
     * @author Vrushank Patel
     */
    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    /**
     * @method startSimulation
     * @description Begins price simulation with periodic updates
     * @author Vrushank Patel
     */
    startSimulation() {
        setInterval(() => {
            this.symbols.forEach(symbol => {
                const currentPrice = this.prices[symbol].price;
                const change = (Math.random() - 0.5) * 2;
                const newPrice = currentPrice + change;
                
                this.prices[symbol] = {
                    price: newPrice,
                    change: change
                };
                
                this.priceHistory[symbol].push({
                    price: newPrice,
                    timestamp: new Date()
                });
                
                const cutoffTime = new Date(Date.now() - this.HISTORY_DURATION);
                this.priceHistory[symbol] = this.priceHistory[symbol].filter(
                    p => p.timestamp > cutoffTime
                );
            });
            
            this.render();
            this.renderChart();
            this.persistData();
        }, 1000);
    }

    /**
     * @method renderChart
     * @description Renders the price chart for the selected symbol
     * @author Vrushank Patel
     */
    renderChart() {
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const ctx = this.ctx;
        const data = this.priceHistory[this.selectedSymbol];
        
        // Clear the canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = isDarkMode ? '#1a1a1a' : '#ffffff';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!data || data.length < 2) return;

        // Filter data based on timeframe
        const cutoffTime = new Date(Date.now() - (this.timeframe * 60 * 1000));
        const filteredData = data.filter(d => d.timestamp > cutoffTime);
        
        const prices = filteredData.map(d => d.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;
        
        // Draw grid
        ctx.strokeStyle = isDarkMode ? '#444' : '#eee';
        ctx.lineWidth = 1;
        
        // Vertical grid lines
        for (let i = 0; i < 10; i++) {
            const x = (this.canvas.width / 9) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let i = 0; i < 5; i++) {
            const y = (this.canvas.height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
        
        // Draw price line
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, isDarkMode ? '#00cccc' : '#00ffff');
        gradient.addColorStop(1, isDarkMode ? '#2ecc71' : '#32cd32');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        filteredData.forEach((point, i) => {
            const x = (i / (filteredData.length - 1)) * this.canvas.width;
            const y = this.canvas.height - 
                     ((point.price - minPrice) / priceRange) * this.canvas.height;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw time labels
        ctx.textAlign = 'center';
        ctx.fillStyle = isDarkMode ? '#777' : '#888';
        const timeLabels = Math.min(5, filteredData.length);
        for (let i = 0; i < timeLabels; i++) {
            const x = this.canvas.width - (this.canvas.width / (timeLabels - 1)) * i;
            const dataPoint = filteredData[Math.floor((filteredData.length - 1) * (1 - i / (timeLabels - 1)))];
            if (dataPoint) {
                const time = dataPoint.timestamp;
                ctx.fillText(time.toLocaleTimeString(), x, this.canvas.height - 5);
            }
        }
        
        // Draw price labels
        ctx.textAlign = 'right';
        ctx.fillStyle = isDarkMode ? '#e6c200' : '#ffd700';
        for (let i = 0; i <= 4; i++) {
            const price = minPrice + (priceRange * (i / 4));
            const y = this.canvas.height - (this.canvas.height * (i / 4));
            ctx.fillText(price.toFixed(2), this.canvas.width - 5, y + 4);
        }
        
        // Draw current price
        const currentPrice = filteredData[filteredData.length - 1].price;
        ctx.fillStyle = isDarkMode ? '#e1e1e1' : '#000000';
        ctx.fillText(`Current: ${currentPrice.toFixed(2)}`, this.canvas.width - 5, 20);
    }

    /**
     * @method render
     * @description Renders the market data ticker
     * @author Vrushank Patel
     */
    render() {
        const container = document.getElementById('tickerContainer');
        container.innerHTML = this.symbols.map(symbol => `
            <div class="ticker-item">
                <span class="symbol">${symbol}</span>
                <span class="price">${this.prices[symbol].price.toFixed(2)}</span>
                <span class="change ${this.prices[symbol].change >= 0 ? 'positive' : 'negative'}">
                    ${this.prices[symbol].change.toFixed(2)}
                </span>
            </div>
        `).join('');
    }

    initializeTimeButtons() {
        const timeButtons = document.querySelectorAll('.time-button');
        timeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                timeButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.timeframe = parseInt(e.target.getAttribute('data-time'));
                this.renderChart();
            });
        });
    }
}

const marketData = new MarketData(); 