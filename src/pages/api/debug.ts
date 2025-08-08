import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test external API call
    const testResponse = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/HDFCBANK.NS', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Portfolio-Dashboard/1.0)'
      }
    });
    
    res.status(200).json({
      success: true,
      environment: process.env.NODE_ENV,
      useRealApi: process.env.USE_REAL_API,
      yahooApiTest: {
        status: testResponse.status,
        ok: testResponse.ok,
        headers: Object.fromEntries(testResponse.headers.entries())
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(200).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error),
      environment: process.env.NODE_ENV,
      useRealApi: process.env.USE_REAL_API,
      timestamp: new Date().toISOString()
    });
  }
}