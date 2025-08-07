import { useEffect, useRef } from 'react'
import { usePortfolioStore } from '@/store/portfolioStore'

export const useAutoRefresh = () => {
  const { 
    refreshPortfolio, 
    isAutoRefresh, 
    refreshInterval, 
    isLoading,
    stocks
  } = usePortfolioStore()
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasInitialData = stocks.length > 0

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (!hasInitialData && !isLoading) {
      refreshPortfolio()
    }

    if (isAutoRefresh && !isLoading) {
      intervalRef.current = setInterval(() => {
        refreshPortfolio()
      }, refreshInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isAutoRefresh, refreshInterval, refreshPortfolio, isLoading, hasInitialData])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])
}