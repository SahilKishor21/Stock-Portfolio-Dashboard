import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Stock, SectorSummary, PortfolioSummary } from '@/types/portfolio'

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
  dataSource: string
  
  setStocks: (stocks: Stock[]) => void
  setSectors: (sectors: SectorSummary[]) => void
  setPortfolioSummary: (summary: PortfolioSummary) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setLastUpdated: (timestamp: string) => void
  setDataSource: (source: string) => void
  updateStock: (stockId: number, updatedData: Partial<Stock>) => void
  refreshPortfolio: (force?: boolean) => void
  setRefreshInterval: (interval: number) => void
  toggleAutoRefresh: () => void
  setSelectedSector: (sector: string | null) => void
}

const shouldRefresh = (lastUpdated: string | null, dataSource: string): boolean => {
  if (!lastUpdated) return true
  
  const now = Date.now()
  const lastUpdate = new Date(lastUpdated).getTime()
  const timeDiff = now - lastUpdate
  
  let refreshThreshold: number
  
  if (dataSource.includes('yahoo-finance-real')) {
    refreshThreshold = 5 * 60 * 1000 
  } else if (dataSource.includes('mixed') || dataSource.includes('yahoo')) {
    refreshThreshold = 3 * 60 * 1000 
  } else {
    refreshThreshold = 10 * 60 * 1000 
  }
  
  return timeDiff > refreshThreshold
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      stocks: [],
      sectors: [],
      portfolioSummary: null,
      isLoading: false,
      error: null,
      lastUpdated: null,
      refreshInterval: 300000, 
      isAutoRefresh: true,
      selectedSector: null,
      dataSource: 'unknown',

      setStocks: (stocks) => set({ stocks }),
      setSectors: (sectors) => set({ sectors }),
      setPortfolioSummary: (summary) => set({ portfolioSummary: summary }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setLastUpdated: (timestamp) => set({ lastUpdated: timestamp }),
      setDataSource: (source) => {
        const currentSource = get().dataSource
        if (source !== currentSource) {
          let newInterval = get().refreshInterval
          if (source.includes('yahoo-finance-real')) {
            newInterval = 300000 
          } else if (source.includes('mixed') || source.includes('yahoo')) {
            newInterval = 180000 
          } else {
            newInterval = 600000 
          }
          
          set({ 
            dataSource: source,
            refreshInterval: newInterval
          })
        }
      },
      
      updateStock: (stockId, updatedData) => {
        const { stocks } = get()
        const updatedStocks = stocks.map(stock => 
          stock.id === stockId ? { ...stock, ...updatedData } : stock
        )
        set({ stocks: updatedStocks })
      },
      
      refreshPortfolio: async (force = false) => {
        const { isLoading, lastUpdated, dataSource } = get()
        
        if (isLoading) {
          return
        }
        
        if (!force && !shouldRefresh(lastUpdated, dataSource)) {
          return
        }
        
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/portfolio', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'X-Bypass-Cache': force ? 'true' : 'false'
            },
          })
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const data = await response.json()
          
          if (data.success) {
            set({
              stocks: data.data.stocks,
              sectors: data.data.sectors,
              portfolioSummary: data.data.summary,
              lastUpdated: new Date().toISOString(),
              dataSource: data.metadata?.dataSource || 'unknown',
              isLoading: false,
              error: null,
            })
          } else {
            throw new Error(data.error || 'API returned unsuccessful response')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
          
          set({
            error: errorMessage,
            isLoading: false,
          })
        }
      },
      
      setRefreshInterval: (interval) => {
        set({ refreshInterval: interval })
      },
      
      toggleAutoRefresh: () => {
        const { isAutoRefresh } = get()
        set({ isAutoRefresh: !isAutoRefresh })
      },
      
      setSelectedSector: (sector) => {
        set({ selectedSector: sector })
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