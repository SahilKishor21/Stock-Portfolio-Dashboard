import { NextApiRequest, NextApiResponse } from 'next';

const mockMarketData = (symbol: string) => {
  const basePrice = Math.random() * 5000 + 100;
  const changePercent = (Math.random() - 0.5) * 0.1;
  const change = basePrice * changePercent;
  
  return {
    symbol,
    price: basePrice + change,
    change,
    changePercent,
    volume: Math.floor(Math.random() * 1000000),
    high: basePrice + Math.abs(change) + Math.random() * 50,
    low: basePrice - Math.abs(change) - Math.random() * 50,
    open: basePrice + (Math.random() - 0.5) * 20,
    previousClose: basePrice,
    marketCap: (basePrice + change) * (Math.random() * 10000000 + 1000000),
    peRatio: Math.random() * 50 + 5,
    earnings: Math.random() * 200 + 10,
    lastUpdated: new Date().toISOString(),
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { symbol } = req.query;
    
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Symbol parameter is required',
        timestamp: new Date().toISOString(),
      });
    }
    
    if (req.method === 'GET') {
      const marketData = mockMarketData(symbol.toUpperCase());
      
      res.status(200).json({
        success: true,
        data: marketData,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).json({
        success: false,
        error: `Method ${req.method} Not Allowed`,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Market API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
    });
  }
}