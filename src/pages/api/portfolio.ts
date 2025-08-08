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
}

const USE_REAL_API = process.env.USE_REAL_API !== "false";
const NODE_ENV = process.env.NODE_ENV;
const IS_PRODUCTION = NODE_ENV === "production";

console.log("API Environment Configuration:", {
  USE_REAL_API,
  NODE_ENV,
  IS_PRODUCTION,
  timestamp: new Date().toISOString(),
  userAgent: "Portfolio Dashboard API",
});

let lastApiCall = 0;
const API_CALL_INTERVAL = 1000;

const fetchRealMarketData = async (): Promise<StockPriceUpdate[]> => {
  console.log("Starting real market data fetch...");
  console.log("Environment:", { NODE_ENV, IS_PRODUCTION });

  try {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    if (timeSinceLastCall < API_CALL_INTERVAL) {
      await new Promise((resolve) =>
        setTimeout(resolve, API_CALL_INTERVAL - timeSinceLastCall)
      );
    }
    lastApiCall = Date.now();

    const stockSymbols = mockStocks.map((stock) => stock.nseCode);
    console.log(
      `📈 Attempting to fetch data for ${stockSymbols.length} stocks:`,
      stockSymbols.slice(0, 5)
    );

    console.log("Testing single stock fetch first...");
    const testStock = stockSymbols[0];
    const testUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${testStock}.NS`;

    console.log("Test URL:", testUrl);

    const testResponse = await fetch(testUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Portfolio-Dashboard/1.0)",
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(10000),
    });

    console.log("Test response status:", testResponse.status);
    console.log("Test response ok:", testResponse.ok);

    if (!testResponse.ok) {
      throw new Error(
        `Test fetch failed: ${testResponse.status} ${testResponse.statusText}`
      );
    }

    const testData = await testResponse.json();
    console.log("Test fetch successful, proceeding with full fetch...");

    const updates = await fetchRealMarketDataYahoo(stockSymbols);
    console.log(
      `Fetch completed: ${updates.length} successful out of ${stockSymbols.length}`
    );

    return updates;
  } catch (error) {
    console.error("Real market data fetch failed:", error);
    console.error("Error details:", {
      message:
        typeof error === "object" && error !== null && "message" in error
          ? (error as any).message
          : String(error),
      name:
        typeof error === "object" && error !== null && "name" in error
          ? (error as any).name
          : "UnknownError",
      stack:
        typeof error === "object" && error !== null && "stack" in error
          ? (error as any).stack?.substring(0, 200)
          : undefined,
    });

    return [];
  }
};

const simulateMarketData = (): StockPriceUpdate[] => {
  console.log("Using simulated market data...");
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
      peRatio:
        Math.random() > 0.5
          ? Math.round((Math.random() * 40 + 10) * 100) / 100
          : undefined,
      earnings:
        Math.random() > 0.5
          ? Math.round((Math.random() * 200 + 50) * 100) / 100
          : undefined,
    });
  });

  return updates;
};

const updateStockPrices = (stocks: any[], priceUpdates: StockPriceUpdate[]) => {
  return stocks.map((stock) => {
    const update = priceUpdates.find((u) => u.symbol === stock.nseCode);
    if (update) {
      const newCmp = Math.round(update.price * 100) / 100;
      const newPresentValue = Math.round(newCmp * stock.qty * 100) / 100;
      const newGainLoss =
        Math.round((newPresentValue - stock.investment) * 100) / 100;
      const newGainLossPercentage =
        stock.investment > 0 ? newGainLoss / stock.investment : 0;

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now();
  console.log("\n Portfolio API called");
  console.log("Environment:", NODE_ENV);
  console.log("USE_REAL_API:", USE_REAL_API);
  console.log("Timestamp:", new Date().toISOString());

  try {
    if (req.method === "GET") {
      let priceUpdates: StockPriceUpdate[];
      let dataSource: string;

      if (USE_REAL_API) {
        console.log("Attempting REAL API data fetch...");
        priceUpdates = await fetchRealMarketData();

        if (priceUpdates.length === 0) {
          dataSource = "simulated-fallback";
        } else if (priceUpdates.length < mockStocks.length) {
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
        console.log("Real API disabled, using simulation...");
        priceUpdates = simulateMarketData();
        dataSource = "simulated";
      }

      const updatedStocks = updateStockPrices(mockStocks, priceUpdates);
      const sectors = groupBySector(updatedStocks);
      const portfolioSummary = calculatePortfolioMetrics(updatedStocks);

      const processingTime = Date.now() - startTime;

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
          realDataCount: priceUpdates.filter((u) => u.price > 0).length,
          stocksProcessed: updatedStocks.length,
          environment: NODE_ENV,
          useRealApi: USE_REAL_API,
        },
      };

      console.log("API Response Summary:", {
        dataSource: response.metadata.dataSource,
        stocksProcessed: response.metadata.stocksProcessed,
        processingTime: response.metadata.processingTime,
        environment: response.metadata.environment,
      });

      res.status(200).json(response);
    } else if (req.method === "POST") {
      const { stocks } = req.body;

      if (!stocks || !Array.isArray(stocks)) {
        return res.status(400).json({
          success: false,
          error: "Invalid stocks data",
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
          dataSource: "user-provided",
        },
      };

      res.status(200).json(response);
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
    console.error("Portfolio API Error:", error);

    const fallbackStocks = updateStockPrices(mockStocks, simulateMarketData());
    const fallbackSectors = groupBySector(fallbackStocks);
    const fallbackSummary = calculatePortfolioMetrics(fallbackStocks);

    res.status(200).json({
      success: true,
      data: {
        stocks: fallbackStocks,
        sectors: fallbackSectors,
        summary: {
          ...fallbackSummary,
          sectors: fallbackSectors,
        },
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
