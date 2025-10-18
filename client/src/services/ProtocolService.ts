import { FIXMessage } from '@/types/trading';

export class ProtocolService {
  private fixSession = {
    senderCompId: 'TRADEFLOW',
    targetCompId: 'EXCHANGE',
    msgSeqNum: 1,
    isLoggedOn: false,
  };

  private ouchSession = {
    username: 'TRADEFLOW',
    password: 'PASSWORD',
    sessionId: '',
    isLoggedOn: false,
  };

  constructor() {
    this.initializeSessions();
  }

  private initializeSessions(): void {
    // Simulate FIX logon
    setTimeout(() => {
      this.fixSession.isLoggedOn = true;
      console.log('FIX session established');
    }, 1000);

    // Simulate OUCH logon
    setTimeout(() => {
      this.ouchSession.isLoggedOn = true;
      this.ouchSession.sessionId = `OUCH_${Date.now()}`;
      console.log('OUCH session established');
    }, 1500);
  }

  // FIX Protocol Messages
  createNewOrderSingle(orderData: {
    clOrdId: string;
    symbol: string;
    side: '1' | '2'; // 1=Buy, 2=Sell
    ordType: '1' | '2' | '3' | '4'; // 1=Market, 2=Limit, 3=Stop, 4=StopLimit
    orderQty: number;
    price?: number;
    stopPx?: number;
    timeInForce: '0' | '1' | '3' | '4'; // 0=Day, 1=GTC, 3=IOC, 4=FOK
  }): FIXMessage {
    const fields = {
      '8': 'FIX.4.4', // BeginString
      '35': 'D', // MsgType (NewOrderSingle)
      '49': this.fixSession.senderCompId, // SenderCompId
      '56': this.fixSession.targetCompId, // TargetCompId
      '34': this.fixSession.msgSeqNum.toString(), // MsgSeqNum
      '52': new Date().toISOString(), // SendingTime
      '11': orderData.clOrdId, // ClOrdID
      '55': orderData.symbol, // Symbol
      '54': orderData.side, // Side
      '40': orderData.ordType, // OrdType
      '38': orderData.orderQty.toString(), // OrderQty
      '59': orderData.timeInForce, // TimeInForce
    };

    if (orderData.price) {
      fields['44'] = orderData.price.toString(); // Price
    }

    if (orderData.stopPx) {
      fields['99'] = orderData.stopPx.toString(); // StopPx
    }

    const rawMessage = this.buildFIXMessage(fields);
    this.fixSession.msgSeqNum++;

    return {
      msgType: 'D',
      fields,
      rawMessage,
      timestamp: Date.now(),
    };
  }

  createOrderCancelRequest(orderId: string, clOrdId: string, origClOrdId: string): FIXMessage {
    const fields = {
      '8': 'FIX.4.4',
      '35': 'F', // OrderCancelRequest
      '49': this.fixSession.senderCompId,
      '56': this.fixSession.targetCompId,
      '34': this.fixSession.msgSeqNum.toString(),
      '52': new Date().toISOString(),
      '11': clOrdId,
      '41': origClOrdId, // OrigClOrdID
      '37': orderId, // OrderID
    };

    const rawMessage = this.buildFIXMessage(fields);
    this.fixSession.msgSeqNum++;

    return {
      msgType: 'F',
      fields,
      rawMessage,
      timestamp: Date.now(),
    };
  }

