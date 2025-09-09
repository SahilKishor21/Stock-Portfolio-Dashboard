interface YahooFinanceQuote {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
}

interface GoogleFinanceData {
  peRatio: number | null
  latestEarnings: number | null
  symbol: string
}

import googleFinanceHandler from '../pages/api/google-finance/[symbol]';

// Storing results for 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; 

const getYahooSymbol = (nseCode: string): string => {
  const symbolMap: Record<string, string> = {
    'HDFCBANK': 'HDFCBANK.NS', 'BAJFINANCE': 'BAJFINANCE.NS', 'ICICIBANK': 'ICICIBANK.NS',
    'AXISBANK': 'AXISBANK.NS', 'KOTAKBANK': 'KOTAKBANK.NS', 'SBIN': 'SBIN.NS',
    'TCS': 'TCS.NS', 'INFY': 'INFY.NS', 'WIPRO': 'WIPRO.NS',
    'TECHM': 'TECHM.NS', 'HCLTECH': 'HCLTECH.NS', 'AFFLE': 'AFFLE.NS',
    'HINDUNILVR': 'HINDUNILVR.NS', 'ITC': 'ITC.NS', 'NESTLEIND': 'NESTLEIND.NS',
    'BRITANNIA': 'BRITANNIA.NS', 'RELIANCE': 'RELIANCE.NS', 'LT': 'LT.NS',
    'TATASTEEL': 'TATASTEEL.NS', 'JSWSTEEL': 'JSWSTEEL.NS', 'DRREDDY': 'DRREDDY.NS',
    'CIPLA': 'CIPLA.NS', 'SUNPHARMA': 'SUNPHARMA.NS', 'MARUTI': 'MARUTI.NS',
    'M&M': 'M&M.NS', 'TATAMOTORS': 'TATAMOTORS.NS'
  };
  return symbolMap[nseCode] || `${nseCode}.NS`;
};

const isValidCacheEntry = (entry: { data: any; timestamp: number }): boolean => {
  return Date.now() - entry.timestamp < CACHE_DURATION;
};

// Helper function to safely get price data with fallbacks
const extractPriceData = (quote: any, meta: any) => {
  const lastIndex = quote.close?.length - 1;
  if (lastIndex < 0) return null;

  // Try multiple sources for current price
  let currentPrice = quote.close[lastIndex];
  if (currentPrice === null || currentPrice === undefined) {
    currentPrice = meta.regularMarketPrice || meta.previousClose;
  }

  // Try multiple sources for previous close
  let previousClose = meta.previousClose || meta.chartPreviousClose || meta.regularMarketPreviousClose;
  if (previousClose === null || previousClose === undefined) {
    previousClose = currentPrice;
  }

  // If we still don't have valid prices, return null
  if (currentPrice === null || currentPrice === undefined || 
      previousClose === null || previousClose === undefined ||
      isNaN(currentPrice) || isNaN(previousClose)) {
    return null;
  }

  return {
    currentPrice: Number(currentPrice),
    previousClose: Number(previousClose),
    volume: quote.volume?.[lastIndex] || 0,
    high: quote.high?.[lastIndex] || currentPrice,
    low: quote.low?.[lastIndex] || currentPrice,
    open: quote.open?.[lastIndex] || previousClose
  };
};

