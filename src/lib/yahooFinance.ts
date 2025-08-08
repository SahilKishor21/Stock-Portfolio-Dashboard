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

const getYahooSymbol = (nseCode: string): string => {
  const symbolMap: Record<string, string> = {
    'HDFCBANK': 'HDFCBANK.NS',
    'BAJFINANCE': 'BAJFINANCE.NS',
    'ICICIBANK': 'ICICIBANK.NS',
    'AXISBANK': 'AXISBANK.NS',
    'KOTAKBANK': 'KOTAKBANK.NS',
    'SBIN': 'SBIN.NS',
    'TCS': 'TCS.NS',
    'INFY': 'INFY.NS',
    'WIPRO': 'WIPRO.NS',
    'TECHM': 'TECHM.NS',
    'HCLTECH': 'HCLTECH.NS',
    'AFFLE': 'AFFLE.NS',
    'HINDUNILVR': 'HINDUNILVR.NS',
    'ITC': 'ITC.NS',
    'NESTLEIND': 'NESTLEIND.NS',
    'BRITANNIA': 'BRITANNIA.NS',
    'RELIANCE': 'RELIANCE.NS',
    'LT': 'LT.NS',
    'TATASTEEL': 'TATASTEEL.NS',
    'JSWSTEEL': 'JSWSTEEL.NS',
    'DRREDDY': 'DRREDDY.NS',
    'CIPLA': 'CIPLA.NS',
    'SUNPHARMA': 'SUNPHARMA.NS',
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
      throw new Error('Invalid response structure');
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

    return {
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

  } catch (error) {
    return null;
  }
};

export const fetchGoogleFinanceData = async (symbol: string): Promise<GoogleFinanceData> => {
  try {
    let responseData: any = null;

    const mockReq = {
      query: { symbol },
      method: 'GET'
    } as any;

    const mockRes = {
      status: (code: number) => mockRes,
      json: (data: any) => {
        responseData = data;
        return responseData;
      }
    } as any;

    await googleFinanceHandler(mockReq, mockRes);
    
    if (!responseData) {
      throw new Error('No response data');
    }
    
    const peRatio = (typeof responseData.peRatio === 'number' && responseData.peRatio > 0) ? responseData.peRatio : null;
    const latestEarnings = (typeof responseData.latestEarnings === 'number' && responseData.latestEarnings > 0) ? responseData.latestEarnings : null;
    
    return {
      peRatio,
      latestEarnings,
      symbol
    };
    
  } catch (error) {
    return {
      peRatio: null,
      latestEarnings: null,
      symbol
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
    const [yahooResult, googleResult] = await Promise.allSettled([
      fetchYahooFinanceData(nseCode),
      fetchGoogleFinanceData(nseCode)
    ]);

    const yahoo = yahooResult.status === 'fulfilled' ? yahooResult.value : null;
    const google = googleResult.status === 'fulfilled' ? googleResult.value : null;

    if (!yahoo) {
      return null;
    }

    return {
      symbol: nseCode,
      price: yahoo.currentPrice,
      change: yahoo.change,
      changePercent: yahoo.changePercent / 100,
      peRatio: google?.peRatio || undefined,
      earnings: google?.latestEarnings || undefined,
    };

  } catch (error) {
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
  
  for (let i = 0; i < stockSymbols.length; i++) {
    const symbol = stockSymbols[i];
    const realData = await fetchYahooAndGoogleData(symbol);
    
    if (realData) {
      updates.push(realData);
    }

    if (i < stockSymbols.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }
  
  return updates;
};