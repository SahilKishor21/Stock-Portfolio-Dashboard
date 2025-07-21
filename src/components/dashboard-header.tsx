"use client"

import React, { useCallback, useRef } from "react"
import { RefreshCw, Settings, Download, Upload, Database, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ThemeToggle } from "@/components/theme-toggle"
import { usePortfolioStore } from "@/store/portfolioStore"
import { Stock } from "@/types/portfolio"

export function DashboardHeader() {
  const { 
    refreshPortfolio, 
    isLoading, 
    lastUpdated, 
    isAutoRefresh, 
    toggleAutoRefresh,
    error,
    stocks,
    updateStocks
  } = usePortfolioStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dataSource, setDataSource] = React.useState<string>('simulated')

  React.useEffect(() => {
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

  const exportToCSV = useCallback(() => {
    const headers = [
      'id',
      'particulars',
      'purchasePrice',
      'qty',
      'investment',
      'portfolioPercentage',
      'nseCode',
      'cmp',
      'presentValue',
      'gainLoss',
      'gainLossPercentage',
      'marketCap',
      'peRatio',
      'latestEarnings',
      'sector',
      'revenue',
      'ebitda',
      'ebitdaPercentage',
      'pat',
      'patPercentage',
      'debtToEquity',
      'bookValue',
      'stage2',
      'salePrice'
    ].join(',')
    
    const rows = stocks.map(stock => [
      stock.id,
      `"${stock.particulars}"`,
      stock.purchasePrice,
      stock.qty,
      stock.investment,
      stock.portfolioPercentage,
      `"${stock.nseCode}"`,
      stock.cmp,
      stock.presentValue,
      stock.gainLoss,
      stock.gainLossPercentage,
      stock.marketCap,
      stock.peRatio,
      stock.latestEarnings,
      `"${stock.sector}"`,
      stock.revenue,
      stock.ebitda,
      stock.ebitdaPercentage,
      stock.pat,
      stock.patPercentage,
      stock.debtToEquity,
      stock.bookValue,
      `"${stock.stage2}"`,
      stock.salePrice || ''
    ].join(',')).join('\n')
    
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `portfolio-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }, [stocks])

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const parseCSV = (text: string): Stock[] => {
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const parsedStocks: Stock[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values: string[] = []
      let current = ''
      let inQuotes = false

      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())

      if (values.length !== headers.length) continue

      try {
        const stockData: any = {}
        headers.forEach((header, index) => {
          const value = values[index].replace(/"/g, '')
          
          if (['id', 'qty'].includes(header)) {
            stockData[header] = parseInt(value) || 0
          } else if ([
            'purchasePrice', 'investment', 'portfolioPercentage', 'cmp', 
            'presentValue', 'gainLoss', 'gainLossPercentage', 'marketCap', 
            'peRatio', 'latestEarnings', 'revenue', 'ebitda', 'ebitdaPercentage', 
            'pat', 'patPercentage', 'debtToEquity', 'bookValue', 'salePrice'
          ].includes(header)) {
            stockData[header] = parseFloat(value) || 0
          } else {
            stockData[header] = value || ''
          }
        })

        if (stockData.particulars && stockData.nseCode) {
          parsedStocks.push(stockData as Stock)
        }
      } catch (error) {
        console.error(`Error parsing row ${i}:`, error)
      }
    }

    return parsedStocks
  }

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Please select a valid CSV file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const importedStocks = parseCSV(text)
        
        if (importedStocks.length === 0) {
          alert('No valid stock data found in the CSV file')
          return
        }

        const confirmed = confirm(
          `Found ${importedStocks.length} stocks in the CSV file. This will replace your current portfolio. Are you sure you want to continue?`
        )
        
        if (confirmed) {
          updateStocks(importedStocks)
          alert(`Successfully imported ${importedStocks.length} stocks`)
        }
      } catch (error) {
        console.error('Error importing CSV:', error)
        alert('Error importing CSV file. Please check the file format.')
      }
    }
    
    reader.onerror = () => {
      alert('Error reading the file')
    }
    
    reader.readAsText(file)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [updateStocks])

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
              onClick={exportToCSV}
              className="hidden md:flex"
              disabled={stocks.length === 0}
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

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

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