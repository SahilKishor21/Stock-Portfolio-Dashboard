"use client"

import { RefreshCw, Wifi, WifiOff, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ThemeToggle } from "@/components/theme-toggle"
import { usePortfolioStore } from "@/store/portfolioStore"

export function DashboardHeader() {
  const { 
    refreshPortfolio, 
    isLoading, 
    lastUpdated, 
    isAutoRefresh, 
    toggleAutoRefresh,
    error,
    dataSource 
  } = usePortfolioStore()

  
  const handleManualRefresh = () => {
    refreshPortfolio(true) 
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getDataSourceBadge = () => {
    if (dataSource === 'yahoo-finance-real' || dataSource === 'yahoo-google-finance-real') {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Live Data (Yahoo Finance + P/E)
        </Badge>
      )
    } else if (dataSource === 'yahoo-finance-mixed') {
      return (
        <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">
          <Clock className="h-3 w-3 mr-1" />
          Mixed Data (Yahoo + Simulated)
        </Badge>
      )
    } else if (dataSource === 'simulated-fallback') {
      return (
        <Badge variant="destructive">
          <WifiOff className="h-3 w-3 mr-1" />
          Demo Data (API Fallback)
        </Badge>
      )
    } else if (dataSource === 'simulated') {
      return (
        <Badge variant="outline">
          <WifiOff className="h-3 w-3 mr-1" />
          Demo Data
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          Loading...
        </Badge>
      )
    }
  }

  const isLiveData = dataSource === 'yahoo-finance-real' || dataSource === 'yahoo-google-finance-real'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Portfolio Dashboard
            </h1>

           {/*getDataSourceBadge()*/}

            {lastUpdated && (
              <Badge variant="outline" className="hidden sm:flex">
                Last updated: {formatTimeAgo(lastUpdated)}
              </Badge>
            )}
            {error && (
              <Badge variant="destructive" className="hidden sm:flex">
                Error: {error.substring(0, 30)}...
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Auto Refresh</span>
              <Switch
                checked={isAutoRefresh}
                onCheckedChange={toggleAutoRefresh}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="hidden sm:flex"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>

            <ThemeToggle />

            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="sm:hidden"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="sm:hidden pb-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Auto Refresh</span>
              <Switch
                checked={isAutoRefresh}
                onCheckedChange={toggleAutoRefresh}
              />
            </div>
            {getDataSourceBadge()}
          </div>
        </div>
      </div>
    </header>
  )
}