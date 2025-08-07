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
  symbol: string;
  peRatio: number | null;
  latestEarnings: number | null;
}

const getYahooSymbol = (nseCode: string): string => {
  const symbolMap: Record<string, string> = {
    // Financial Sector
    'HDFCBANK': 'HDFCBANK.NS',
    'BAJFINANCE': 'BAJFINANCE.NS',
    'ICICIBANK': 'ICICIBANK.NS',
    'AXISBANK': 'AXISBANK.NS',
    'KOTAKBANK': 'KOTAKBANK.NS',
    'SBIN': 'SBIN.NS',
    
    // Tech Sector
    'TCS': 'TCS.NS',
    'INFY': 'INFY.NS',
    'WIPRO': 'WIPRO.NS',
    'TECHM': 'TECHM.NS',
    'HCLTECH': 'HCLTECH.NS',
    'AFFLE': 'AFFLE.NS',
    
    // Consumer Goods
    'HINDUNILVR': 'HINDUNILVR.NS',
    'ITC': 'ITC.NS',
    'NESTLEIND': 'NESTLEIND.NS',
    'BRITANNIA': 'BRITANNIA.NS',
    
    // Industrial
    'RELIANCE': 'RELIANCE.NS',
    'LT': 'LT.NS',
    'TATASTEEL': 'TATASTEEL.NS',
    'JSWSTEEL': 'JSWSTEEL.NS',
    
    // Healthcare
    'DRREDDY': 'DRREDDY.NS',
    'CIPLA': 'CIPLA.NS',
    'SUNPHARMA': 'SUNPHARMA.NS',
    
    // Auto
    'MARUTI': 'MARUTI.NS',
    'M&M': 'M&M.NS',
    'TATAMOTORS': 'TATAMOTORS.NS'
  };
  
  return symbolMap[nseCode] || `${nseCode}.NS`;
};

export const fetchYahooFinanceData = async (nseCode: string): Promise<YahooFinanceQuote | null> => {
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
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      throw new Error('Invalid Yahoo Finance response structure');
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    
    if (!quote || !meta) {
      throw new Error('Missing quote data');
    }

    const lastIndex = quote.close.length - 1;
    const currentPrice = quote.close[lastIndex];
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    const yahooData: YahooFinanceQuote = {
      symbol: nseCode,
      currentPrice: Number(currentPrice.toFixed(2)),
      previousClose: Number(previousClose.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume: quote.volume[lastIndex] || 0,
      high: Number(quote.high[lastIndex].toFixed(2)),
      low: Number(quote.low[lastIndex].toFixed(2)),
      open: Number(quote.open[lastIndex].toFixed(2))
    };

    return yahooData;

  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Yahoo Finance failed for ${nseCode}:`, error.message);
    } else {
      console.error(`❌ Yahoo Finance failed for ${nseCode}:`, error);
    }
    return null;
  }
};

export const fetchGoogleFinanceData = async (nseCode: string): Promise<GoogleFinanceData | null> => {
  try {
    return {
      symbol: nseCode,
      peRatio: null,
      latestEarnings: null
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Google Finance failed for ${nseCode}:`, error.message);
    } else {
      console.error(`❌ Google Finance failed for ${nseCode}:`, error);
    }
    return {
      symbol: nseCode,
      peRatio: null,
      latestEarnings: null
    };
  }
};

export const fetchYahooAndGoogleData = async (nseCode: string): Promise<{
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  peRatio?: number;
  earnings?: number;
} | null> => {
  try {
    const yahooData = await fetchYahooFinanceData(nseCode);
    
    if (!yahooData) {
      return null;
    }

    const googleData = await fetchGoogleFinanceData(nseCode);

    return {
      symbol: nseCode,
      price: yahooData.currentPrice,
      change: yahooData.change,
      changePercent: yahooData.changePercent / 100,
      peRatio: googleData?.peRatio || undefined,
      earnings: googleData?.latestEarnings || undefined,
    };

  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Combined fetch failed for ${nseCode}:`, error.message);
    } else {
      console.error(`❌ Combined fetch failed for ${nseCode}:`, error);
    }
    return null;
  }
};

export const fetchRealMarketDataYahoo = async (stockSymbols: string[]): Promise<Array<{
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  peRatio?: number;
  earnings?: number;
}>> => {
  const updates: Array<{
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    peRatio?: number;
    earnings?: number;
  }> = [];
  
  for (const symbol of stockSymbols) {
    const realData = await fetchYahooAndGoogleData(symbol);
    
    if (realData) {
      updates.push(realData);
    }

    // Add delay between requests to be respectful
    if (stockSymbols.indexOf(symbol) < stockSymbols.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
    }
  }
  
  return updates;
};