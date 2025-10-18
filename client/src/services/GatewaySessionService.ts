import { ProtocolGateway } from '@/types/trading';
import { ProtocolService } from './ProtocolService';

export interface SessionEvent {
  type: 'CONNECTED' | 'DISCONNECTED' | 'HEARTBEAT' | 'ERROR' | 'MESSAGE_SENT' | 'MESSAGE_RECEIVED';
  gateway: 'FIX' | 'OUCH' | 'ITCH';
  timestamp: number;
  data?: any;
}

export class GatewaySessionService {
  private protocolService: ProtocolService;
  private gateways: Map<string, ProtocolGateway> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private sessionEventHandlers: ((event: SessionEvent) => void)[] = [];
  private itchFeedActive: boolean = false;

  constructor() {
    this.protocolService = new ProtocolService();
    this.initializeGateways();
  }

  private initializeGateways() {
    this.gateways.set('FIX', {
      type: 'FIX',
      status: 'DISCONNECTED',
      messagesReceived: 0,
      messagesSent: 0,
    });

    this.gateways.set('OUCH', {
      type: 'OUCH',
      status: 'DISCONNECTED',
      messagesReceived: 0,
      messagesSent: 0,
    });

    this.gateways.set('ITCH', {
      type: 'ITCH',
      status: 'DISCONNECTED',
      messagesReceived: 0,
      messagesSent: 0,
    });
  }

  connectFIX(): Promise<void> {
    return new Promise((resolve, reject) => {
      const gateway = this.gateways.get('FIX')!;
      gateway.status = 'CONNECTING';

      this.emitEvent({
        type: 'MESSAGE_SENT',
        gateway: 'FIX',
        timestamp: Date.now(),
        data: 'Sending Logon message...',
      });

      setTimeout(() => {
        const logonMessage = this.protocolService.createLogon();
        console.log('FIX Logon:', logonMessage);

        gateway.status = 'CONNECTED';
        gateway.messagesSent++;
        gateway.lastHeartbeat = Date.now();

        this.emitEvent({
          type: 'CONNECTED',
          gateway: 'FIX',
          timestamp: Date.now(),
          data: logonMessage,
        });

        this.startHeartbeat('FIX');
        resolve();
      }, 1000);
    });
  }

  disconnectFIX(): Promise<void> {
    return new Promise((resolve) => {
      const gateway = this.gateways.get('FIX')!;
      const logoutMessage = this.protocolService.createLogout('User requested disconnect');
      console.log('FIX Logout:', logoutMessage);

      gateway.messagesSent++;
      this.stopHeartbeat('FIX');

      setTimeout(() => {
        gateway.status = 'DISCONNECTED';
        this.emitEvent({
          type: 'DISCONNECTED',
          gateway: 'FIX',
          timestamp: Date.now(),
          data: logoutMessage,
        });
        resolve();
      }, 500);
    });
  }

