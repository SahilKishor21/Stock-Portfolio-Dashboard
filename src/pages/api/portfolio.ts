import { NextApiRequest, NextApiResponse } from "next";
import { mockStocks } from "@/lib/mockData";
import { calculatePortfolioMetrics, groupBySector } from "@/lib/utils";
import { fetchRealMarketDataYahoo } from "@/lib/yahooFinance";

interface StockPriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  peRatio?: number;
  earnings?: number;
  marketCap?: number;
}

const USE_REAL_API = process.env.USE_REAL_API !== "false";
const NODE_ENV = process.env.NODE_ENV;

// Fixed: Pass bypassCache parameter through
const fetchRealMarketData = async (bypassCache = false): Promise<StockPriceUpdate[]> => {
  try {
    const stockSymbols = mockStocks.map((stock) => stock.nseCode);
    // Fixed: Now passing bypassCache parameter
    const updates = await fetchRealMarketDataYahoo(stockSymbols, bypassCache);
    return updates;
  } catch (error) {
    return [];
  }
};

const simulateMarketData = (): StockPriceUpdate[] => {
  const updates: StockPriceUpdate[] = [];

  mockStocks.forEach((stock) => {
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
  // First pass: Updating individual stock prices and calculate market caps (using yahoofinance API)
  const updatedStocks = stocks.map((stock) => {
    const update = priceUpdates.find((u) => u.symbol === stock.nseCode);
    if (update) {
      const newCmp = Math.round(update.price * 100) / 100;
      const newPresentValue = Math.round(newCmp * stock.qty * 100) / 100;
      const newGainLoss = Math.round((newPresentValue - stock.investment) * 100) / 100;
      const newGainLossPercentage = stock.investment > 0 ? newGainLoss / stock.investment : 0;

      let newMarketCap = stock.marketCap;
      if (stock.marketCap && stock.cmp > 0) {
        const priceRatio = newCmp / stock.cmp;
        newMarketCap = Math.round(stock.marketCap * priceRatio);
      }

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
        marketCap: newMarketCap,
      };
    }
    return stock;
  });

  // Second pass: Recalculating portfolio percentages based on current values (by Google finance API)
  const totalCurrentValue = updatedStocks.reduce((sum, stock) => sum + stock.presentValue, 0);
  
  const stocksWithUpdatedPercentages = updatedStocks.map((stock) => ({
    ...stock,
    portfolioPercentage: totalCurrentValue > 0 
      ? (stock.presentValue / totalCurrentValue) 
      : 0
  }));

  return stocksWithUpdatedPercentages;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  try {
    if (req.method === "GET") {
      const bypassCache = req.headers['x-bypass-cache'] === 'true';
      
      let priceUpdates: StockPriceUpdate[];
      let dataSource: string;

      if (USE_REAL_API) {
        // Fixed: Now properly passing bypassCache parameter
        priceUpdates = await fetchRealMarketData(bypassCache);

        if (priceUpdates.length === 0) {
          dataSource = "simulated-fallback";
        } else if (priceUpdates.length < mockStocks.length) {
          // This is where "mixed" data source comes from - some API calls failed
          dataSource = "yahoo-finance-mixed";
        } else {
          const realPECount = priceUpdates.filter(
            (u) => u.peRatio !== undefined && u.peRatio !== null
          ).length;
          if (realPECount > 0) {
            dataSource = "yahoo-google-finance-real";
          } else {
            dataSource = "yahoo-finance-real";
          }
        }
      } else {
        priceUpdates = simulateMarketData();
        dataSource = "simulated";
      }

      const updatedStocks = updateStockPrices(mockStocks, priceUpdates);
      const sectors = groupBySector(updatedStocks);
      const portfolioSummary = calculatePortfolioMetrics(updatedStocks);
      const processingTime = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: {
          stocks: updatedStocks,
          sectors,
          summary: { ...portfolioSummary, sectors },
        },
        metadata: {
          timestamp: new Date().toISOString(),
          processingTime: `${processingTime}ms`,
          dataSource,
          updatesCount: priceUpdates.length,
          realDataCount: priceUpdates.filter((u) => u.price > 0).length,
          stocksProcessed: updatedStocks.length,
          environment: NODE_ENV,
          useRealApi: USE_REAL_API,
          cacheBypass: bypassCache,
          // Added debug info
          totalStocks: mockStocks.length,
          successfulFetches: priceUpdates.length,
          failedFetches: mockStocks.length - priceUpdates.length,
        },
      });
    } else if (req.method === "POST") {
      const { stocks } = req.body;

      if (!stocks || !Array.isArray(stocks)) {
        return res.status(400).json({
          success: false,
          error: "Invalid stocks data",
          timestamp: new Date().toISOString(),
        });
      }
      const totalCurrentValue = stocks.reduce((sum, stock) => sum + stock.presentValue, 0);
      const stocksWithUpdatedPercentages = stocks.map((stock) => ({
        ...stock,
        portfolioPercentage: totalCurrentValue > 0 
          ? (stock.presentValue / totalCurrentValue) 
          : 0
      }));

      const sectors = groupBySector(stocksWithUpdatedPercentages);
      const portfolioSummary = calculatePortfolioMetrics(stocksWithUpdatedPercentages);

      res.status(200).json({
        success: true,
        data: {
          stocks: stocksWithUpdatedPercentages,
          sectors,
          summary: { ...portfolioSummary, sectors },
        },
        metadata: {
          timestamp: new Date().toISOString(),
          dataSource: "user-provided",
        },
      });
    } else {
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).json({
        success: false,
        error: `Method ${req.method} Not Allowed`,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const fallbackStocks = updateStockPrices(mockStocks, simulateMarketData());
    const fallbackSectors = groupBySector(fallbackStocks);
    const fallbackSummary = calculatePortfolioMetrics(fallbackStocks);

    res.status(200).json({
      success: true,
      data: {
        stocks: fallbackStocks,
        sectors: fallbackSectors,
        summary: { ...fallbackSummary, sectors: fallbackSectors },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        dataSource: "simulated-error-fallback",
        processingTime: `${processingTime}ms`,
        error: error instanceof Error ? error.message : "Unknown error",
        environment: NODE_ENV,
      },
    });
  }
}