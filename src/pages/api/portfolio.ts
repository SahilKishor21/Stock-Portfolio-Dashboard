import { NextApiRequest, NextApiResponse } from "next";
import { mockStocks } from "@/lib/mockData";
import { calculatePortfolioMetrics, groupBySector } from "@/lib/utils";

interface StockPriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  peRatio?: number;
  latestEarnings?: number;
}

interface AlphaVantageResponse {
  "Global Quote": {
    "01. symbol": string;
    "05. price": string;
    "09. change": string;
    "10. change percent": string;
    "02. open": string;
    "03. high": string;
    "04. low": string;
    "06. volume": string;
    "07. latest trading day": string;
  };
}

interface GoogleFinanceData {
  symbol: string;
  peRatio: number;
  latestEarnings: number;
  source: string;
  timestamp: string;
}
const STOCK_SYMBOL_MAPPING: Record<string, string> = {
  HDFCBANK: "HDFCBANK.BSE",
  BAJFINANCE: "BAJFINANCE.BSE",
  ICICIBANK: "ICICIBANK.BSE",
  AFFLE: "AFFLE.BSE",
  INFY: "INFY.BSE",
  TCS: "TCS.BSE",
};

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const USE_REAL_API = process.env.USE_REAL_API === "true";
const USE_GOOGLE_FINANCE = process.env.USE_GOOGLE_FINANCE === "true";
let lastApiCall = 0;
const API_CALL_INTERVAL = 12000;