  createOrderCancelReplaceRequest(orderData: {
    orderId: string;
    origClOrdId: string;
    clOrdId: string;
    symbol: string;
    side: '1' | '2';
    ordType: '1' | '2' | '3' | '4';
    orderQty: number;
    price?: number;
    stopPx?: number;
  }): FIXMessage {
    const fields = {
      '8': 'FIX.4.4',
      '35': 'G', // OrderCancelReplaceRequest
      '49': this.fixSession.senderCompId,
      '56': this.fixSession.targetCompId,
      '34': this.fixSession.msgSeqNum.toString(),
      '52': new Date().toISOString(),
      '11': orderData.clOrdId,
      '37': orderData.orderId,
      '41': orderData.origClOrdId,
      '55': orderData.symbol,
      '54': orderData.side,
      '40': orderData.ordType,
      '38': orderData.orderQty.toString(),
    };

    if (orderData.price) {
      fields['44'] = orderData.price.toString();
    }
    if (orderData.stopPx) {
      fields['99'] = orderData.stopPx.toString();
    }

    const rawMessage = this.buildFIXMessage(fields);
    this.fixSession.msgSeqNum++;

    return {
      msgType: 'G',
      fields,
      rawMessage,
      timestamp: Date.now(),
    };
  }

  createOrderStatusRequest(orderId: string, clOrdId: string, symbol: string): FIXMessage {
    const fields = {
      '8': 'FIX.4.4',
      '35': 'H', // OrderStatusRequest
      '49': this.fixSession.senderCompId,
      '56': this.fixSession.targetCompId,
      '34': this.fixSession.msgSeqNum.toString(),
      '52': new Date().toISOString(),
      '11': clOrdId,
      '37': orderId,
      '55': symbol,
      '117': `STATUS_${Date.now()}`,
    };

    const rawMessage = this.buildFIXMessage(fields);
    this.fixSession.msgSeqNum++;

    return {
      msgType: 'H',
      fields,
      rawMessage,
      timestamp: Date.now(),
    };
  }

  createMarketDataRequest(symbols: string[]): FIXMessage {
    const fields = {
      '8': 'FIX.4.4',
      '35': 'V', // MarketDataRequest
      '49': this.fixSession.senderCompId,
      '56': this.fixSession.targetCompId,
      '34': this.fixSession.msgSeqNum.toString(),
      '52': new Date().toISOString(),
      '262': `MDR_${Date.now()}`, // MDReqID
      '263': '1', // SubscriptionRequestType (Snapshot + Updates)
      '264': '1', // MarketDepth (Top of Book)
      '146': symbols.length.toString(), // NoRelatedSym
    };

    symbols.forEach((symbol, index) => {
      fields[`55.${index}`] = symbol;
    });

    const rawMessage = this.buildFIXMessage(fields);
    this.fixSession.msgSeqNum++;

    return {
      msgType: 'V',
      fields,
      rawMessage,
      timestamp: Date.now(),
    };
  }

  createHeartbeat(): FIXMessage {
    const fields = {
      '8': 'FIX.4.4',
      '35': '0', // Heartbeat
      '49': this.fixSession.senderCompId,
      '56': this.fixSession.targetCompId,
      '34': this.fixSession.msgSeqNum.toString(),
      '52': new Date().toISOString(),
    };

    const rawMessage = this.buildFIXMessage(fields);
    this.fixSession.msgSeqNum++;

    return {
      msgType: '0',
      fields,
      rawMessage,
      timestamp: Date.now(),
    };
  }

  createTestRequest(): FIXMessage {
    const fields = {
      '8': 'FIX.4.4',
      '35': '1', // TestRequest
      '49': this.fixSession.senderCompId,
      '56': this.fixSession.targetCompId,
      '34': this.fixSession.msgSeqNum.toString(),
      '52': new Date().toISOString(),
      '112': `TEST_${Date.now()}`,
    };

    const rawMessage = this.buildFIXMessage(fields);
    this.fixSession.msgSeqNum++;

    return {
      msgType: '1',
      fields,
      rawMessage,
      timestamp: Date.now(),
    };
  }

  createLogon(): FIXMessage {
    const fields = {
      '8': 'FIX.4.4',
      '35': 'A', // Logon
      '49': this.fixSession.senderCompId,
      '56': this.fixSession.targetCompId,
      '34': '1',
      '52': new Date().toISOString(),
      '98': '0', // EncryptMethod (None)
      '108': '30', // HeartBtInt (30 seconds)
    };

    const rawMessage = this.buildFIXMessage(fields);

    return {
      msgType: 'A',
      fields,
      rawMessage,
      timestamp: Date.now(),
    };
  }

