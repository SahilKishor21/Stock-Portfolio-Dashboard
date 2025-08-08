"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, Target, Activity, Wifi, WifiOff, CheckCircle } from "lucide-react"
import { formatCurrency, formatPercentage, getGainLossColor } from "@/lib/utils"
import { usePortfolioStore } from "@/store/portfolioStore"

export function PortfolioSummary() {
  const { portfolioSummary, isLoading, error, dataSource } = usePortfolioStore()

  if (isLoading || !portfolioSummary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const isLiveData = dataSource === 'yahoo-finance-real' || dataSource === 'yahoo-google-finance-real'
  const isPartialLive = dataSource?.includes('yahoo') && !isLiveData
  const showDataWarning = dataSource?.includes('simulated') && dataSource?.includes('fallback')

  const {
    totalInvestment,
    totalPresentValue,
    totalGainLoss,
    totalGainLossPercentage,
    totalStocks,
  } = portfolioSummary

  const cards = [
    {
      title: "Total Investment",
      value: formatCurrency(totalInvestment),
      icon: DollarSign,
      description: `Across ${totalStocks} stocks`,
      className: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
    },
    {
      title: "Current Value",
      value: formatCurrency(totalPresentValue),
      icon: Target,
      description: "Market value",
      className: "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800",
    },
    {
      title: "Total Gain/Loss",
      value: formatCurrency(totalGainLoss),
      icon: totalGainLoss >= 0 ? TrendingUp : TrendingDown,
      description: formatPercentage(totalGainLossPercentage),
      className: totalGainLoss >= 0 
        ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
        : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
      valueColor: getGainLossColor(totalGainLoss),
    },
    {
      title: "Portfolio Health",
      value: totalGainLoss >= 0 ? "Profitable" : "Loss",
      icon: totalGainLoss >= 0 ? TrendingUp : TrendingDown,
      description: `${((totalPresentValue / totalInvestment) * 100).toFixed(1)}% of investment`,
      className: totalGainLoss >= 0 
        ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800"
        : "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800",
    },
  ]

  return (
    <>
      {showDataWarning && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950 dark:border-yellow-800">
          <div className="flex items-center text-yellow-800 dark:text-yellow-200">
            <WifiOff className="h-4 w-4 mr-2" />
            <span className="text-sm">
              {dataSource?.includes('fallback') 
                ? "Currently showing demo data due to API connectivity issues. Real-time data will resume automatically."
                : "Portfolio showing demo data. Enable real-time updates to see live market prices."
              }
            </span>
          </div>
        </div>
      )}

      {isLiveData && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
          <div className="flex items-center text-green-800 dark:text-green-200">
            <Activity className="h-4 w-4 mr-2" />
            <span className="text-sm">
              Portfolio displaying live stock prices. Automatically updates every 5 minutes.
            </span>
          </div>
        </div>
      )}

      {isPartialLive && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
          <div className="flex items-center text-blue-800 dark:text-blue-200">
            <Activity className="h-4 w-4 mr-2" />
            <span className="text-sm">
              Portfolio includes both live Yahoo Finance prices and simulated data for some stocks.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <Card key={index} className={`transition-all duration-300 hover:shadow-lg ${card.className}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {card.title}
              </CardTitle>
              <card.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold mb-1 ${card.valueColor || 'text-gray-900 dark:text-gray-100'}`}>
                {card.value}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {card.description}
              </p>
              
              {(card.title === "Current Value" || card.title === "Total Gain/Loss") && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {isLiveData ? (
                      <><CheckCircle className="h-3 w-3 mr-1 text-green-500" />Live</>
                    ) : isPartialLive ? (
                      <><Wifi className="h-3 w-3 mr-1 text-yellow-500" />Mixed</>
                    ) : (
                      <><WifiOff className="h-3 w-3 mr-1 text-red-500" />Demo</>
                    )}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950 dark:border-red-800">
          <div className="text-red-800 dark:text-red-200 text-sm">
            ❌ {error}
          </div>
        </div>
      )}
    </>
  )
}