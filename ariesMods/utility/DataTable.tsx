import React, { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Download,
  RefreshCw 
} from 'lucide-react'
import type { AriesMod, AriesModProps, AriesModData } from '@/types/ariesmods'

interface TableConfig {
  maxRows?: number
  autoRefresh?: boolean
  refreshInterval?: number
  sortable?: boolean
  filterable?: boolean
  exportable?: boolean
  timestampFormat?: 'relative' | 'absolute' | 'iso'
  columnConfig?: {
    [key: string]: {
      visible: boolean
      width?: number
      type?: 'string' | 'number' | 'timestamp' | 'json'
    }
  }
}

interface TableRow {
  id: string
  timestamp: string
  [key: string]: any
}

type SortDirection = 'asc' | 'desc' | null

const DataTableComponent: React.FC<AriesModProps> = ({
  id,
  title,
  width,
  height,
  data,
  config,
  onConfigChange,
  onDataRequest
}) => {
  const tableConfig = config as TableConfig
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)
  
  const isCompact = width < 400 || height < 300
  const rowsPerPage = tableConfig?.maxRows || Math.floor((height - 120) / 40)

  // Process incoming data into table rows
  const tableData = useMemo(() => {
    if (!data || !Array.isArray(data.value)) {
      // Generate dummy data if no real data
      return Array.from({ length: 10 }, (_, i) => ({
        id: `row-${i}`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        name: `Item ${i + 1}`,
        value: Math.round(Math.random() * 100),
        status: ['active', 'inactive', 'warning'][Math.floor(Math.random() * 3)],
        category: ['sensor', 'actuator', 'controller'][Math.floor(Math.random() * 3)]
      }))
    }
    return data.value as TableRow[]
  }, [data])

  // Get all unique columns from data
  const columns = useMemo(() => {
    if (tableData.length === 0) return []
    
    const allKeys = new Set<string>()
    tableData.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key))
    })
    
    return Array.from(allKeys).filter(key => 
      !tableConfig?.columnConfig?.[key] || 
      tableConfig.columnConfig[key].visible !== false
    )
  }, [tableData, tableConfig])

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return tableData
    
    return tableData.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [tableData, searchTerm])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]
      
      let comparison = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortColumn, sortDirection])

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    return sortedData.slice(startIndex, startIndex + rowsPerPage)
  }, [sortedData, currentPage, rowsPerPage])

  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => 
        prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
      )
      if (sortDirection === 'desc') {
        setSortColumn(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }, [sortColumn, sortDirection])

  const formatCellValue = useCallback((value: any, column: string) => {
    const columnType = tableConfig?.columnConfig?.[column]?.type || 'string'
    
    switch (columnType) {
      case 'timestamp':
        const date = new Date(value)
        return tableConfig?.timestampFormat === 'relative' 
          ? `${Math.round((Date.now() - date.getTime()) / 60000)}m ago`
          : tableConfig?.timestampFormat === 'iso'
          ? date.toISOString()
          : date.toLocaleString()
      
      case 'number':
        return typeof value === 'number' ? value.toFixed(2) : value
      
      case 'json':
        return typeof value === 'object' ? JSON.stringify(value) : value
      
      default:
        return String(value)
    }
  }, [tableConfig])

  const getSortIcon = useCallback((column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 opacity-50" />
    if (sortDirection === 'asc') return <ArrowUp className="h-3 w-3" />
    if (sortDirection === 'desc') return <ArrowDown className="h-3 w-3" />
    return <ArrowUpDown className="h-3 w-3 opacity-50" />
  }, [sortColumn, sortDirection])

  const exportData = useCallback(() => {
    const csv = [
      columns.join(','),
      ...sortedData.map(row => 
        columns.map(col => JSON.stringify(row[col] || '')).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [sortedData, columns, title])

  const totalPages = Math.ceil(sortedData.length / rowsPerPage)

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className={`pb-2 ${isCompact ? 'py-2' : ''}`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`${isCompact ? 'text-sm' : 'text-base'} flex items-center gap-2`}>
            {title}
            <Badge variant="outline" className="text-xs">
              {sortedData.length} rows
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1">
            {tableConfig?.exportable && (
              <Button size="sm" variant="ghost" onClick={exportData}>
                <Download className="h-3 w-3" />
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onDataRequest?.(id, { action: 'refresh' })}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {tableConfig?.filterable && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-7 ${isCompact ? 'text-xs h-7' : 'h-8'}`}
              />
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead 
                    key={column}
                    className={`${tableConfig?.sortable ? 'cursor-pointer' : ''} ${isCompact ? 'text-xs py-1' : 'py-2'}`}
                    onClick={() => tableConfig?.sortable && handleSort(column)}
                  >
                    <div className="flex items-center gap-1">
                      <span className="capitalize">{column.replace(/_/g, ' ')}</span>
                      {tableConfig?.sortable && getSortIcon(column)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((column) => (
                    <TableCell 
                      key={column}
                      className={`${isCompact ? 'text-xs py-1' : 'py-2'} max-w-0 truncate`}
                      title={String(row[column] || '')}
                    >
                      {column === 'status' ? (
                        <Badge 
                          variant={row[column] === 'active' ? 'default' : 
                                  row[column] === 'warning' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {row[column]}
                        </Badge>
                      ) : (
                        formatCellValue(row[column], column)
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-2 border-t">
            <div className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const DataTableMod: AriesMod = {
  metadata: {
    id: 'data-table',
    name: 'DataTable',
    displayName: 'Data Table',
    description: 'Displays tabular data with sorting, filtering, and export capabilities',
    version: '1.0.0',
    author: 'AriesUI Team',
    category: 'utility',
    icon: '📊',
    defaultWidth: 400,
    defaultHeight: 300,
    minWidth: 300,
    minHeight: 200,
    tags: ['table', 'data', 'debugging', 'export']
  },
  component: DataTableComponent,
  generateDummyData: (): AriesModData => ({
    value: Array.from({ length: 25 }, (_, i) => ({
      id: `item-${i}`,
      timestamp: new Date(Date.now() - i * 30000).toISOString(),
      name: `Sensor ${i + 1}`,
      value: Math.round(Math.random() * 100 * 10) / 10,
      status: ['active', 'inactive', 'warning', 'error'][Math.floor(Math.random() * 4)],
      category: ['temperature', 'pressure', 'voltage', 'current'][Math.floor(Math.random() * 4)],
      location: `Room ${Math.floor(Math.random() * 5) + 1}`,
      last_updated: new Date(Date.now() - Math.random() * 300000).toISOString()
    })),
    timestamp: new Date().toISOString()
  }),
  validateConfig: (config: TableConfig): boolean => {
    if (config.maxRows && (config.maxRows < 1 || config.maxRows > 1000)) return false
    if (config.refreshInterval && config.refreshInterval < 100) return false
    return true
  }
} 