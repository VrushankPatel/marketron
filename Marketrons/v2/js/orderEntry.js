class Order {
    constructor(symbol, orderType, side, quantity, price, stopPrice = null, orderConfig = {}) {
        this.orderId = Math.random().toString(36).substr(2, 9);
        this.symbol = symbol;
        this.orderType = orderType;
        this.side = side;
        this.quantity = quantity;
        this.price = price;
        this.stopPrice = stopPrice;
        this.timestamp = new Date();
        this.status = 'NEW';
        
        this.senderCompId = orderConfig.senderCompId || '';
        this.senderSubId = orderConfig.senderSubId || '';
        this.targetCompId = orderConfig.targetCompId || '';
        this.clOrdId = orderConfig.clOrdId || this.generateClOrdId();
        
        this.isCombo = orderConfig.isCombo || false;
        this.legs = orderConfig.legs || [];
    }

    generateClOrdId() {
        return `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }
}

class OrderLeg {
    constructor(symbol, ratio, side) {
        this.symbol = symbol;
        this.ratio = ratio;
        this.side = side;
    }
}

class OrderEntry {
    constructor() {
        this.form = document.getElementById('orderForm');
        this.initializeEventListeners();
        this.comboLegs = [];
        this.initializeSymbolDropdown();
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.initializeLegSymbolDropdown();
        
        document.getElementById('orderType').addEventListener('change', (e) => {
            const priceField = document.querySelector('.price-field');
            const stopPriceField = document.querySelector('.stop-price-field');
            const priceInput = document.getElementById('price');
            const stopPriceInput = document.getElementById('stopPrice');
            
            switch(e.target.value) {
                case 'MARKET':
                    priceField.style.display = 'none';
                    stopPriceField.style.display = 'none';
                    priceInput.required = false;
                    stopPriceInput.required = false;
                    break;
                case 'LIMIT':
                    priceField.style.display = 'block';
                    stopPriceField.style.display = 'none';
                    priceInput.required = true;
                    stopPriceInput.required = false;
                    break;
                case 'STOP':
                    priceField.style.display = 'none';
                    stopPriceField.style.display = 'block';
                    priceInput.required = false;
                    stopPriceInput.required = true;
                    break;
                case 'STOP_LIMIT':
                    priceField.style.display = 'block';
                    stopPriceField.style.display = 'block';
                    priceInput.required = true;
                    stopPriceInput.required = true;
                    break;
            }
        });

        document.getElementById('orderCategory').addEventListener('change', (e) => {
            const comboFields = document.querySelector('.combo-fields');
            comboFields.style.display = e.target.value === 'COMBO' ? 'block' : 'none';
        });

        document.getElementById('addLeg').addEventListener('click', (e) => {
            e.preventDefault();
            this.addComboLeg();
        });
    }

    /**
     * @method initializeLegSymbolDropdown
     * @description Populates the leg symbol dropdown with available symbols
     * @author Vrushank Patel
     */
    initializeLegSymbolDropdown() {
        const legSymbolSelect = document.getElementById('legSymbol');
        legSymbolSelect.innerHTML = '';
        
        const defaultOption = new Option('Select a symbol', '', true, true);
        defaultOption.disabled = true;
        legSymbolSelect.add(defaultOption);
        
        MARKET_SYMBOLS.forEach(symbol => {
            const option = new Option(symbol, symbol);
            legSymbolSelect.add(option);
        });
    }

    addComboLeg() {
        const leg = {
            symbol: document.getElementById('legSymbol').value,
            ratio: parseInt(document.getElementById('legRatio').value),
            side: document.getElementById('legSide').value
        };
        
        if (!leg.symbol) {
            Swal.fire({
                title: 'Invalid Symbol',
                text: 'Please select a symbol for the combo leg',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
        
        this.comboLegs.push(leg);
        this.renderComboLegs();
        
        document.getElementById('legSymbol').selectedIndex = 0;
        document.getElementById('legRatio').value = '1';
    }

    renderComboLegs() {
        const container = document.getElementById('comboLegsContainer');
        container.innerHTML = this.comboLegs.map((leg, index) => `
            <div class="combo-leg">
                ${leg.symbol} (${leg.ratio}:1) ${leg.side}
                <button onclick="orderEntry.removeLeg(${index})">Remove</button>
            </div>
        `).join('');
    }

    removeLeg(index) {
        this.comboLegs.splice(index, 1);
        this.renderComboLegs();
    }

    handleSubmit(e) {
        e.preventDefault();
        
        // Validate required fields
        const requiredFields = ['symbol', 'orderType', 'side', 'quantity'];
        const orderType = document.getElementById('orderType').value;
        
        // Add price field validation for LIMIT orders
        if (orderType === 'LIMIT' || orderType === 'STOP_LIMIT') {
            requiredFields.push('price');
        }
        
        // Add stop price validation for STOP orders
        if (orderType === 'STOP' || orderType === 'STOP_LIMIT') {
            requiredFields.push('stopPrice');
        }
        
        // Check all required fields
        for (const field of requiredFields) {
            const element = document.getElementById(field);
            if (!element.value) {
                Swal.fire({
                    title: 'Validation Error',
                    text: `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
                return;
            }
        }
        
        const symbol = document.getElementById('symbol').value.toUpperCase();
        console.log('Submitting order for symbol:', symbol);
        
        if (!symbol || !this.validateSymbol(symbol)) {
            Swal.fire({
                title: 'Invalid Symbol',
                text: 'Please select a valid trading symbol',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        const orderConfig = {
            senderCompId: document.getElementById('senderCompId').value,
            senderSubId: document.getElementById('senderSubId').value,
            targetCompId: document.getElementById('targetCompId').value,
            isCombo: document.getElementById('orderCategory').value === 'COMBO',
            legs: this.comboLegs
        };

        // Validate combo order has at least one leg
        if (orderConfig.isCombo && this.comboLegs.length === 0) {
            Swal.fire({
                title: 'Validation Error',
                text: 'Combo orders must have at least one leg',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        const order = new Order(
            symbol,
            document.getElementById('orderType').value,
            document.getElementById('side').value,
            parseFloat(document.getElementById('quantity').value),
            parseFloat(document.getElementById('price').value) || null,
            parseFloat(document.getElementById('stopPrice').value) || null,
            orderConfig
        );

        console.log('Created order:', order);
        document.dispatchEvent(new CustomEvent('newOrder', { detail: order }));
        document.dispatchEvent(new CustomEvent('orderSubmitted', { detail: order }));

        this.form.reset();
        this.comboLegs = [];
        this.renderComboLegs();
        
        this.initializeSymbolDropdown();
        this.initializeLegSymbolDropdown();
        
        // snackbarService.show('Order placed successfully');
    }

    /**
     * @method initializeSymbolDropdown
     * @description Populates the symbol dropdown with available symbols
     * @author Vrushank Patel
     */
    initializeSymbolDropdown() {
        const symbolSelect = document.getElementById('symbol');
        symbolSelect.innerHTML = '';
        
        const defaultOption = new Option('Select a symbol', '', true, true);
        defaultOption.disabled = true;
        symbolSelect.add(defaultOption);
        
        MARKET_SYMBOLS.forEach(symbol => {
            const option = new Option(symbol, symbol);
            symbolSelect.add(option);
        });
    }

    /**
     * @method validateSymbol
     * @description Validates if the symbol is available for trading
     * @param {string} symbol - Symbol to validate
     * @returns {boolean} Whether the symbol is valid
     * @author Vrushank Patel
     */
    validateSymbol(symbol) {
        return MARKET_SYMBOLS.includes(symbol.toUpperCase());
    }

    /**
     * @method toggleFixFields
     * @description Toggles the visibility of FIX Protocol fields
     * @param {Event} event - The click event
     */
    toggleFixFields(event) {
        const fixFields = event.currentTarget.closest('.fix-fields');
        fixFields.classList.toggle('collapsed');
    }
}

const orderEntry = new OrderEntry(); 