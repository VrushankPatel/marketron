export const formatPrice = (price: number, decimals: number = 2): string => {
  return price.toFixed(decimals);
};

export const formatPriceChange = (change: number, decimals: number = 2): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(decimals)}`;
};

export const formatPercentage = (percentage: number, decimals: number = 2): string => {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(decimals)}%`;
};

export const formatVolume = (volume: number): string => {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatLargeNumber = (num: number, decimals: number = 1): string => {
  if (Math.abs(num) >= 1e12) {
    return `${(num / 1e12).toFixed(decimals)}T`;
  } else if (Math.abs(num) >= 1e9) {
    return `${(num / 1e9).toFixed(decimals)}B`;
  } else if (Math.abs(num) >= 1e6) {
    return `${(num / 1e6).toFixed(decimals)}M`;
  } else if (Math.abs(num) >= 1e3) {
    return `${(num / 1e3).toFixed(decimals)}K`;
  }
  return num.toFixed(decimals);
};

export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

export const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

export const getPriceChangeColor = (change: number): string => {
  if (change > 0) return 'text-green-500';
  if (change < 0) return 'text-red-500';
  return 'text-muted-foreground';
};

export const getPriceChangeClass = (change: number): string => {
  if (change > 0) return 'price-up';
  if (change < 0) return 'price-down';
  return 'price-neutral';
};

export const formatOrderStatus = (status: string): string => {
  return status.replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
};

export const formatOrderType = (type: string): string => {
  switch (type) {
    case 'MARKET': return 'Market';
    case 'LIMIT': return 'Limit';
    case 'STOP': return 'Stop';
    case 'STOP_LIMIT': return 'Stop Limit';
    case 'ICEBERG': return 'Iceberg';
    case 'TWAP': return 'TWAP';
    case 'VWAP': return 'VWAP';
    default: return type;
  }
};

export const formatTimeInForce = (tif: string): string => {
  switch (tif) {
    case 'DAY': return 'Day';
    case 'GTC': return 'GTC';
    case 'IOC': return 'IOC';
    case 'FOK': return 'FOK';
    case 'GTD': return 'GTD';
    default: return tif;
  }
};

export const formatExecutionType = (execType: string): string => {
  switch (execType) {
    case 'NEW': return 'New';
    case 'FILL': return 'Fill';
    case 'PARTIAL_FILL': return 'Partial Fill';
    case 'CANCELLED': return 'Cancelled';
    case 'REJECTED': return 'Rejected';
    default: return execType;
  }
};

export const formatPositionSide = (side: string): string => {
  switch (side) {
    case 'LONG': return 'Long';
    case 'SHORT': return 'Short';
    case 'FLAT': return 'Flat';
    default: return side;
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
