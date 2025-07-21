export interface Stock {
  id: number;
  particulars: string;
  purchasePrice: number;
  qty: number;
  investment: number;
  portfolioPercentage: number;
  nseCode: string;
  cmp: number;
  presentValue: number;
  gainLoss: number;
  gainLossPercentage: number;
  marketCap: number;
  peRatio: number;
  latestEarnings: number;
  sector: string;
  revenue?: number;
  ebitda?: number;
  ebitdaPercentage?: number;
  pat?: number;
  patPercentage?: number;
  debtToEquity?: number;
  bookValue?: number;
  stage2?: string;
  salePrice?: number;
}

export interface SectorSummary {
  sector: string;
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
  gainLossPercentage: number;
  stocks: Stock[];
}

export interface PortfolioSummary {
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  totalStocks: number;
  sectors: SectorSummary[];
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}