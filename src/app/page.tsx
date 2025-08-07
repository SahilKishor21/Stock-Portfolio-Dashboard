"use client"

import { DashboardHeader } from '@/components/dashboard-header'
import { PortfolioSummary } from '@/components/portfolio-summary'
import { SectorOverview } from '@/components/sector-overview'
import { PortfolioTable } from '@/components/portfolio-table'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'

export default function HomePage() {
  useAutoRefresh()

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
          </div>
        </div>
      </footer>
    </div>
  )
}