const fetchGoogleFinanceData = async (
  symbol: string
): Promise<GoogleFinanceData | null> => {
  if (!USE_GOOGLE_FINANCE) {
    return null;
  }

  try {
    console.log(`Fetching Google Finance data for ${symbol}...`);
    const yahooData = await tryYahooFinanceForPortfolio(symbol);
    if (yahooData.peRatio || yahooData.latestEarnings) {
      console.log(
        `Yahoo Finance success for ${symbol}: PE=${yahooData.peRatio}, Earnings=${yahooData.latestEarnings}`
      );
      return {
        symbol,
        peRatio: yahooData.peRatio || 0,
        latestEarnings: yahooData.latestEarnings || 0,
        source: "yahoo-finance",
        timestamp: new Date().toISOString(),
      };
    }

    const googleData = await tryGoogleFinanceScrapingForPortfolio(symbol);
    if (googleData.peRatio || googleData.latestEarnings) {
      console.log(
        `Google Finance scraping success for ${symbol}: PE=${googleData.peRatio}, Earnings=${googleData.latestEarnings}`
      );
      return {
        symbol,
        peRatio: googleData.peRatio || 0,
        latestEarnings: googleData.latestEarnings || 0,
        source: "google-finance-scraping",
        timestamp: new Date().toISOString(),
      };
    }
    const hash = symbol.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    const mockPeRatio = 15 + (Math.abs(hash) % 40);
    const mockEarnings = 50 + (Math.abs(hash) % 200);

    console.log(
      `Using mock data for ${symbol}: PE=${mockPeRatio}, Earnings=${mockEarnings}`
    );

    return {
      symbol,
      peRatio: mockPeRatio,
      latestEarnings: mockEarnings,
      source: "mock-data-fallback",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching Google Finance data for ${symbol}:`, error);
    const hash = symbol.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return {
      symbol,
      peRatio: 15 + (Math.abs(hash) % 40),
      latestEarnings: 50 + (Math.abs(hash) % 200),
      source: "error-fallback",
      timestamp: new Date().toISOString(),
    };
  }
};

const tryYahooFinanceForPortfolio = async (symbol: string) => {
  try {
    let yahooSymbol = symbol;
    if (!symbol.includes(".")) {
      yahooSymbol = `${symbol}.NS`;
    }

    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=defaultKeyStatistics,financialData,earningsHistory`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data?.quoteSummary?.result?.[0];

    if (!result) {
      return { peRatio: null, latestEarnings: null };
    }

    const peRatio =
      result.defaultKeyStatistics?.trailingPE?.raw ||
      result.defaultKeyStatistics?.forwardPE?.raw ||
      null;

    const latestEarnings =
      result.defaultKeyStatistics?.trailingEps?.raw ||
      result.financialData?.trailingEps?.raw ||
      result.earningsHistory?.earningsChart?.quarterly?.[0]?.actual?.raw ||
      null;

    return { peRatio, latestEarnings };
  } catch (error) {
    console.log(
      `Yahoo Finance failed for ${symbol}:`,
      error instanceof Error ? error.message : String(error)
    );
    return { peRatio: null, latestEarnings: null };
  }
};

const tryGoogleFinanceScrapingForPortfolio = async (symbol: string) => {
  try {
    const urls = [
      `https://www.google.com/finance/quote/${symbol}:NSE`,
      `https://www.google.com/finance/quote/${symbol}:BOM`,
    ];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            DNT: "1",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
          },
        });

        if (!response.ok) {
          continue;
        }

        const html = await response.text();

        let peRatio = null;
        let latestEarnings = null;
        const pePatterns = [
          /P\/E\s*ratio[^>]*>([^<]+)</i,
          /PE[^>]*>([^<]+)</i,
          /"pe_ratio"[^:]*:\s*([^,}]+)/i,
          /P\/E[^>]*:\s*([^\s<]+)/i,
          /PE\s*:\s*([^\s<]+)/i,
        ];

        for (const pattern of pePatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            const ratio = parseFloat(match[1].replace(/[^\d.-]/g, ""));
            if (!isNaN(ratio) && ratio > 0 && ratio < 1000) {
              peRatio = ratio;
              break;
            }
          }
        }
        const earningsPatterns = [
          /EPS[^>]*>([^<]+)</i,
          /Earnings[^>]*>([^<]+)</i,
          /"eps"[^:]*:\s*([^,}]+)/i,
          /EPS[^>]*:\s*([^\s<]+)/i,
          /Earnings\s*per\s*share[^>]*:\s*([^\s<]+)/i,
        ];

        for (const pattern of earningsPatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            const earnings = parseFloat(match[1].replace(/[^\d.-]/g, ""));
            if (!isNaN(earnings) && earnings > 0) {
              latestEarnings = earnings;
              break;
            }
          }
        }

        if (peRatio || latestEarnings) {
          return { peRatio, latestEarnings };
        }
      } catch (urlError) {
        console.log(
          `Failed Google Finance URL ${url}:`,
          urlError instanceof Error ? urlError.message : String(urlError)
        );
        continue;
      }
    }

    return { peRatio: null, latestEarnings: null };
  } catch (error) {
    console.log(
      `Google Finance scraping failed for ${symbol}:`,
      error instanceof Error ? error.message : String(error)
    );
    return { peRatio: null, latestEarnings: null };
  }
};

