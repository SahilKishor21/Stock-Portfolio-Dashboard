import { NextApiRequest, NextApiResponse } from 'next'

async function fetchGoogleFinanceData(symbol: string) {
    console.log(`Fetching data for ${symbol}...`)
    
    try {
        const yahooData = await tryYahooFinance(symbol)
        if (yahooData.price !== null) {
            console.log(`Yahoo Finance success for ${symbol}: ₹${yahooData.price}`)
            return yahooData
        }

        const googleData = await tryGoogleFinanceScraping(symbol)
        if (googleData.price !== null) {
            console.log(`Google Finance scraping success for ${symbol}: ₹${googleData.price}`)
            return googleData
        }

        throw new Error(`No data available for ${symbol}`)
        
    } catch (error) {
        console.error(`All data sources failed for ${symbol}:`, error instanceof Error ? error.message : String(error))
        throw error
    }
}

async function tryYahooFinance(symbol: string) {
    try {
        let yahooSymbol = symbol
        if (!symbol.includes('.')) {
            yahooSymbol = `${symbol}.NS`
        }

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })

        if (!response.ok) {
            throw new Error(`Yahoo Finance API error: ${response.status}`)
        }

        const data = await response.json()
        const result = data?.chart?.result?.[0]

        if (!result || !result.meta || typeof result.meta.regularMarketPrice !== 'number') {
            throw new Error('Invalid Yahoo Finance response structure')
        }

        return {
            price: result.meta.regularMarketPrice,
            change: result.meta.regularMarketPrice - (result.meta.previousClose || result.meta.regularMarketPrice),
            changePercent: ((result.meta.regularMarketPrice - (result.meta.previousClose || result.meta.regularMarketPrice)) / (result.meta.previousClose || result.meta.regularMarketPrice)) * 100,
            volume: result.meta.regularMarketVolume || 0,
            marketCap: result.meta.marketCap || 0,
            source: 'yahoo-finance'
        }

    } catch (error) {
        console.log(`Yahoo Finance failed for ${symbol}:`, error instanceof Error ? error.message : String(error))
        return { price: null, change: null, changePercent: null, volume: null, marketCap: null }
    }
}

async function tryGoogleFinanceScraping(symbol: string) {
    try {
        const urls = [
            `https://www.google.com/finance/quote/${symbol}:NSE`,
            `https://www.google.com/finance/quote/${symbol}:BOM`
        ]

        for (const url of urls) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                    }
                })

                if (!response.ok) continue

                const html = await response.text()
                
                const priceMatch = html.match(/"c"\s*:\s*\[\s*,\s*,\s*"([^"]+)"/i) || 
                                                    html.match(/data-last-price="([^"]+)"/i) ||
                                                    html.match(/class="[^"]*YMlKec[^"]*"[^>]*>([^<]+)</i)

                if (priceMatch) {
                    const priceStr = priceMatch[1].replace(/[₹,\s]/g, '')
                    const price = parseFloat(priceStr)
                    
                    if (!isNaN(price) && price > 0) {
                        return {
                            price,
                            change: 0,
                            changePercent: 0,
                            volume: 0,
                            marketCap: 0,
                            source: 'google-finance-scraping'
                        }
                    }
                }

            } catch (urlError) {
                console.log(`Failed Google Finance URL ${url}:`, urlError instanceof Error ? urlError.message : String(urlError))
                continue
            }
        }

        return { price: null, change: null, changePercent: null, volume: null, marketCap: null }

    } catch (error) {
        console.log(`Google Finance scraping failed for ${symbol}:`, error instanceof Error ? error.message : String(error))
        return { price: null, change: null, changePercent: null, volume: null, marketCap: null }
    }
}

function generateMockStockData(symbol: string) {
    const hash = symbol.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
    }, 0)
    
    const basePrice = Math.abs(hash % 1000) + 100
    const variation = (Math.abs(hash) % 100) / 10
    const isPositive = hash % 2 === 0
    
    const change = isPositive ? variation : -variation
    const changePercent = (change / basePrice) * 100
    
    return {
        price: basePrice + change,
        change,
        changePercent,
        volume: Math.abs(hash % 100000) + 10000,
        marketCap: (basePrice + change) * (Math.abs(hash % 100000) + 10000),
        source: 'mock-data'
    }
}

async function simulateMarketData(symbols: string[]) {
    console.log('Fetching market data for symbols:', symbols)
    
    const marketData: Record<string, any> = {}
    
    for (const symbol of symbols) {
        try {
            const data = await fetchGoogleFinanceData(symbol)
            marketData[symbol] = data
        } catch (error) {
            console.warn(`Using mock data for ${symbol} due to API failure`)
            marketData[symbol] = generateMockStockData(symbol)
        }
    }
    
    return marketData
}

async function fetchMarketData() {
    const symbols = ['HDFCBANK', 'BAJFINANCE', 'ICICIBANK', 'AFFLE', 'INFY', 'TCS']
    
    try {
        console.log('Starting market data fetch...')
        const data = await simulateMarketData(symbols)
        console.log('Market data fetch completed')
        return data
    } catch (error) {
        console.error('Error in fetchMarketData:', error)
        const mockData: Record<string, any> = {}
        symbols.forEach(symbol => {
            mockData[symbol] = generateMockStockData(symbol)
        })
        return mockData
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        console.log('Portfolio API called')
        const marketData = await fetchMarketData()
        
        const portfolio = {
            holdings: [
                { symbol: 'HDFCBANK', quantity: 10, avgPrice: 1500 },
                { symbol: 'BAJFINANCE', quantity: 5, avgPrice: 7000 },
                { symbol: 'ICICIBANK', quantity: 15, avgPrice: 900 },
                { symbol: 'AFFLE', quantity: 20, avgPrice: 1200 },
                { symbol: 'INFY', quantity: 25, avgPrice: 1400 },
                { symbol: 'TCS', quantity: 8, avgPrice: 3500 }
            ],
            marketData,
            timestamp: new Date().toISOString()
        }

        console.log('Sending portfolio response')
        res.status(200).json({
            success: true,
            data: portfolio
        })
        
    } catch (error) {
        console.error('Portfolio API error:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch portfolio data',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}
