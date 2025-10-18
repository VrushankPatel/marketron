import { Instrument } from '@/types/market';

export const instruments: Instrument[] = [
  // Technology Stocks
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    assetClass: 'EQUITY',
    sector: 'Technology',
    exchange: 'NASDAQ',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    isin: 'US0378331005',
    multiplier: 1,
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    assetClass: 'EQUITY',
    sector: 'Technology',
    exchange: 'NASDAQ',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    isin: 'US02079K3059',
    multiplier: 1,
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    assetClass: 'EQUITY',
    sector: 'Technology',
    exchange: 'NASDAQ',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    isin: 'US5949181045',
    multiplier: 1,
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    assetClass: 'EQUITY',
    sector: 'Automotive',
    exchange: 'NASDAQ',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    isin: 'US88160R1014',
    multiplier: 1,
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    assetClass: 'EQUITY',
    sector: 'Technology',
    exchange: 'NASDAQ',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    isin: 'US67066G1040',
    multiplier: 1,
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  
  // Financial Stocks
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    assetClass: 'EQUITY',
    sector: 'Finance',
    exchange: 'NYSE',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    isin: 'US46625H1005',
    multiplier: 1,
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  {
    symbol: 'BAC',
    name: 'Bank of America Corporation',
    assetClass: 'EQUITY',
    sector: 'Finance',
    exchange: 'NYSE',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    isin: 'US0605051046',
    multiplier: 1,
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  {
    symbol: 'WFC',
    name: 'Wells Fargo & Company',
    assetClass: 'EQUITY',
    sector: 'Finance',
    exchange: 'NYSE',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    isin: 'US9497461015',
    multiplier: 1,
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  {
    symbol: 'GS',
    name: 'The Goldman Sachs Group, Inc.',
    assetClass: 'EQUITY',
    sector: 'Finance',
    exchange: 'NYSE',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    isin: 'US38141G1040',
    multiplier: 1,
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  {
    symbol: 'MS',
    name: 'Morgan Stanley',
    assetClass: 'EQUITY',
    sector: 'Finance',
    exchange: 'NYSE',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    isin: 'US6174464486',
    multiplier: 1,
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  
  // Healthcare Stocks
  {
    symbol: 'JNJ',
    name: 'Johnson & Johnson',
    assetClass: 'EQUITY',
    sector: 'Healthcare',
    exchange: 'NYSE',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    isin: 'US4781601046',
    multiplier: 1,
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  {
    symbol: 'PFE',
    name: 'Pfizer Inc.',
    assetClass: 'EQUITY',
    sector: 'Healthcare',
    exchange: 'NYSE',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    isin: 'US7170811035',
    multiplier: 1,
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  
  // Energy Stocks
  {
    symbol: 'XOM',
    name: 'Exxon Mobil Corporation',
    assetClass: 'EQUITY',
    sector: 'Energy',
    exchange: 'NYSE',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    isin: 'US30231G1022',
    multiplier: 1,
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  {
    symbol: 'CVX',
    name: 'Chevron Corporation',
    assetClass: 'EQUITY',
    sector: 'Energy',
    exchange: 'NYSE',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    isin: 'US1667641005',
    multiplier: 1,
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  
  // Futures
  {
    symbol: 'ESM4',
    name: 'E-mini S&P 500 Future',
    assetClass: 'FUTURES',
    exchange: 'CME',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.25,
    multiplier: 50,
    expirationDate: '2024-06-21',
    underlyingSymbol: 'SPX',
    tradingHours: {
      open: '17:00',
      close: '16:00',
      timezone: 'CT'
    }
  },
  {
    symbol: 'NQM4',
    name: 'E-mini Nasdaq-100 Future',
    assetClass: 'FUTURES',
    exchange: 'CME',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.25,
    multiplier: 20,
    expirationDate: '2024-06-21',
    underlyingSymbol: 'NDX',
    tradingHours: {
      open: '17:00',
      close: '16:00',
      timezone: 'CT'
    }
  },
  
  // Options
  {
    symbol: 'AAPL240621C00180000',
    name: 'Apple Call Option',
    assetClass: 'OPTIONS',
    exchange: 'CBOE',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    multiplier: 100,
    expirationDate: '2024-06-21',
    underlyingSymbol: 'AAPL',
    strikePrice: 180,
    optionType: 'CALL',
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  {
    symbol: 'AAPL240621P00180000',
    name: 'Apple Put Option',
    assetClass: 'OPTIONS',
    exchange: 'CBOE',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    multiplier: 100,
    expirationDate: '2024-06-21',
    underlyingSymbol: 'AAPL',
    strikePrice: 180,
    optionType: 'PUT',
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  
  // Forex
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    assetClass: 'FOREX',
    exchange: 'FX',
    currency: 'USD',
    lotSize: 100000,
    tickSize: 0.00001,
    multiplier: 1,
    tradingHours: {
      open: '17:00',
      close: '17:00',
      timezone: 'ET'
    }
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    assetClass: 'FOREX',
    exchange: 'FX',
    currency: 'USD',
    lotSize: 100000,
    tickSize: 0.00001,
    multiplier: 1,
    tradingHours: {
      open: '17:00',
      close: '17:00',
      timezone: 'ET'
    }
  },
  {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    assetClass: 'FOREX',
    exchange: 'FX',
    currency: 'USD',
    lotSize: 100000,
    tickSize: 0.001,
    multiplier: 1,
    tradingHours: {
      open: '17:00',
      close: '17:00',
      timezone: 'ET'
    }
  },
  {
    symbol: 'USDCHF',
    name: 'US Dollar / Swiss Franc',
    assetClass: 'FOREX',
    exchange: 'FX',
    currency: 'USD',
    lotSize: 100000,
    tickSize: 0.00001,
    multiplier: 1,
    tradingHours: {
      open: '17:00',
      close: '17:00',
      timezone: 'ET'
    }
  },
  {
    symbol: 'AUDUSD',
    name: 'Australian Dollar / US Dollar',
    assetClass: 'FOREX',
    exchange: 'FX',
    currency: 'USD',
    lotSize: 100000,
    tickSize: 0.00001,
    multiplier: 1,
    tradingHours: {
      open: '17:00',
      close: '17:00',
      timezone: 'ET'
    }
  },
  
  // Indices
  {
    symbol: 'SPX',
    name: 'S&P 500 Index',
    assetClass: 'INDEX',
    exchange: 'SPX',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    multiplier: 1,
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  {
    symbol: 'NDX',
    name: 'NASDAQ-100 Index',
    assetClass: 'INDEX',
    exchange: 'NASDAQ',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    multiplier: 1,
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  },
  {
    symbol: 'DJI',
    name: 'Dow Jones Industrial Average',
    assetClass: 'INDEX',
    exchange: 'DJI',
    currency: 'USD',
    lotSize: 1,
    tickSize: 0.01,
    multiplier: 1,
    tradingHours: {
      open: '09:30',
      close: '16:00',
      timezone: 'ET'
    }
  }
];

export const getInstrumentsByAssetClass = (assetClass: string) => {
  return instruments.filter(instrument => instrument.assetClass === assetClass);
};

export const getInstrumentsBySector = (sector: string) => {
  return instruments.filter(instrument => instrument.sector === sector);
};

export const getInstrumentBySymbol = (symbol: string) => {
  return instruments.find(instrument => instrument.symbol === symbol);
};