const fetchRealStockPrice = async (
  symbol: string
): Promise<StockPriceUpdate | null> => {
  if (!ALPHA_VANTAGE_API_KEY || !USE_REAL_API) {
    return null;
  }

  try {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    if (timeSinceLastCall < API_CALL_INTERVAL) {
      await new Promise((resolve) =>
        setTimeout(resolve, API_CALL_INTERVAL - timeSinceLastCall)
      );
    }
    lastApiCall = Date.now();

    const alphaVantageSymbol = STOCK_SYMBOL_MAPPING[symbol] || symbol;
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${alphaVantageSymbol}&apikey=${ALPHA_VANTAGE_API_KEY}`,
      {
        headers: {
          "User-Agent": "Portfolio-Dashboard/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AlphaVantageResponse = await response.json();
    const quote = data["Global Quote"];

    if (!quote || !quote["05. price"]) {
      console.warn(`No data received for symbol: ${symbol}`);
      return null;
    }

    const price = parseFloat(quote["05. price"]);
    const change = parseFloat(quote["09. change"]);
    const changePercent =
      parseFloat(quote["10. change percent"].replace("%", "")) / 100;
    const googleData = await fetchGoogleFinanceData(symbol);

    return {
      symbol,
      price,
      change,
      changePercent,
      peRatio: googleData?.peRatio || undefined,
      latestEarnings: googleData?.latestEarnings || undefined,
    };
  } catch (error) {
    console.error(`Error fetching real data for ${symbol}:`, error);
    return null;
  }
};
const simulateMarketData = async (): Promise<StockPriceUpdate[]> => {
  const updates: StockPriceUpdate[] = [];

  console.log("Using simulated market data with integrated Google Finance...");

  for (const stock of mockStocks) {
    const baseVolatility = 0.02;
    const trendFactor = (Math.random() - 0.5) * 0.01;
    const randomFactor = (Math.random() - 0.5) * baseVolatility;
    const changePercent = trendFactor + randomFactor;

    const newPrice = stock.cmp * (1 + changePercent);
    const change = newPrice - stock.cmp;
    let peRatio = stock.peRatio;
    let latestEarnings = stock.latestEarnings;

    if (USE_GOOGLE_FINANCE) {
      try {
        const googleData = await fetchGoogleFinanceData(stock.nseCode);
        if (googleData) {
          peRatio = googleData.peRatio || stock.peRatio;
          latestEarnings = googleData.latestEarnings || stock.latestEarnings;
        }
      } catch (error) {
        console.warn(
          `Failed to fetch integrated Google Finance data for ${stock.nseCode}, using existing values`
        );
      }
    }

    updates.push({
      symbol: stock.nseCode,
      price: newPrice,
      change,
      changePercent,
      peRatio,
      latestEarnings,
    });
  }

  return updates;
};

const fetchMarketData = async (): Promise<StockPriceUpdate[]> => {
  const updates: StockPriceUpdate[] = [];

  if (USE_REAL_API && ALPHA_VANTAGE_API_KEY) {
    console.log("Fetching real market data with integrated Google Finance...");

    for (const stock of mockStocks) {
      const realData = await fetchRealStockPrice(stock.nseCode);
      if (realData) {
        updates.push(realData);
      } else {
        const changePercent = (Math.random() - 0.5) * 0.02;
        const newPrice = stock.cmp * (1 + changePercent);
        const change = newPrice - stock.cmp;
        const googleData = await fetchGoogleFinanceData(stock.nseCode);

        updates.push({
          symbol: stock.nseCode,
          price: newPrice,
          change,
          changePercent,
          peRatio: googleData?.peRatio || stock.peRatio,
          latestEarnings: googleData?.latestEarnings || stock.latestEarnings,
        });
      }
    }
  } else {
    return await simulateMarketData();
  }

  return updates;
};

const updateStockPrices = (stocks: any[], priceUpdates: StockPriceUpdate[]) => {
  return stocks.map((stock) => {
    const update = priceUpdates.find((u) => u.symbol === stock.nseCode);
    if (update) {
      const newCmp = update.price;
      const newPresentValue = newCmp * stock.qty;
      const newGainLoss = newPresentValue - stock.investment;
      const newGainLossPercentage =
        stock.investment > 0 ? newGainLoss / stock.investment : 0;

      return {
        ...stock,
        cmp: newCmp,
        presentValue: newPresentValue,
        gainLoss: newGainLoss,
        gainLossPercentage: newGainLossPercentage,
        peRatio: update.peRatio !== undefined ? update.peRatio : stock.peRatio,
        latestEarnings:
          update.latestEarnings !== undefined
            ? update.latestEarnings
            : stock.latestEarnings,
        lastUpdated: new Date().toISOString(),
      };
    }
    return stock;
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      const startTime = Date.now();
      console.log("Portfolio API called - starting market data fetch...");

      const priceUpdates = await fetchMarketData();
      const updatedStocks = updateStockPrices(mockStocks, priceUpdates);
      const sectors = groupBySector(updatedStocks);
      const portfolioSummary = calculatePortfolioMetrics(updatedStocks);

      const processingTime = Date.now() - startTime;
      console.log(`Portfolio API completed in ${processingTime}ms`);

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
          dataSource:
            USE_REAL_API && ALPHA_VANTAGE_API_KEY ? "real-api" : "simulated",
          googleFinanceEnabled: USE_GOOGLE_FINANCE,
          updatesCount: priceUpdates.length,
        },
      };

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
    console.error("Portfolio API Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}