  connectOUCH(): Promise<void> {
    return new Promise((resolve) => {
      const gateway = this.gateways.get('OUCH')!;
      gateway.status = 'CONNECTING';

      this.emitEvent({
        type: 'MESSAGE_SENT',
        gateway: 'OUCH',
        timestamp: Date.now(),
        data: 'Sending OUCH login...',
      });

      setTimeout(() => {
        const sessionId = `OUCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        gateway.status = 'CONNECTED';
        gateway.messagesSent++;

        this.emitEvent({
          type: 'CONNECTED',
          gateway: 'OUCH',
          timestamp: Date.now(),
          data: { sessionId },
        });

        console.log('OUCH Connected:', sessionId);
        resolve();
      }, 800);
    });
  }

  disconnectOUCH(): Promise<void> {
    return new Promise((resolve) => {
      const gateway = this.gateways.get('OUCH')!;

      setTimeout(() => {
        gateway.status = 'DISCONNECTED';
        this.emitEvent({
          type: 'DISCONNECTED',
          gateway: 'OUCH',
          timestamp: Date.now(),
        });
        resolve();
      }, 500);
    });
  }

  connectITCH(): Promise<void> {
    return new Promise((resolve) => {
      const gateway = this.gateways.get('ITCH')!;
      gateway.status = 'CONNECTING';

      this.emitEvent({
        type: 'MESSAGE_SENT',
        gateway: 'ITCH',
        timestamp: Date.now(),
        data: 'Subscribing to ITCH feed...',
      });

      setTimeout(() => {
        gateway.status = 'CONNECTED';
        this.itchFeedActive = true;

        this.emitEvent({
          type: 'CONNECTED',
          gateway: 'ITCH',
          timestamp: Date.now(),
          data: 'ITCH feed active',
        });

        this.startITCHFeed();
        console.log('ITCH Feed Connected');
        resolve();
      }, 600);
    });
  }

  disconnectITCH(): Promise<void> {
    return new Promise((resolve) => {
      const gateway = this.gateways.get('ITCH')!;
      this.itchFeedActive = false;

      setTimeout(() => {
        gateway.status = 'DISCONNECTED';
        this.emitEvent({
          type: 'DISCONNECTED',
          gateway: 'ITCH',
          timestamp: Date.now(),
        });
        resolve();
      }, 300);
    });
  }

  private startHeartbeat(gatewayType: 'FIX') {
    this.stopHeartbeat(gatewayType);

    const interval = setInterval(() => {
      const gateway = this.gateways.get(gatewayType);
      if (!gateway || gateway.status !== 'CONNECTED') {
        this.stopHeartbeat(gatewayType);
        return;
      }

      const heartbeatMessage = this.protocolService.createHeartbeat();
      gateway.messagesSent++;
      gateway.lastHeartbeat = Date.now();

      this.emitEvent({
        type: 'HEARTBEAT',
        gateway: gatewayType,
        timestamp: Date.now(),
        data: heartbeatMessage,
      });

      console.log(`${gatewayType} Heartbeat sent`);
    }, 30000);

    this.heartbeatIntervals.set(gatewayType, interval);
  }

  private stopHeartbeat(gatewayType: string) {
    const interval = this.heartbeatIntervals.get(gatewayType);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(gatewayType);
    }
  }

  private startITCHFeed() {
    const processMessages = () => {
      if (!this.itchFeedActive) return;

      const gateway = this.gateways.get('ITCH')!;

      const messageTypes = [
        { type: 'SYSTEM_EVENT', weight: 0.01 },
        { type: 'STOCK_DIRECTORY', weight: 0.05 },
        { type: 'ADD_ORDER', weight: 0.4 },
        { type: 'ORDER_EXECUTE', weight: 0.2 },
        { type: 'ORDER_CANCEL', weight: 0.15 },
        { type: 'TRADE', weight: 0.19 },
      ];

      const random = Math.random();
      let cumulative = 0;
      let selectedType = messageTypes[0].type;

      for (const msgType of messageTypes) {
        cumulative += msgType.weight;
        if (random <= cumulative) {
          selectedType = msgType.type;
          break;
        }
      }

      gateway.messagesReceived++;

      this.emitEvent({
        type: 'MESSAGE_RECEIVED',
        gateway: 'ITCH',
        timestamp: Date.now(),
        data: {
          messageType: selectedType,
          sequenceNumber: gateway.messagesReceived,
        },
      });

      if (this.itchFeedActive) {
        setTimeout(processMessages, Math.random() * 100 + 50);
      }
    };

    processMessages();
  }

  getGatewayStatus(type: 'FIX' | 'OUCH' | 'ITCH'): ProtocolGateway | undefined {
    return this.gateways.get(type);
  }

  getAllGateways(): ProtocolGateway[] {
    return Array.from(this.gateways.values());
  }

  onSessionEvent(handler: (event: SessionEvent) => void) {
    this.sessionEventHandlers.push(handler);
    return () => {
      const index = this.sessionEventHandlers.indexOf(handler);
      if (index > -1) {
        this.sessionEventHandlers.splice(index, 1);
      }
    };
  }

  private emitEvent(event: SessionEvent) {
    this.sessionEventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in session event handler:', error);
      }
    });
  }

  sendTestRequest() {
    const gateway = this.gateways.get('FIX');
    if (gateway?.status === 'CONNECTED') {
      const testRequest = this.protocolService.createTestRequest();
      gateway.messagesSent++;

      this.emitEvent({
        type: 'MESSAGE_SENT',
        gateway: 'FIX',
        timestamp: Date.now(),
        data: testRequest,
      });

      console.log('FIX Test Request sent:', testRequest);
    }
  }

  getProtocolService(): ProtocolService {
    return this.protocolService;
  }

  shutdown() {
    this.itchFeedActive = false;
    this.heartbeatIntervals.forEach((interval) => clearInterval(interval));
    this.heartbeatIntervals.clear();
    this.gateways.forEach(gateway => {
      gateway.status = 'DISCONNECTED';
    });
  }
}

export const gatewaySessionService = new GatewaySessionService();
