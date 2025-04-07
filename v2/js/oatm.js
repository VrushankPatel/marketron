class OATM {
    constructor() {
        this.container = document.getElementById('oatmTimeline');
        this.entries = [];
        this.loadFromStorage();
        this.setupEventListeners();
    }

    loadFromStorage() {
        const storedEntries = localStorage.getItem('oatmEntries');
        if (storedEntries) {
            this.entries = JSON.parse(storedEntries);
            // Sort entries by timestamp in ascending order (oldest first)
            this.entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            this.entries.forEach(entry => this.addTimelineEntry(entry, false));
        }
    }

    setupEventListeners() {
        document.addEventListener('orderSubmitted', (e) => {
            const entry = {
                type: 'order',
                direction: 'client-to-marketron',
                data: e.detail,
                timestamp: new Date().toISOString(),
                orderId: e.detail.orderId,
                sequence: this.entries.length
            };
            this.entries.push(entry);  // Add to end of array
            this.addTimelineEntry(entry, true);
        });

        document.addEventListener('orderAccepted', (e) => {
            const entry = {
                type: 'order',
                direction: 'marketron-to-client',
                data: e.detail,
                timestamp: new Date().toISOString(),
                orderId: e.detail.orderId,
                sequence: this.entries.length
            };
            this.entries.push(entry);
            this.addTimelineEntry(entry, true);
        });

        document.addEventListener('tradeExecuted', (e) => {
            const entry = {
                type: 'trade',
                direction: 'marketron-to-client',
                data: e.detail,
                timestamp: new Date().toISOString(),
                orderId: e.detail.orderId,
                sequence: this.entries.length
            };
            this.entries.push(entry);
            this.addTimelineEntry(entry, true);
        });

        document.addEventListener('resetMarketron', () => {
            this.container.innerHTML = '';
            this.entries = [];
            localStorage.removeItem('oatmEntries');
        });
    }

    addTimelineEntry(entry, shouldSave = true) {
        const entryElement = document.createElement('div');
        entryElement.className = 'timeline-entry';
        
        const content = document.createElement('div');
        content.className = `timeline-content ${entry.direction === 'client-to-marketron' ? 'left' : 'right'}`;
        
        if (entry.type === 'order') {
            if (entry.direction === 'client-to-marketron') {
                content.setAttribute('data-type', entry.data.side.toLowerCase() + '-order');
            } else {
                content.setAttribute('data-type', entry.data.side.toLowerCase() + '-accepted');
            }
        } else if (entry.type === 'trade') {
            content.setAttribute('data-type', 'trade');
        }
        
        const timestamp = new Date(entry.timestamp).toLocaleTimeString();
        const escapedData = JSON.stringify(entry.data).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
        
        if (entry.type === 'order') {
            content.innerHTML = `
                <div class="entry-header">
                    <span class="entry-time">${timestamp}</span>
                    <span class="entry-type">Order ${entry.direction === 'client-to-marketron' ? 'Submitted' : 'Accepted'}</span>
                </div>
                <div class="entry-details">
                    <span>${entry.data.symbol}</span>
                    <span>${entry.data.side} ${entry.data.quantity} @ ${entry.data.price || 'MARKET'}</span>
                </div>
                <div class="order-id">Order ID: ${entry.orderId || entry.data.orderId || 'N/A'}</div>
                ${entry.direction === 'marketron-to-client' ? `
                    <button class="execution-report-btn" data-report='${escapedData}' onclick="oatm.showExecutionReport(JSON.parse(this.dataset.report))">
                        View Report
                    </button>
                ` : ''}
            `;
        } else if (entry.type === 'trade') {
            content.innerHTML = `
                <div class="entry-header">
                    <span class="entry-time">${timestamp}</span>
                    <span class="entry-type">Trade Executed</span>
                </div>
                <div class="entry-details">
                    <span>${entry.data.symbol}</span>
                    <span>${entry.data.quantity} @ ${entry.data.price}</span>
                </div>
                <div class="order-id">Order ID: ${entry.orderId || entry.data.orderId || 'N/A'}</div>
                <button class="execution-report-btn" data-report='${escapedData}' onclick="oatm.showTradeReport(JSON.parse(this.dataset.report))">
                    Trade Report
                </button>
            `;
        }

        const arrow = document.createElement('div');
        arrow.className = `timeline-arrow arrow-${entry.direction} ${entry.type === 'trade' ? 'arrow-trade' : ''}`;

        if (entry.direction === 'client-to-marketron') {
            entryElement.appendChild(content);
            entryElement.appendChild(arrow);
        } else {
            entryElement.appendChild(arrow);
            entryElement.appendChild(content);
        }

        // Insert at the beginning to show newest at top
        this.container.insertBefore(entryElement, this.container.firstChild);

        if (shouldSave) {
            this.saveToStorage();
        }
    }

    showExecutionReport(data) {
        const modal = document.createElement('div');
        modal.className = 'execution-modal';
        modal.innerHTML = `
            <div class="execution-modal-content">
                <span class="close-modal" onclick="this.closest('.execution-modal').remove()">&times;</span>
                <h2>Execution Report</h2>
                <div class="trade-report">
                    <div class="trade-section">
                        <h3>Order Details</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Symbol</label>
                                <span>${data.symbol}</span>
                            </div>
                            <div class="detail-item">
                                <label>Side</label>
                                <span>${data.side}</span>
                            </div>
                            <div class="detail-item">
                                <label>Quantity</label>
                                <span>${data.quantity}</span>
                            </div>
                            <div class="detail-item">
                                <label>Price</label>
                                <span>${data.price || 'MARKET'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Order Type</label>
                                <span>${data.orderType}</span>
                            </div>
                            <div class="detail-item">
                                <label>Order ID</label>
                                <span>${data.orderId || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Time</label>
                                <span>${new Date(data.timestamp).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showTradeReport(data) {
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
                                            <span>${data.symbol}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Quantity:</label>
                                            <span>${data.quantity}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Price:</label>
                                            <span>${data.price}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Time:</label>
                                            <span>${new Date(data.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="trade-section buy-details">
                                    <h6>Buy Order Details</h6>
                                    <div class="detail-grid">
                                        <div class="detail-item">
                                            <label>Order ID:</label>
                                            <span>${data.buyOrderId || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Order Type:</label>
                                            <span>${data.buyOrder?.orderType || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Original Quantity:</label>
                                            <span>${data.buyOrderOriginalQty || data.quantity || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Limit Price:</label>
                                            <span>${data.buyOrder?.price ? data.buyOrder.price.toFixed(2) : 'MARKET'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Stop Price:</label>
                                            <span>${data.buyOrder?.stopPrice ? data.buyOrder.stopPrice.toFixed(2) : 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Order Time:</label>
                                            <span>${data.buyOrder?.timestamp ? new Date(data.buyOrder.timestamp).toLocaleString() : 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Sender Comp ID:</label>
                                            <span>${data.buyOrder?.senderCompId || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Client Order ID:</label>
                                            <span>${data.buyOrder?.clOrdId || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Sender Sub ID:</label>
                                            <span>${data.buyOrder?.senderSubId || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Target Comp ID:</label>
                                            <span>${data.buyOrder?.targetCompId || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="trade-section sell-details">
                                    <h6>Sell Order Details</h6>
                                    <div class="detail-grid">
                                        <div class="detail-item">
                                            <label>Order ID:</label>
                                            <span>${data.sellOrderId || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Order Type:</label>
                                            <span>${data.sellOrder?.orderType || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Original Quantity:</label>
                                            <span>${data.sellOrderOriginalQty || data.quantity || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Limit Price:</label>
                                            <span>${data.sellOrder?.price ? data.sellOrder.price.toFixed(2) : 'MARKET'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Stop Price:</label>
                                            <span>${data.sellOrder?.stopPrice ? data.sellOrder.stopPrice.toFixed(2) : 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Order Time:</label>
                                            <span>${data.sellOrder?.timestamp ? new Date(data.sellOrder.timestamp).toLocaleString() : 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Sender Comp ID:</label>
                                            <span>${data.sellOrder?.senderCompId || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Client Order ID:</label>
                                            <span>${data.sellOrder?.clOrdId || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Sender Sub ID:</label>
                                            <span>${data.sellOrder?.senderSubId || 'N/A'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Target Comp ID:</label>
                                            <span>${data.sellOrder?.targetCompId || 'N/A'}</span>
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

    saveToStorage() {
        localStorage.setItem('oatmEntries', JSON.stringify(this.entries));
    }
}

// Initialize OATM
const oatm = new OATM(); 