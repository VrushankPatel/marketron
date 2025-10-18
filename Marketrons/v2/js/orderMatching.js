/**
 * @class OrderMatching
 * @description Handles trade matching and execution
 * @author Vrushank Patel
 */
class OrderMatching {
    /**
     * @constructor
     * @author Vrushank Patel
     */
    constructor() {
        this.trades = [];
        this.loadPersistedData();
        this.initializeEventListeners();
        this.render();
    }

    /**
     * @method initializeEventListeners
     * @description Sets up event listeners for trade events
     * @author Vrushank Patel
     */
    initializeEventListeners() {
        document.addEventListener('newTrade', (e) => this.handleNewTrade(e.detail));
    }

    /**
     * @method handleNewTrade
     * @description Processes new trades and updates the display
     * @param {Object} trade - The trade object containing trade details
     * @author Vrushank Patel
     */
    handleNewTrade(trade) {
        // Find the original orders
        const buyOrder = orderBook.findOrderById(trade.buyOrderId);
        const sellOrder = orderBook.findOrderById(trade.sellOrderId);
        
        // Enhance trade object with order details
        trade.buyOrder = buyOrder;
        trade.sellOrder = sellOrder;
        
        this.trades.push(trade);
        this.render();
        this.persistData();
    }

    /**
     * @method render
     * @description Renders the trades list
     * @author Vrushank Patel
     */
    render() {
        const container = document.getElementById('tradesContainer');
        container.innerHTML = this.trades.map((trade, index) => `
            <div class="trade-card">
                <div class="trade-summary">
                    <div class="trade-header">
                        <span class="trade-symbol">${trade.buyOrder?.symbol || 'Unknown'}</span>
                        <span class="trade-time">${trade.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <div class="trade-details">
                        <span class="trade-quantity">${trade.quantity}</span>
                        <span class="trade-at">@</span>
                        <span class="trade-price">${trade.price.toFixed(2)}</span>
                    </div>
                </div>
                <button class="view-trade-btn" onclick="orderMatching.showTradeDetails(${index})">
                    View Details
                </button>
            </div>
        `).join('');
    }

    loadPersistedData() {
        const data = persistenceService.loadData();
        if (data && data.trades) {
            this.trades = data.trades || [];
            this.trades.forEach(trade => trade.timestamp = new Date(trade.timestamp));
        }
    }

    persistData() {
        const currentData = persistenceService.loadData() || {};
        currentData.trades = this.trades;
        persistenceService.saveData(currentData);
    }

    showTradeDetails(index) {
        const trade = this.trades[index];
        const modalContent = `
            <div class="modal fade" id="tradeModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Trade Capture Report</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="trade-report">
                                <div class="trade-section main-details">
                                    <h6>Trade Details</h6>
                                    <div class="detail-grid">
                                        <div class="detail-item">
                                            <label>Symbol:</label>
                                            <span>${trade.buyOrder?.symbol || 'Unknown'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Quantity:</label>
                                            <span>${trade.quantity}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Price:</label>
                                            <span>${trade.price.toFixed(2)}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Time:</label>
                                            <span>${trade.timestamp.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="trade-section buy-details">
                                    <h6>Buy Order Details</h6>
                                    <div class="detail-grid">
                                        <div class="detail-item">
                                            <label>Order ID:</label>
                                            <span>${trade.buyOrder?.orderId || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Order Type:</label>
                                            <span>${trade.buyOrder?.orderType || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Original Quantity:</label>
                                            <span>${trade.buyOrderOriginalQty || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Limit Price:</label>
                                            <span>${trade.buyOrder?.price ? trade.buyOrder.price.toFixed(2) : 'MARKET'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Stop Price:</label>
                                            <span>${trade.buyOrder?.stopPrice ? trade.buyOrder.stopPrice.toFixed(2) : 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Order Time:</label>
                                            <span>${trade.buyOrder?.timestamp.toLocaleString() || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Sender Comp ID:</label>
                                            <span>${trade.buyOrder?.senderCompId || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Client Order ID:</label>
                                            <span>${trade.buyOrder?.clOrdId || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Sender Sub ID:</label>
                                            <span>${trade.buyOrder?.senderSubId || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Target Comp ID:</label>
                                            <span>${trade.buyOrder?.targetCompId || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="trade-section sell-details">
                                    <h6>Sell Order Details</h6>
                                    <div class="detail-grid">
                                        <div class="detail-item">
                                            <label>Order ID:</label>
                                            <span>${trade.sellOrder?.orderId || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Order Type:</label>
                                            <span>${trade.sellOrder?.orderType || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Original Quantity:</label>
                                            <span>${trade.sellOrderOriginalQty || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Limit Price:</label>
                                            <span>${trade.sellOrder?.price ? trade.sellOrder.price.toFixed(2) : 'MARKET'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Stop Price:</label>
                                            <span>${trade.sellOrder?.stopPrice ? trade.sellOrder.stopPrice.toFixed(2) : 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Order Time:</label>
                                            <span>${trade.sellOrder?.timestamp.toLocaleString() || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Sender Comp ID:</label>
                                            <span>${trade.sellOrder?.senderCompId || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Client Order ID:</label>
                                            <span>${trade.sellOrder?.clOrdId || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Sender Sub ID:</label>
                                            <span>${trade.sellOrder?.senderSubId || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Target Comp ID:</label>
                                            <span>${trade.sellOrder?.targetCompId || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('tradeModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add new modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalContent);
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('tradeModal'));
        modal.show();
    }
}

// Marketron entry point
const orderMatching = new OrderMatching(); 