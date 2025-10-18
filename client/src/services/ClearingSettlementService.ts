import { Trade } from '@/types/trading';

export type SettlementCycle = 'T+0' | 'T+1' | 'T+2' | 'T+3';
export type SettlementStatus =
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'PENDING_CLEARING'
  | 'CLEARED'
  | 'PENDING_SETTLEMENT'
  | 'SETTLED'
  | 'FAILED'
  | 'CANCELLED';

export interface TradeConfirmation {
  tradeId: string;
  confirmationId: string;
  timestamp: number;
  status: 'CONFIRMED' | 'DISPUTED' | 'PENDING';
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
}

export interface ClearingInstruction {
  clearingId: string;
  tradeId: string;
  clearingHouse: string;
  timestamp: number;
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'CLEARED';
  marginRequirement: number;
  fees: number;
}

export interface SettlementInstruction {
  settlementId: string;
  tradeId: string;
  settlementDate: number;
  settlementCycle: SettlementCycle;
  status: SettlementStatus;
  cashAmount: number;
  securitiesQuantity: number;
  symbol: string;
  buyerAccount: string;
  sellerAccount: string;
  timestamp: number;
}

export interface MarginCall {
  id: string;
  accountId: string;
  timestamp: number;
  requiredAmount: number;
  currentMargin: number;
  deficit: number;
  dueDate: number;
  status: 'ACTIVE' | 'MET' | 'DEFAULTED';
}

export interface FailedTrade {
  tradeId: string;
  reason: string;
  timestamp: number;
  resolutionStatus: 'PENDING' | 'RESOLVED' | 'CANCELLED';
  resolutionDate?: number;
}

