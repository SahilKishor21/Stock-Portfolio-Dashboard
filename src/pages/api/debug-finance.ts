// pages/api/debug-finance.ts
import { NextApiRequest, NextApiResponse } from 'next';

interface DebugResponse {
  success: boolean;
  timestamp: string;
  environment: string;
  requestDetails: {
    method: string;
    url: string;
    query: any;
    headers: any;
  };
  apiTests: {
    googleFinanceRoute: {
      exists: boolean;
      testResult?: any;
      error?: string;
    };
    yahooFinance: {
      testResult?: any;
      error?: string;
    };
  };
  message: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<DebugResponse>) {
  console.log('🔧 Debug Finance API called');
  
  const response: DebugResponse = {
    success: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    requestDetails: {
      method: req.method || 'unknown',
      url: req.url || 'unknown',
      query: req.query,
      headers: {
        userAgent: req.headers['user-agent'],
        accept: req.headers.accept,
        host: req.headers.host
      }
    },
    apiTests: {
      googleFinanceRoute: {
        exists: false
      },
      yahooFinance: {}
    },
    message: 'Debug information collected'
  };

  try {
    // Test 1: Try to call our Google Finance API route
    console.log('🧪 Testing Google Finance API route...');
    try {
      const testSymbol = 'TCS';
      const testUrl = `${req.headers.host ? `http://${req.headers.host}` : 'http://localhost:3000'}/api/google-finance/${testSymbol}`;
      
      console.log(`🔗 Testing URL: ${testUrl}`);
      
      const apiResponse = await fetch(testUrl, {
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      response.apiTests.googleFinanceRoute.exists = true;
      response.apiTests.googleFinanceRoute.testResult = {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        ok: apiResponse.ok,
        data: await apiResponse.json()
      };
      
      console.log('✅ Google Finance API route test passed');
      
    } catch (error) {
      response.apiTests.googleFinanceRoute.error = error instanceof Error ? error.message : String(error);
      console.log('❌ Google Finance API route test failed:', response.apiTests.googleFinanceRoute.error);
    }

    // Test 2: Try Yahoo Finance directly
    console.log('🧪 Testing Yahoo Finance API directly...');
    try {
      const yahooUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/TCS.NS';
      const yahooResponse = await fetch(yahooUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      response.apiTests.yahooFinance.testResult = {
        status: yahooResponse.status,
        statusText: yahooResponse.statusText,
        ok: yahooResponse.ok,
        hasData: yahooResponse.ok
      };
      
      console.log('✅ Yahoo Finance direct test passed');
      
    } catch (error) {
      response.apiTests.yahooFinance.error = error instanceof Error ? error.message : String(error);
      console.log('❌ Yahoo Finance direct test failed:', response.apiTests.yahooFinance.error);
    }

  } catch (error) {
    response.success = false;
    response.message = `Debug failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error('❌ Debug API error:', error);
  }

  res.status(200).json(response);
}