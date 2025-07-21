import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Stock, SectorSummary, PortfolioSummary } from '@/types/portfolio'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface PortfolioState {
  stocks: Stock[]
  sectors: SectorSummary[]
  portfolioSummary: PortfolioSummary | null
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
  refreshInterval: number
  isAutoRefresh: boolean
  selectedSector: string | null
  cache: Map<string, CacheEntry<any>>
  wsConnection: WebSocket | null
  isConnected: boolean
  
  // Actions
  setStocks: (stocks: Stock[]) => void
  updateStocks: (stocks: Stock[]) => void
  setSectors: (sectors: SectorSummary[]) => void
  setPortfolioSummary: (summary: PortfolioSummary) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setLastUpdated: (timestamp: string) => void
  updateStock: (stockId: number, updatedData: Partial<Stock>) => void
  refreshPortfolio: () => void
  setRefreshInterval: (interval: number) => void
  toggleAutoRefresh: () => void
  setSelectedSector: (sector: string | null) => void
  getFromCache: <T>(key: string) => T | null
  setCache: <T>(key: string, data: T, ttl?: number) => void
  clearCache: () => void
  connectWebSocket: () => void
  disconnectWebSocket: () => void
}

const CACHE_TTL = 30000 
const WS_URL = 'ws://localhost:3001' 

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      stocks: [],
      sectors: [],
      portfolioSummary: null,
      isLoading: false,
      error: null,
      lastUpdated: null,
      refreshInterval: 15000,
      isAutoRefresh: true,
      selectedSector: null,
      cache: new Map(),
      wsConnection: null,
      isConnected: false,

      setStocks: (stocks) => set({ stocks }),
      
      updateStocks: (stocks) => {
        set({ 
          stocks,
          lastUpdated: new Date().toISOString()
        })
        const { clearCache } = get()
        clearCache()
      },
      
      setSectors: (sectors) => set({ sectors }),
      setPortfolioSummary: (summary) => set({ portfolioSummary: summary }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setLastUpdated: (timestamp) => set({ lastUpdated: timestamp }),
      
      updateStock: (stockId, updatedData) => {
        const { stocks } = get()
        const updatedStocks = stocks.map(stock => 
          stock.id === stockId ? { ...stock, ...updatedData } : stock
        )
        set({ stocks: updatedStocks })
      },
      
      refreshPortfolio: async () => {
        const { getFromCache, setCache } = get()
        const cachedData = getFromCache<any>('portfolio_data')
        if (cachedData) {
          console.log('Using cached portfolio data')
          set({
            stocks: cachedData.stocks,
            sectors: cachedData.sectors,
            portfolioSummary: cachedData.summary,
            lastUpdated: cachedData.timestamp,
          })
          return
        }
        
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/portfolio')
          if (!response.ok) throw new Error('Failed to fetch portfolio')
          
          const data = await response.json()

          setCache('portfolio_data', {
            stocks: data.data.stocks,
            sectors: data.data.sectors,
            summary: data.data.summary,
            timestamp: new Date().toISOString(),
          })
          
          set({
            stocks: data.data.stocks,
            sectors: data.data.sectors,
            portfolioSummary: data.data.summary,
            lastUpdated: new Date().toISOString(),
            isLoading: false,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          })
        }
      },
      
      setRefreshInterval: (interval) => set({ refreshInterval: interval }),
      toggleAutoRefresh: () => set((state) => ({ isAutoRefresh: !state.isAutoRefresh })),
      setSelectedSector: (sector) => set({ selectedSector: sector }),

      getFromCache: <T>(key: string): T | null => {
        const { cache } = get()
        const entry = cache.get(key)
        if (!entry) return null
        
        const now = Date.now()
        if (now > entry.timestamp + entry.ttl) {
          cache.delete(key)
          return null
        }
        
        return entry.data as T
      },
      
      setCache: <T>(key: string, data: T, ttl = CACHE_TTL) => {
        const { cache } = get()
        cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl,
        })
      },
      
      clearCache: () => {
        const { cache } = get()
        cache.clear()
      },
      
      connectWebSocket: () => {
        try {
          const ws = new WebSocket(WS_URL)
          
          ws.onopen = () => {
            console.log('WebSocket connected')
            set({ wsConnection: ws, isConnected: true })
          }
          
          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data)
              if (data.type === 'STOCK_UPDATE') {
                const { updateStock } = get()
                updateStock(data.stockId, data.data)
              }
            } catch (error) {
              console.error('WebSocket message error:', error)
            }
          }
          
          ws.onclose = () => {
            console.log('WebSocket disconnected')
            set({ wsConnection: null, isConnected: false })
          }
          
          ws.onerror = (error) => {
            console.error('WebSocket error:', error)
            set({ error: 'WebSocket connection failed' })
          }
          
        } catch (error) {
          console.error('Failed to connect WebSocket:', error)
        }
      },
      
      disconnectWebSocket: () => {
        const { wsConnection } = get()
        if (wsConnection) {
          wsConnection.close()
          set({ wsConnection: null, isConnected: false })
        }
      },
    }),
    {
      name: 'portfolio-storage',
      partialize: (state) => ({
        refreshInterval: state.refreshInterval,
        isAutoRefresh: state.isAutoRefresh,
        selectedSector: state.selectedSector,
      }),
    }
  )
)