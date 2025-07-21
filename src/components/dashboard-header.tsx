"use client"

import React from "react"
import { RefreshCw, Settings, Download, Upload, Database, Globe } from "lucide-react"
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
    error 
  } = usePortfolioStore()

  const [dataSource, setDataSource] = React.useState<string>('simulated')

  React.useEffect(() => {
    // Check data source from API
    const checkDataSource = async () => {
      try {
        const response = await fetch('/api/portfolio')
        const data = await response.json()
        if (data.metadata) {
          setDataSource(data.metadata.dataSource)
        }
      } catch (error) {
        console.error('Failed to check data source:', error)
      }
    }
    checkDataSource()
  }, [])

  const handleRefresh = () => {
    refreshPortfolio()
  }

  const handleExport = () => {
    console.log("Export functionality to be implemented")
  }

  const handleImport = () => {
    console.log("Import functionality to be implemented")
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
    if (dataSource === 'real-api') {
      return (
        <Badge variant="success" className="hidden sm:flex">
          <Globe className="h-3 w-3 mr-1" />
          Live Data
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="hidden sm:flex">
          <Database className="h-3 w-3 mr-1" />
          Simulated
        </Badge>
      )
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gradient">Portfolio Dashboard</h1>
            {getDataSourceBadge()}
            {lastUpdated && (
              <Badge variant="outline" className="hidden sm:flex">
                Last updated: {formatTimeAgo(lastUpdated)}
              </Badge>
            )}
            {error && (
              <Badge variant="destructive" className="hidden sm:flex">
                Error: {error}
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
              onClick={handleRefresh}
              disabled={isLoading}
              className="hidden sm:flex"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="hidden md:flex"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleImport}
              className="hidden md:flex"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex"
            >
              <Settings className="h-4 w-4" />
            </Button>

            <ThemeToggle />

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
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
            <div className="flex items-center gap-2">
              {getDataSourceBadge()}
              {lastUpdated && (
                <Badge variant="outline" className="text-xs">
                  {formatTimeAgo(lastUpdated)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}