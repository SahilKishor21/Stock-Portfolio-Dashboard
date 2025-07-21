interface GoogleFinanceData {
    peRatio: number | null
    latestEarnings: number | null
    symbol: string
}

export const fetchGoogleFinanceData = async (symbol: string): Promise<GoogleFinanceData> => {
    try {
        const response = await fetch(`/api/google-finance/${symbol}`)
        if (!response.ok) throw new Error('Failed to fetch Google Finance data')
        
        const data = await response.json()
        return {
            peRatio: data.peRatio || null,
            latestEarnings: data.latestEarnings || null,
            symbol
        }
    } catch (error) {
        return {
            peRatio: null,
            latestEarnings: null,
            symbol
        }
    }
}
