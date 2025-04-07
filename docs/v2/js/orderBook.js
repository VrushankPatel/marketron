class OrderBook {
    constructor() {
        this.bids = [];
        this.asks = [];
        this.loadPersistedData();
        this.initializeEventListeners();
        this.checkForMatches();
        this.render();
    }

    loadPersistedData() {
        const data = persistenceService.loadData();
        if (data && data.orderBook) {
            this.bids = data.orderBook.bids || [];
            this.asks = data.orderBook.asks || [];
            
            this.bids.forEach(bid => bid.timestamp = new Date(bid.timestamp));
            this.asks.forEach(ask => ask.timestamp = new Date(ask.timestamp));
            
            setTimeout(() => {
                this.checkForMatches();
            }, 0);
        }
    }

    persistData() {
        const currentData = persistenceService.loadData() || {};
        currentData.orderBook = {
            bids: this.bids,
            asks: this.asks
        };
        persistenceService.saveData(currentData);
    }

    initializeEventListeners() {
        console.log('Initializing OrderBook event listeners');
        document.addEventListener('newOrder', (e) => this.handleNewOrder(e.detail));
    }

    handleNewOrder(order) {
        console.log('OrderBook received new order:', order);
        const currentMarketPrice = marketData.prices[order.symbol]?.price;

        if (order.orderType === 'MARKET') {
            // Find matching orders for the same symbol
            const matchingAsks = this.asks.filter(ask => ask.symbol === order.symbol);
            const matchingBids = this.bids.filter(bid => bid.symbol === order.symbol);
            
            if (order.side === 'BUY' && matchingAsks.length > 0) {
                order.price = matchingAsks[0].price;
            } else if (order.side === 'SELL' && matchingBids.length > 0) {
                order.price = matchingBids[0].price;
            } else {
                if (!currentMarketPrice) {
                    Swal.fire({
                        title: 'Market Order Error',
                        text: 'Unable to determine market price. Please try again.',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                    return;
                }
                order.price = currentMarketPrice;
            }
            snackbarService.show(`${order.side} ${order.quantity} ${order.symbol} @ ${order.price.toFixed(2)}`, 'info');
        } else {
            if (order.side === 'BUY' && order.price > currentMarketPrice * 1.2) {
                snackbarService.show(`Warning: Buy price is 20% above market price`, 'error');
            } else if (order.side === 'SELL' && order.price < currentMarketPrice * 0.8) {
                snackbarService.show(`Warning: Sell price is 20% below market price`, 'error');
            } else {
                snackbarService.show(`${order.side} ${order.quantity} ${order.symbol} @ ${order.price.toFixed(2)}`, 'info');
            }
        }

        if (order.isCombo) {
            this.handleComboOrder(order);
        } else {
            if (order.side === 'BUY') {
                this.bids.push(order);
                this.bids.sort((a, b) => b.price - a.price);
            } else {
                this.asks.push(order);
                this.asks.sort((a, b) => a.price - b.price);
            }
            document.dispatchEvent(new CustomEvent('orderAccepted', { detail: order }));
        }

        this.render();
        this.checkForMatches();
        this.persistData();
    }

    handleComboOrder(order) {
        order.legs.forEach(leg => {
            const legOrder = new Order(
                leg.symbol,
                order.orderType,
                leg.side,
                order.quantity * leg.ratio,
                order.price,
                order.stopPrice,
                {
                    senderCompId: order.senderCompId,
                    senderSubId: order.senderSubId,
                    targetCompId: order.targetCompId,
                    clOrdId: `${order.clOrdId}_${leg.symbol}`
                }
            );
            
            this.handleNewOrder(legOrder);
        });
    }

    checkForMatches() {
        while (this.bids.length > 0 && this.asks.length > 0) {
            const topBid = this.bids[0];
            const topAsk = this.asks[0];

            if (topBid.symbol !== topAsk.symbol) {
                // Find matching orders for the same symbol
                const matchingAsks = this.asks.findIndex(ask => ask.symbol === topBid.symbol);
                const matchingBids = this.bids.findIndex(bid => bid.symbol === topAsk.symbol);
                
                if (matchingAsks !== -1 && this.bids[0].price >= this.asks[matchingAsks].price) {
                    // Move the matching ask to the top
                    const [matchingAsk] = this.asks.splice(matchingAsks, 1);
                    this.asks.unshift(matchingAsk);
                    continue;
                } else if (matchingBids !== -1 && this.bids[matchingBids].price >= this.asks[0].price) {
                    // Move the matching bid to the top
                    const [matchingBid] = this.bids.splice(matchingBids, 1);
                    this.bids.unshift(matchingBid);
                    continue;
                }
                // If no matches found for different symbols, break the loop
                break;
            }

            if (topBid.price >= topAsk.price) {
                const matchedQuantity = Math.min(topBid.quantity, topAsk.quantity);
                const matchPrice = topAsk.price;

                const trade = {
                    price: matchPrice,
                    quantity: matchedQuantity,
                    timestamp: new Date(),
                    buyOrderId: topBid.orderId,
                    sellOrderId: topAsk.orderId,
                    buyOrderOriginalQty: topBid.quantity + matchedQuantity,
                    sellOrderOriginalQty: topAsk.quantity + matchedQuantity
                };

                document.dispatchEvent(new CustomEvent('newTrade', { detail: trade }));
                document.dispatchEvent(new CustomEvent('tradeExecuted', { detail: {
                    ...trade,
                    symbol: topBid.symbol,
                    side: topBid.side,
                    orderType: topBid.orderType
                }}));

                topBid.quantity -= matchedQuantity;
                topAsk.quantity -= matchedQuantity;

                if (topBid.quantity === 0) this.bids.shift();
                if (topAsk.quantity === 0) this.asks.shift();

                snackbarService.show(
                    `Trade executed: ${matchedQuantity} ${topBid.symbol} @ ${matchPrice.toFixed(2)} ` + 
                    `(${topBid.orderType} ${topBid.side} vs ${topAsk.orderType} ${topAsk.side})`,
                    'success'
                );
            } else {
                break;
            }
        }

        this.render();
    }

    render() {
        console.log('Rendering OrderBook - Bids:', this.bids, 'Asks:', this.asks);
        const bidsContainer = document.getElementById('bids');
        const asksContainer = document.getElementById('asks');

        bidsContainer.innerHTML = '<h3>Bids</h3>' + this.bids.map(order => `
            <div class="order-item">
                <span class="order-symbol">${order.symbol}</span>
                <span class="order-price">${order.price ? order.price.toFixed(2) : 'MKT'}</span>
                <span class="order-quantity">${order.quantity}</span>
            </div>
        `).join('');

        asksContainer.innerHTML = '<h3>Asks</h3>' + this.asks.map(order => `
            <div class="order-item">
                <span class="order-symbol">${order.symbol}</span>
                <span class="order-price">${order.price ? order.price.toFixed(2) : 'MKT'}</span>
                <span class="order-quantity">${order.quantity}</span>
            </div>
        `).join('');
    }

    /**
     * @method findOrderById
     * @description Finds an order by its ID
     * @param {string} orderId - The ID of the order to find
     * @returns {Order|null} The found order or null
     */
    findOrderById(orderId) {
        return [...this.bids, ...this.asks].find(order => order.orderId === orderId);
    }
}

const orderBook = new OrderBook(); 