export class ClearingSettlementService {
  private confirmations: Map<string, TradeConfirmation> = new Map();
  private clearingInstructions: Map<string, ClearingInstruction> = new Map();
  private settlementInstructions: Map<string, SettlementInstruction> = new Map();
  private marginCalls: Map<string, MarginCall> = new Map();
  private failedTrades: Map<string, FailedTrade> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startProcessing();
  }

  submitTradeForClearing(trade: Trade, settlementCycle: SettlementCycle = 'T+2'): string {
    const confirmationId = `CONF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const confirmation: TradeConfirmation = {
      tradeId: trade.id,
      confirmationId,
      timestamp: Date.now(),
      status: 'PENDING',
      buyerConfirmed: false,
      sellerConfirmed: false,
    };

    this.confirmations.set(trade.id, confirmation);

    setTimeout(() => {
      this.confirmTrade(trade.id, 'buyer');
      this.confirmTrade(trade.id, 'seller');
    }, 1000);

    console.log(`Trade ${trade.id} submitted for clearing. Confirmation ID: ${confirmationId}`);

    return confirmationId;
  }

  confirmTrade(tradeId: string, party: 'buyer' | 'seller'): void {
    const confirmation = this.confirmations.get(tradeId);
    if (!confirmation) return;

    if (party === 'buyer') {
      confirmation.buyerConfirmed = true;
    } else {
      confirmation.sellerConfirmed = true;
    }

    if (confirmation.buyerConfirmed && confirmation.sellerConfirmed) {
      confirmation.status = 'CONFIRMED';
      console.log(`Trade ${tradeId} confirmed by both parties`);

      this.submitToClearingHouse(tradeId);
    }

    this.confirmations.set(tradeId, confirmation);
  }

  private submitToClearingHouse(tradeId: string): void {
    const clearingId = `CLR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const clearingInstruction: ClearingInstruction = {
      clearingId,
      tradeId,
      clearingHouse: 'DTCC',
      timestamp: Date.now(),
      status: 'SUBMITTED',
      marginRequirement: Math.random() * 10000 + 5000,
      fees: Math.random() * 100 + 50,
    };

    this.clearingInstructions.set(tradeId, clearingInstruction);

    setTimeout(() => {
      clearingInstruction.status = 'ACCEPTED';
      console.log(`Clearing instruction ${clearingId} accepted by clearing house`);

      setTimeout(() => {
        this.clearTrade(tradeId);
      }, 2000);
    }, 1500);
  }

  private clearTrade(tradeId: string): void {
    const clearingInstruction = this.clearingInstructions.get(tradeId);
    if (!clearingInstruction) return;

    clearingInstruction.status = 'CLEARED';
    console.log(`Trade ${tradeId} cleared by clearing house`);

    this.initiateSettlement(tradeId, 'T+2');
  }

  private initiateSettlement(tradeId: string, settlementCycle: SettlementCycle): void {
    const settlementId = `SETTLE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const cycleDays = parseInt(settlementCycle.replace('T+', ''));
    const settlementDate = Date.now() + cycleDays * 24 * 60 * 60 * 1000;

    const settlementInstruction: SettlementInstruction = {
      settlementId,
      tradeId,
      settlementDate,
      settlementCycle,
      status: 'PENDING_SETTLEMENT',
      cashAmount: Math.random() * 100000 + 10000,
      securitiesQuantity: Math.floor(Math.random() * 1000) + 100,
      symbol: 'SAMPLE',
      buyerAccount: 'BUYER_ACC_001',
      sellerAccount: 'SELLER_ACC_001',
      timestamp: Date.now(),
    };

    this.settlementInstructions.set(tradeId, settlementInstruction);

    console.log(
      `Settlement instruction created for trade ${tradeId}. Settlement date: ${new Date(
        settlementDate
      ).toISOString()}`
    );
  }

  private startProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(() => {
      this.processSettlements();
      this.checkMarginRequirements();
    }, 5000);
  }

  private processSettlements(): void {
    const now = Date.now();

    this.settlementInstructions.forEach((instruction, tradeId) => {
      if (instruction.status === 'PENDING_SETTLEMENT' && now >= instruction.settlementDate) {
        const success = Math.random() > 0.05;

        if (success) {
          instruction.status = 'SETTLED';
          console.log(`Trade ${tradeId} settled successfully`);
        } else {
          instruction.status = 'FAILED';
          this.recordFailedTrade(tradeId, 'Insufficient funds in buyer account');
          console.log(`Trade ${tradeId} settlement failed`);
        }
      }
    });
  }

  private checkMarginRequirements(): void {
    if (Math.random() > 0.95) {
      const marginCallId = `MC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const marginCall: MarginCall = {
        id: marginCallId,
        accountId: `ACC_${Math.floor(Math.random() * 1000)}`,
        timestamp: Date.now(),
        requiredAmount: Math.random() * 50000 + 10000,
        currentMargin: Math.random() * 30000,
        deficit: 0,
        dueDate: Date.now() + 24 * 60 * 60 * 1000,
        status: 'ACTIVE',
      };

      marginCall.deficit = marginCall.requiredAmount - marginCall.currentMargin;

      this.marginCalls.set(marginCallId, marginCall);

      console.log(`Margin call ${marginCallId} issued. Deficit: ${marginCall.deficit.toFixed(2)}`);
    }
  }

  private recordFailedTrade(tradeId: string, reason: string): void {
    const failedTrade: FailedTrade = {
      tradeId,
      reason,
      timestamp: Date.now(),
      resolutionStatus: 'PENDING',
    };

    this.failedTrades.set(tradeId, failedTrade);
  }

  resolveFailedTrade(tradeId: string): void {
    const failedTrade = this.failedTrades.get(tradeId);
    if (!failedTrade) return;

    failedTrade.resolutionStatus = 'RESOLVED';
    failedTrade.resolutionDate = Date.now();

    const settlement = this.settlementInstructions.get(tradeId);
    if (settlement) {
      settlement.status = 'SETTLED';
    }

    console.log(`Failed trade ${tradeId} resolved`);
  }

  meetMarginCall(marginCallId: string, amount: number): void {
    const marginCall = this.marginCalls.get(marginCallId);
    if (!marginCall) return;

    if (amount >= marginCall.deficit) {
      marginCall.status = 'MET';
      marginCall.currentMargin += amount;
      console.log(`Margin call ${marginCallId} met`);
    }
  }

  getSettlementStatus(tradeId: string): SettlementInstruction | undefined {
    return this.settlementInstructions.get(tradeId);
  }

  getClearingStatus(tradeId: string): ClearingInstruction | undefined {
    return this.clearingInstructions.get(tradeId);
  }

  getConfirmationStatus(tradeId: string): TradeConfirmation | undefined {
    return this.confirmations.get(tradeId);
  }

  getAllPendingSettlements(): SettlementInstruction[] {
    return Array.from(this.settlementInstructions.values()).filter(
      (s) => s.status === 'PENDING_SETTLEMENT'
    );
  }

  getAllSettledTrades(): SettlementInstruction[] {
    return Array.from(this.settlementInstructions.values()).filter((s) => s.status === 'SETTLED');
  }

  getAllFailedTrades(): FailedTrade[] {
    return Array.from(this.failedTrades.values());
  }

  getActiveMarginCalls(): MarginCall[] {
    return Array.from(this.marginCalls.values()).filter((m) => m.status === 'ACTIVE');
  }

  generateSettlementReport(): {
    totalTrades: number;
    confirmed: number;
    cleared: number;
    settled: number;
    failed: number;
    pending: number;
    activeMarginCalls: number;
  } {
    const allSettlements = Array.from(this.settlementInstructions.values());

    return {
      totalTrades: allSettlements.length,
      confirmed: Array.from(this.confirmations.values()).filter((c) => c.status === 'CONFIRMED')
        .length,
      cleared: Array.from(this.clearingInstructions.values()).filter(
        (c) => c.status === 'CLEARED'
      ).length,
      settled: allSettlements.filter((s) => s.status === 'SETTLED').length,
      failed: allSettlements.filter((s) => s.status === 'FAILED').length,
      pending: allSettlements.filter((s) => s.status === 'PENDING_SETTLEMENT').length,
      activeMarginCalls: this.getActiveMarginCalls().length,
    };
  }

  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
}

export const clearingSettlementService = new ClearingSettlementService();
