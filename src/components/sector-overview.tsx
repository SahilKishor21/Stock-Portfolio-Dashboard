"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { formatCurrency, formatPercentage, getGainLossColor } from "@/lib/utils";
import { usePortfolioStore } from "@/store/portfolioStore";
import { TrendingUp, TrendingDown, Target, Activity, Wifi, WifiOff, CheckCircle } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function SectorOverview() {
  const { sectors, setSelectedSector, selectedSector, isLoading, dataSource } = usePortfolioStore();

  if (isLoading || !sectors.length) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-300 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-300 rounded"></div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-300 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-300 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLiveData = dataSource === 'yahoo-finance-real' || dataSource === 'yahoo-google-finance-real'
  const isPartialLive = dataSource?.includes('yahoo')

  const pieData = sectors.map((sector, index) => ({
    name: sector.sector,
    value: sector.totalInvestment,
    color: COLORS[index % COLORS.length],
  }));

  const barData = sectors.map(sector => ({
    sector: sector.sector.replace(' Sector', ''),
    investment: sector.totalInvestment,
    currentValue: sector.totalPresentValue,
    gainLoss: sector.totalGainLoss,
  }));

  return (
    <div className="space-y-6 mb-8">
      {!isLiveData && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
          <div className="flex items-center text-blue-800 dark:text-blue-200">
            <Activity className="h-4 w-4 mr-2" />
            <span className="text-sm">
              {isPartialLive 
                ? "Sector data includes both live Yahoo Finance prices and simulated P/E ratios for enhanced analysis."
                : "Sector analysis based on simulated market data. Enable live data for real-time sector performance."
              }
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Investment Distribution
              <Badge variant="outline" className="ml-auto">
                {isLiveData ? (
                  <><CheckCircle className="h-3 w-3 mr-1 text-green-500" />Live</>
                ) : isPartialLive ? (
                  <><Wifi className="h-3 w-3 mr-1 text-yellow-500" />Mixed</>
                ) : (
                  <><WifiOff className="h-3 w-3 mr-1" />Demo</>
                )}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sector Performance
              <Badge variant="outline" className="ml-auto">
                {isLiveData ? (
                  <><CheckCircle className="h-3 w-3 mr-1 text-green-500" />Live</>
                ) : isPartialLive ? (
                  <><Wifi className="h-3 w-3 mr-1 text-yellow-500" />Mixed</>
                ) : (
                  <><WifiOff className="h-3 w-3 mr-1" />Demo</>
                )}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={barData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="sector" 
                  height={60}
                  interval={0}
                  fontSize={12}
                />
                <YAxis width={80} />
                <Tooltip 
                  formatter={(value, name) => [
                    formatCurrency(value as number), 
                    name === 'gainLoss' ? 'Gain/Loss' : name === 'investment' ? 'Investment' : 'Current Value'
                  ]}
                />
                <Legend />
                <Bar dataKey="investment" fill="#8884d8" name="Investment" />
                <Bar dataKey="currentValue" fill="#82ca9d" name="Current Value" />
                <Bar dataKey="gainLoss" fill="#ffc658" name="Gain/Loss" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sector Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectors.map((sector) => (
              <div
                key={sector.sector}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedSector === sector.sector 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedSector(
                  selectedSector === sector.sector ? null : sector.sector
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{sector.sector}</Badge>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">
                      {sector.stocks.length} stocks
                    </span>
                    {isLiveData && (
                      <Badge variant="outline" className="text-xs px-1">
                        <CheckCircle className="h-2 w-2 text-green-500" />
                      </Badge>
                    )}
                    {isPartialLive && !isLiveData && (
                      <Badge variant="outline" className="text-xs px-1">
                        <Wifi className="h-2 w-2 text-yellow-500" />
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Investment:</span>
                    <span className="font-medium">{formatCurrency(sector.totalInvestment)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Value:</span>
                    <span className="font-medium">{formatCurrency(sector.totalPresentValue)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Gain/Loss:</span>
                    <div className="text-right">
                      <div className={`font-medium ${
                        sector.totalGainLoss > 0 
                          ? 'text-green-500' 
                          : sector.totalGainLoss < 0 
                            ? 'text-red-500' 
                            : 'text-gray-500'
                      }`}>
                        {formatCurrency(sector.totalGainLoss)}
                      </div>
                      <div className={`text-sm ${
                        sector.totalGainLoss > 0 
                          ? 'text-green-500' 
                          : sector.totalGainLoss < 0 
                            ? 'text-red-500' 
                            : 'text-gray-500'
                      }`}>
                        {formatPercentage(sector.gainLossPercentage)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {sector.totalGainLoss !== 0 && (
                  <div className="mt-2 flex items-center gap-1 text-sm">
                    {sector.totalGainLoss > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={getGainLossColor(sector.totalGainLoss)}>
                      {sector.totalGainLoss > 0 ? 'Profitable' : 'Loss'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {selectedSector && (
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setSelectedSector(null)}
                className="w-full sm:w-auto"
              >
                Clear Filter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}