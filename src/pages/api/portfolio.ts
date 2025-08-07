import { NextApiRequest, NextApiResponse } from 'next';
import { mockStocks } from '@/lib/mockData';
import { calculatePortfolioMetrics, groupBySector } from '@/lib/utils';
import { fetchRealMarketDataYahoo } from '@/lib/yahooFinance';

interface StockPriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  peRatio?: number;
  earnings?: number;
}

const USE_REAL_API = process.env.USE_REAL_API !== 'false';
const USE_YAHOO_FINANCE = true;

console.log('API Configuration:', {
  USE_REAL_API,
  USE_YAHOO_FINANCE,
  DATA_SOURCE: USE_REAL_API ? 'Yahoo Finance + Google Finance' : 'Simulated'
});

let lastApiCall = 0;
const API_CALL_INTERVAL = 1000;

const fetchRealMarketData = async (): Promise<StockPriceUpdate[]> => {
  if (!USE_YAHOO_FINANCE) {
    console.log('🎭 Yahoo Finance disabled, using simulated data...');
    return [];
  }

  try {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    if (timeSinceLastCall < API_CALL_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, API_CALL_INTERVAL - timeSinceLastCall));
    }
    lastApiCall = Date.now();

    const stockSymbols = mockStocks.map(stock => stock.nseCode);
    console.log(`📈 Fetching real data for: ${stockSymbols.join(', ')}`);
    const updates = await fetchRealMarketDataYahoo(stockSymbols);
    return updates;
  } catch (error) {
    console.error('❌ Real market data fetch failed:', error);
    return [];
  }
};

const simulateMarketData = (): StockPriceUpdate[] => {
  console.log('🎯 Using simulated market data...');
  const updates: StockPriceUpdate[] = [];
  mockStocks.forEach(stock => {
    const baseVolatility = 0.02;
    const trendFactor = (Math.random() - 0.5) * 0.008;
    const randomFactor = (Math.random() - 0.5) * baseVolatility;
    const changePercent = trendFactor + randomFactor;
    const newPrice = stock.cmp * (1 + changePercent);
    const change = newPrice - stock.cmp;
    updates.push({
      symbol: stock.nseCode,
      price: newPrice,
      change,
      changePercent,
      peRatio: Math.random() > 0.5 ? Math.round((Math.random() * 40 + 10) * 100) / 100 : undefined,
      earnings: Math.random() > 0.5 ? Math.round((Math.random() * 200 + 50) * 100) / 100 : undefined,
    });
  });
  return updates;
};

const updateStockPrices = (stocks: any[], priceUpdates: StockPriceUpdate[]) => {
  return stocks.map(stock => {
    const update = priceUpdates.find(u => u.symbol === stock.nseCode);
    if (update) {
      const newCmp = Math.round(update.price * 100) / 100;
      const newPresentValue = Math.round(newCmp * stock.qty * 100) / 100;
      const newGainLoss = Math.round((newPresentValue - stock.investment) * 100) / 100;
      const newGainLossPercentage = stock.investment > 0 ? newGainLoss / stock.investment : 0;
      return {
        ...stock,
        cmp: newCmp,
        presentValue: newPresentValue,
        gainLoss: newGainLoss,
        gainLossPercentage: newGainLossPercentage,
        change: Math.round(update.change * 100) / 100,
        changePercent: Math.round(update.changePercent * 10000) / 100,
        lastUpdated: new Date().toISOString(),
        peRatio: update.peRatio || stock.peRatio,
        latestEarnings: update.earnings || stock.latestEarnings,
      };
    }
    return stock;
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  console.log('\n🔄 Portfolio API called - starting market data fetch...');
  console.log(`🌐 Using ${USE_REAL_API ? 'REAL' : 'SIMULATED'} data source`);
  try {
    if (req.method === 'GET') {
      let priceUpdates: StockPriceUpdate[];
      let dataSource: string;
      if (USE_REAL_API) {
        console.log('🌐 Using REAL API data (Yahoo Finance + Google Finance)...');
        priceUpdates = await fetchRealMarketData();
        if (priceUpdates.length === 0) {
          console.log('⚠️ No real data received, falling back to simulation...');
          priceUpdates = simulateMarketData();
          dataSource = 'simulated-fallback';
        } else if (priceUpdates.length < mockStocks.length) {
          console.log(`⚠️ Partial real data (${priceUpdates.length}/${mockStocks.length}), filling gaps with simulation...`);
          const receivedSymbols = new Set(priceUpdates.map(u => u.symbol));
          const missingStocks = mockStocks.filter(s => !receivedSymbols.has(s.nseCode));
          missingStocks.forEach(stock => {
            const changePercent = (Math.random() - 0.5) * 0.03;
            const newPrice = stock.cmp * (1 + changePercent);
            const change = newPrice - stock.cmp;
            priceUpdates.push({
              symbol: stock.nseCode,
              price: newPrice,
              change,
              changePercent,
            });
          });
          dataSource = 'yahoo-finance-mixed';
        } else {
          dataSource = 'yahoo-finance-real';
        }
      } else {
        console.log('🎭 Using SIMULATED data (real API disabled)...');
        priceUpdates = simulateMarketData();
        dataSource = 'simulated';
      }
      const updatedStocks = updateStockPrices(mockStocks, priceUpdates);
      const sectors = groupBySector(updatedStocks);
      const portfolioSummary = calculatePortfolioMetrics(updatedStocks);
      const processingTime = Date.now() - startTime;
      console.log(`⏱️ Portfolio API completed in ${processingTime}ms`);
      const response = {
        success: true,
        data: {
          stocks: updatedStocks,
          sectors,
          summary: {
            ...portfolioSummary,
            sectors,
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
          processingTime: `${processingTime}ms`,
          dataSource,
          updatesCount: priceUpdates.length,
          realDataCount: priceUpdates.filter(u => u.price > 0).length,
          stocksProcessed: updatedStocks.length,
        },
      };
      console.log('📈 Portfolio Summary:', {
        totalStocks: updatedStocks.length,
        totalInvestment: portfolioSummary.totalInvestment,
        totalPresentValue: portfolioSummary.totalPresentValue,
        totalGainLoss: portfolioSummary.totalGainLoss,
        dataSource: response.metadata.dataSource
      });
      console.log(`✅ Successfully processed ${updatedStocks.length} stocks with ${dataSource} data`);
      res.status(200).json(response);
    } else if (req.method === 'POST') {
      const { stocks } = req.body;
      if (!stocks || !Array.isArray(stocks)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid stocks data',
          timestamp: new Date().toISOString(),
        });
      }
      const sectors = groupBySector(stocks);
      const portfolioSummary = calculatePortfolioMetrics(stocks);
      const response = {
        success: true,
        data: {
          stocks,
          sectors,
          summary: {
            ...portfolioSummary,
            sectors,
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
          dataSource: 'user-provided',
        },
      };
      res.status(200).json(response);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({
        success: false,
        error: `Method ${req.method} Not Allowed`,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Portfolio API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`,
    });
  }
}