  createLogout(text?: string): FIXMessage {
    const fields: Record<string, string> = {
      '8': 'FIX.4.4',
      '35': '5', // Logout
      '49': this.fixSession.senderCompId,
      '56': this.fixSession.targetCompId,
      '34': this.fixSession.msgSeqNum.toString(),
      '52': new Date().toISOString(),
    };

    if (text) {
      fields['58'] = text;
    }

    const rawMessage = this.buildFIXMessage(fields);
    this.fixSession.msgSeqNum++;

    return {
      msgType: '5',
      fields,
      rawMessage,
      timestamp: Date.now(),
    };
  }

  parseExecutionReport(fields: Record<string, string>): any {
    return {
      messageType: 'EXECUTION_REPORT',
      orderId: fields['37'],
      clOrdId: fields['11'],
      execId: fields['17'],
      execType: fields['150'],
      ordStatus: fields['39'],
      symbol: fields['55'],
      side: fields['54'],
      orderQty: parseFloat(fields['38']),
      price: fields['44'] ? parseFloat(fields['44']) : undefined,
      lastQty: fields['32'] ? parseFloat(fields['32']) : 0,
      lastPx: fields['31'] ? parseFloat(fields['31']) : 0,
      cumQty: fields['14'] ? parseFloat(fields['14']) : 0,
      avgPx: fields['6'] ? parseFloat(fields['6']) : 0,
      transactTime: fields['60'],
    };
  }

  private buildFIXMessage(fields: Record<string, string>): string {
    const message = Object.entries(fields)
      .map(([tag, value]) => `${tag}=${value}`)
      .join('|') + '|';
    
    return message;
  }

  // OUCH Protocol Messages
  createOUCHEnterOrder(orderData: {
    orderToken: string;
    symbol: string;
    side: 'B' | 'S';
    quantity: number;
    price?: number;
    timeInForce: 'DAY' | 'GTC' | 'IOC' | 'FOK';
    orderType: 'Market' | 'Limit';
  }): string {
    // OUCH Enter Order Message (simplified)
    const message = [
      'O', // Message Type: Enter Order
      orderData.orderToken.padEnd(14),
      orderData.side,
      orderData.quantity.toString().padStart(9, '0'),
      orderData.symbol.padEnd(8),
      (orderData.price || 0).toFixed(4).padStart(10, '0'),
      orderData.timeInForce.padEnd(4),
      'N', // Display: Non-Display
      '0000', // Minimum Quantity
      'N', // Customer Type
    ].join('');

    console.log(`OUCH Enter Order: ${message}`);
    return message;
  }

  createOUCHCancelOrder(orderToken: string): string {
    const message = [
      'X', // Message Type: Cancel Order
      orderToken.padEnd(14),
    ].join('');

    console.log(`OUCH Cancel Order: ${message}`);
    return message;
  }

  createOUCHReplaceOrder(orderToken: string, newQuantity: number, newPrice?: number): string {
    const message = [
      'U', // Message Type: Replace Order
      orderToken.padEnd(14),
      newQuantity.toString().padStart(9, '0'),
      (newPrice || 0).toFixed(4).padStart(10, '0'),
    ].join('');

    console.log(`OUCH Replace Order: ${message}`);
    return message;
  }

  // ITCH Protocol Message Parsing (Incoming)
  parseITCHMessage(rawData: ArrayBuffer): any {
    const view = new DataView(rawData);
    const messageType = String.fromCharCode(view.getUint8(0));

    switch (messageType) {
      case 'S': // System Event
        return this.parseSystemEvent(view);
      case 'R': // Stock Directory
        return this.parseStockDirectory(view);
      case 'A': // Add Order (No MPID)
        return this.parseAddOrder(view);
      case 'E': // Order Execute
        return this.parseOrderExecute(view);
      case 'X': // Order Cancel
        return this.parseOrderCancel(view);
      case 'P': // Trade Message
        return this.parseTradeMessage(view);
      default:
        return { messageType: 'UNKNOWN', rawData };
    }
  }

