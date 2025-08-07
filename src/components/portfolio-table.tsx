"use client"

import * as React from "react"
import { memo, useMemo, useCallback, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table"
import { 
  ArrowUpDown, 
  ChevronDown, 
  MoreHorizontal, 
  Eye, 
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Download,
  Wifi,
  WifiOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatPercentage, getGainLossColor, formatNumber, cn } from "@/lib/utils"
import { Stock } from "@/types/portfolio"
import { usePortfolioStore } from "@/store/portfolioStore"

const StockNameCell = memo(({ row }: { row: any }) => (
  <div className="font-medium min-w-[150px]">
    <div className="font-semibold text-foreground">{row.getValue("particulars")}</div>
    <div className="text-sm text-muted-foreground flex items-center gap-1">
      <Badge variant="outline" className="text-xs px-1">
        {row.original.nseCode}
      </Badge>
    </div>
  </div>
))
StockNameCell.displayName = "StockNameCell"

const SectorCell = memo(({ row }: { row: any }) => (
  <Badge 
    variant="secondary" 
    className={cn(
      "font-normal text-xs",
      row.getValue("sector") === "Financial Sector" && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      row.getValue("sector") === "Tech Sector" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      row.getValue("sector") === "Consumer Goods" && "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      row.getValue("sector") === "Industrial" && "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      row.getValue("sector") === "Healthcare" && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      row.getValue("sector") === "Auto" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    )}
  >
    {row.getValue("sector")}
  </Badge>
))
SectorCell.displayName = "SectorCell"

const PriceCell = memo(({ value, isHighlight = false }: { value: number; isHighlight?: boolean }) => (
  <div className={cn("font-medium", isHighlight && "text-blue-600 dark:text-blue-400")}>
    {formatCurrency(value)}
  </div>
))
PriceCell.displayName = "PriceCell"

const GainLossCell = memo(({ row }: { row: any }) => {
  const gainLoss = row.getValue("gainLoss") as number
  const gainLossPercentage = row.original.gainLossPercentage
  const colorClass = useMemo(() => getGainLossColor(gainLoss), [gainLoss])
  
  return (
    <div className={`font-medium ${colorClass}`}>
      <div className="flex items-center gap-1">
        {gainLoss > 0 ? (
          <TrendingUp className="h-3 w-3" />
        ) : gainLoss < 0 ? (
          <TrendingDown className="h-3 w-3" />
        ) : null}
        {formatCurrency(gainLoss)}
      </div>
      <div className="text-sm">
        {formatPercentage(gainLossPercentage)}
      </div>
    </div>
  )
})
GainLossCell.displayName = "GainLossCell"

const PerformanceIndicator = memo(({ value }: { value: number }) => (
  <div className="flex items-center gap-1">
    <div 
      className={cn(
        "w-2 h-2 rounded-full",
        value > 0.1 ? "bg-green-500" : value > 0 ? "bg-yellow-500" : "bg-red-500"
      )}
    />
    <span className="text-xs text-muted-foreground">
      {value > 0.1 ? "Strong" : value > 0 ? "Moderate" : "Weak"}
    </span>
  </div>
))
PerformanceIndicator.displayName = "PerformanceIndicator"

const createColumns = (): ColumnDef<Stock>[] => [
  {
    accessorKey: "particulars",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        Stock Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <StockNameCell row={row} />,
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "sector",
    header: "Sector",
    cell: ({ row }) => <SectorCell row={row} />,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "purchasePrice",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        Purchase Price
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <PriceCell value={row.getValue("purchasePrice")} />,
    enableSorting: true,
  },
  {
    accessorKey: "qty",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        Quantity
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">
        {formatNumber(row.getValue("qty"), 0)}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "investment",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        Investment
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <PriceCell value={row.getValue("investment")} />,
    enableSorting: true,
  },
  {
    accessorKey: "portfolioPercentage",
    header: "Portfolio %",
    cell: ({ row }) => (
      <div className="font-medium">
        {formatPercentage(row.getValue("portfolioPercentage"))}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "cmp",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        CMP
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <PriceCell value={row.getValue("cmp")} isHighlight />,
    enableSorting: true,
  },
  {
    accessorKey: "presentValue",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        Present Value
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <PriceCell value={row.getValue("presentValue")} />,
    enableSorting: true,
  },
  {
    accessorKey: "gainLoss",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        Gain/Loss
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <GainLossCell row={row} />,
    enableSorting: true,
  },
  {
    accessorKey: "peRatio",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        P/E Ratio
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const peRatio = row.getValue("peRatio") as number
      return (
        <div className="font-medium">
          {peRatio ? formatNumber(peRatio, 2) : "N/A"}
        </div>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: "latestEarnings",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        Latest Earnings
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const earnings = row.getValue("latestEarnings") as number
      return (
        <div className="font-medium">
          {earnings ? formatNumber(earnings, 2) : "N/A"}
        </div>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: "marketCap",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        Market Cap
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const marketCap = row.getValue("marketCap") as number
      return (
        <div className="font-medium text-sm">
          {marketCap ? `₹${(marketCap / 10000000).toFixed(1)}Cr` : "N/A"}
        </div>
      )
    },
    enableSorting: true,
  },
  {
    id: "performance",
    header: "Performance",
    cell: ({ row }) => (
      <PerformanceIndicator value={row.original.gainLossPercentage} />
    ),
    enableSorting: false,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.nseCode)}>
            Copy stock code
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>View details</DropdownMenuItem>
          <DropdownMenuItem>Add to watchlist</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
    enableHiding: false,
  },
]

export const PortfolioTable = memo(() => {
  const { stocks, selectedSector, isLoading, error, dataSource } = usePortfolioStore()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [sectorFilter, setSectorFilter] = useState<string>("all")

  const filteredStocks = useMemo(() => {
    let result = stocks
    
    if (selectedSector) {
      result = result.filter(stock => stock.sector === selectedSector)
    }
    
    if (sectorFilter && sectorFilter !== "all") {
      result = result.filter(stock => stock.sector === sectorFilter)
    }
    
    return result
  }, [stocks, selectedSector, sectorFilter])

  const columns = useMemo(() => createColumns(), [])

  const sectorOptions = useMemo(() => {
    const sectors = Array.from(new Set(stocks.map(stock => stock.sector)))
    return sectors.map(sector => ({
      label: sector,
      value: sector,
    }))
  }, [stocks])

  const table = useReactTable({
    data: filteredStocks,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
      columnVisibility: {
        marketCap: false,
        performance: false,
      },
    },
  })

  const exportToCSV = useCallback(() => {
    const headers = table.getVisibleFlatColumns()
      .filter(col => col.id !== 'actions')
      .map(col => col.id)
      .join(',')
    
    const rows = table.getFilteredRowModel().rows.map(row => 
      table.getVisibleFlatColumns()
        .filter(col => col.id !== 'actions')
        .map(col => {
          const cell = row.getValue(col.id)
          return typeof cell === 'string' ? `"${cell}"` : cell
        }).join(',')
    ).join('\n')
    
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `portfolio-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }, [table])

  const handleSectorFilterChange = useCallback((value: string) => {
    setSectorFilter(value)
    table.getColumn("sector")?.setFilterValue(undefined)
  }, [table])

  const clearAllFilters = useCallback(() => {
    setGlobalFilter("")
    setSectorFilter("all")
    table.resetColumnFilters()
  }, [table])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-8 bg-gray-300 rounded w-1/4 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-300 rounded flex-1 animate-pulse"></div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-destructive">Error loading portfolio data</div>
            <div className="text-sm text-muted-foreground">{error}</div>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Portfolio Holdings
          </h2>
          <p className="text-muted-foreground">
            {table.getFilteredRowModel().rows.length} of {filteredStocks.length} stocks
            {selectedSector && (
              <span className="ml-2">
                • Filtered by <Badge variant="outline">{selectedSector}</Badge>
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Columns
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id.replace(/([A-Z])/g, ' $1').trim()}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stocks..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {sectorOptions.length > 1 && (
          <Select
            value={sectorFilter}
            onValueChange={handleSectorFilterChange}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              {sectorOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {(globalFilter || sectorFilter !== "all") && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="whitespace-nowrap"
          >
            <X className="h-4 w-4 mr-2" />
            Clear filters
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="space-y-2">
                      <div>No stocks found.</div>
                      {(globalFilter || sectorFilter !== "all") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearAllFilters}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
})

PortfolioTable.displayName = "PortfolioTable"