export const fetchYahooFinanceData = async (
  nseCode: string, 
  bypassCache = false
): Promise<YahooFinanceQuote | null> => {
  const cacheKey = `yahoo_${nseCode}`;
  
  // Only check cache if not bypassing
  if (!bypassCache) {
    const cached = cache.get(cacheKey);
    if (cached && isValidCacheEntry(cached)) {
      return cached.data;
    }
  }

  const yahooSymbol = getYahooSymbol(nseCode);
  
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.chart?.result?.[0]) {
      throw new Error('Invalid response structure - no chart result');
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    
    if (!quote || !meta) {
      throw new Error('Missing quote or meta data');
    }

    // Use the improved price extraction logic
    const priceData = extractPriceData(quote, meta);
    
    if (!priceData) {
      // Create fallback data using meta information
      const fallbackPrice = meta.regularMarketPrice || meta.previousClose || 0;
      if (fallbackPrice > 0) {
        const fallbackData = {
          currentPrice: Number(fallbackPrice.toFixed(2)),
          previousClose: Number(fallbackPrice.toFixed(2)), 
          volume: 0,
          high: Number(fallbackPrice.toFixed(2)),
          low: Number(fallbackPrice.toFixed(2)),
          open: Number(fallbackPrice.toFixed(2))
        };
        
        const change = 0; // No change if using fallback
        const changePercent = 0;

        const yahooData = {
          symbol: nseCode,
          currentPrice: fallbackData.currentPrice,
          previousClose: fallbackData.previousClose,
          change: change,
          changePercent: changePercent,
          volume: fallbackData.volume,
          high: fallbackData.high,
          low: fallbackData.low,
          open: fallbackData.open
        };

        cache.set(cacheKey, { data: yahooData, timestamp: Date.now() });
        return yahooData;
      } else {
        throw new Error('No valid price data available from any source');
      }
    }

    const change = priceData.currentPrice - priceData.previousClose;
    const changePercent = priceData.previousClose > 0 ? (change / priceData.previousClose) * 100 : 0;

    const yahooData = {
      symbol: nseCode,
      currentPrice: Number(priceData.currentPrice.toFixed(2)),
      previousClose: Number(priceData.previousClose.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume: priceData.volume,
      high: Number(priceData.high.toFixed(2)),
      low: Number(priceData.low.toFixed(2)),
      open: Number(priceData.open.toFixed(2))
    };
    
    cache.set(cacheKey, { data: yahooData, timestamp: Date.now() });
    return yahooData;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[YAHOO FAILED] ${nseCode}: ${errorMessage}`);
    return null;
  }
};

export const fetchGoogleFinanceData = async (
  symbol: string, 
  bypassCache = false
): Promise<GoogleFinanceData> => {
  const cacheKey = `google_${symbol}`;
  
  if (!bypassCache) {
    const cached = cache.get(cacheKey);
    if (cached && isValidCacheEntry(cached)) {
      return cached.data;
    }
  }

  try {
    let responseData: any = null;

    const mockReq = { query: { symbol }, method: 'GET' } as any;
    const mockRes = {
      status: (code: number) => mockRes,
      json: (data: any) => { responseData = data; return responseData; }
    } as any;

    await googleFinanceHandler(mockReq, mockRes);
    
    if (!responseData) throw new Error('No response data from Google Finance');
    
    const peRatio = (typeof responseData.peRatio === 'number' && responseData.peRatio > 0) ? responseData.peRatio : null;
    const latestEarnings = (typeof responseData.latestEarnings === 'number' && responseData.latestEarnings > 0) ? responseData.latestEarnings : null;
    
    const result = { peRatio, latestEarnings, symbol };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[GOOGLE FAILED] ${symbol}: ${errorMessage}`);
    return { peRatio: null, latestEarnings: null, symbol };
  }
};

export const fetchYahooAndGoogleData = async (
  nseCode: string, 
  bypassCache = false
): Promise<{
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  peRatio?: number;
  earnings?: number;
  marketCap?: number;
} | null> => {
  try {
    const [yahooResult, googleResult] = await Promise.allSettled([
      fetchYahooFinanceData(nseCode, bypassCache),
      fetchGoogleFinanceData(nseCode, bypassCache)
    ]);

    const yahoo = yahooResult.status === 'fulfilled' ? yahooResult.value : null;
    const google = googleResult.status === 'fulfilled' ? googleResult.value : null;

    if (!yahoo) {
      console.error(`[STOCK FAILED] ${nseCode}: Unable to fetch price data`);
      return null;
    }

    return {
      symbol: nseCode,
      price: yahoo.currentPrice,
      change: yahoo.change,
      changePercent: yahoo.changePercent / 100,
      peRatio: google?.peRatio || undefined,
      earnings: google?.latestEarnings || undefined,
      marketCap: undefined 
    };

  } catch (error) {
    console.error(`[STOCK ERROR] ${nseCode}:`, error);
    return null;
  }
};

export const fetchRealMarketDataYahoo = async (
  stockSymbols: string[], 
  bypassCache = false
): Promise<Array<{
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  peRatio?: number;
  earnings?: number;
  marketCap?: number;
}>> => {
  console.log(`[PORTFOLIO REFRESH] Fetching ${stockSymbols.length} stocks${bypassCache ? ' (bypassing cache)' : ''}`);
  
  const BATCH_SIZE = 5;
  const updates: Array<{
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    peRatio?: number;
    earnings?: number;
    marketCap?: number;
  }> = [];

  const failedStocks: string[] = [];

  for (let i = 0; i < stockSymbols.length; i += BATCH_SIZE) {
    const batch = stockSymbols.slice(i, i + BATCH_SIZE);
    
    const batchPromises = batch.map(symbol => fetchYahooAndGoogleData(symbol, bypassCache));
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      const symbol = batch[index];
      if (result.status === 'fulfilled' && result.value) {
        updates.push(result.value);
      } else {
        failedStocks.push(symbol);
      }
    });

    if (i + BATCH_SIZE < stockSymbols.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const successRate = ((updates.length / stockSymbols.length) * 100).toFixed(1);
  console.log(`[PORTFOLIO COMPLETE] ${updates.length}/${stockSymbols.length} stocks fetched (${successRate}% success rate)`);
  
  if (failedStocks.length > 0) {
    console.warn(`[FAILED STOCKS] ${failedStocks.join(', ')}`);
  }
  
  return updates;
};

// Cache cleaner
export const cleanupCache = () => {
  const now = Date.now();
  let cleanedCount = 0;
  cache.forEach((entry, key) => {
    if (now - entry.timestamp > CACHE_DURATION) {
      cache.delete(key);
      cleanedCount++;
    }
  });
  if (cleanedCount > 0) {
    console.log(`[CACHE CLEANUP] Removed ${cleanedCount} expired entries`);
  }
};