  private parseSystemEvent(view: DataView): any {
    return {
      messageType: 'SYSTEM_EVENT',
      timestamp: view.getBigUint64(5, false),
      eventCode: String.fromCharCode(view.getUint8(13)),
    };
  }

  private parseStockDirectory(view: DataView): any {
    return {
      messageType: 'STOCK_DIRECTORY',
      timestamp: view.getBigUint64(5, false),
      stock: this.getString(view, 11, 8),
      marketCategory: String.fromCharCode(view.getUint8(19)),
      financialStatus: String.fromCharCode(view.getUint8(20)),
      roundLotSize: view.getUint32(21, false),
    };
  }

  private parseAddOrder(view: DataView): any {
    return {
      messageType: 'ADD_ORDER',
      timestamp: view.getBigUint64(5, false),
      orderReferenceNumber: view.getBigUint64(11, false),
      buySellIndicator: String.fromCharCode(view.getUint8(19)),
      shares: view.getUint32(20, false),
      stock: this.getString(view, 24, 8),
      price: view.getUint32(32, false) / 10000, // Price in 1/10,000ths
    };
  }

  private parseOrderExecute(view: DataView): any {
    return {
      messageType: 'ORDER_EXECUTE',
      timestamp: view.getBigUint64(5, false),
      orderReferenceNumber: view.getBigUint64(11, false),
      executedShares: view.getUint32(19, false),
      executionPrice: view.getUint32(23, false) / 10000,
      matchNumber: view.getBigUint64(27, false),
    };
  }

  private parseOrderCancel(view: DataView): any {
    return {
      messageType: 'ORDER_CANCEL',
      timestamp: view.getBigUint64(5, false),
      orderReferenceNumber: view.getBigUint64(11, false),
      cancelledShares: view.getUint32(19, false),
    };
  }

  private parseTradeMessage(view: DataView): any {
    return {
      messageType: 'TRADE',
      timestamp: view.getBigUint64(5, false),
      orderReferenceNumber: view.getBigUint64(11, false),
      buySellIndicator: String.fromCharCode(view.getUint8(19)),
      shares: view.getUint32(20, false),
      stock: this.getString(view, 24, 8),
      price: view.getUint32(32, false) / 10000,
      matchNumber: view.getBigUint64(36, false),
    };
  }

  private getString(view: DataView, offset: number, length: number): string {
    const bytes = new Uint8Array(view.buffer, offset, length);
    return new TextDecoder().decode(bytes).trim();
  }

  // Session Status
  getFIXSessionStatus() {
    return {
      isLoggedOn: this.fixSession.isLoggedOn,
      msgSeqNum: this.fixSession.msgSeqNum,
      senderCompId: this.fixSession.senderCompId,
      targetCompId: this.fixSession.targetCompId,
    };
  }

  getOUCHSessionStatus() {
    return {
      isLoggedOn: this.ouchSession.isLoggedOn,
      sessionId: this.ouchSession.sessionId,
      username: this.ouchSession.username,
    };
  }

  resetSequenceNumber() {
    this.fixSession.msgSeqNum = 1;
  }

  sendHeartbeat(): FIXMessage {
    return this.createHeartbeat();
  }

  getAllSupportedFIXMessages(): string[] {
    return [
      'Heartbeat (0)',
      'TestRequest (1)',
      'Logon (A)',
      'Logout (5)',
      'NewOrderSingle (D)',
      'ExecutionReport (8)',
      'OrderCancelRequest (F)',
      'OrderCancelReplaceRequest (G)',
      'OrderStatusRequest (H)',
      'MarketDataRequest (V)',
    ];
  }
}
