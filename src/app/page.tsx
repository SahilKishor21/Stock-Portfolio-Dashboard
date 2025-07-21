"use client"

import { useEffect } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { PortfolioSummary } from '@/components/portfolio-summary'
import { SectorOverview } from '@/components/sector-overview'
import { PortfolioTable } from '@/components/portfolio-table'
import { usePortfolioStore } from '@/store/portfolioStore'

export default function HomePage() {
  const { 
    refreshPortfolio, 
    isAutoRefresh, 
    refreshInterval,
    stocks,
    setStocks,
    setSectors,
    setPortfolioSummary,
    setLastUpdated
  } = usePortfolioStore()

  useEffect(() => {
    const initializePortfolio = async () => {
      try {
        const response = await fetch('/api/portfolio')
        const data = await response.json()
        
        if (data.success) {
          setStocks(data.data.stocks)
          setSectors(data.data.sectors)
          setPortfolioSummary(data.data.summary)
          setLastUpdated(new Date().toISOString())
        }
      } catch (error) {
        console.error('Failed to initialize portfolio:', error)
      }
    }

    if (stocks.length === 0) {
      initializePortfolio()
    }
  }, [stocks.length, setStocks, setSectors, setPortfolioSummary, setLastUpdated])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isAutoRefresh) {
      interval = setInterval(() => {
        refreshPortfolio()
      }, refreshInterval)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isAutoRefresh, refreshInterval, refreshPortfolio])

  return (
    <div className="min-h-screen bg-muted">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <section className="animate-fade-in">
            <PortfolioSummary />
          </section>

          <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <SectorOverview />
          </section>

          <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <PortfolioTable />
          </section>
        </div>
      </main>

      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <p className="text-sm text-muted-foreground">
              © 2024 Portfolio Dashboard. Built with Next.js and TypeScript.
            </p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Last Update: Real-time</span>
              <span>•</span>
              <span>Market Data: Live</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}