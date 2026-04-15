import { useState, useMemo } from 'react'
import { Play } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { MetricChart } from '../components/charts/MetricChart'
import { useMetricsRange } from '../hooks/useMetrics'
import type { MetricsRangeParams, PrometheusMatrixItem } from '../types'

const PRESETS = [
  {
    label: 'CPU Usage',
    query: '100 - (avg by(instance, job)(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
    unit: '%',
  },
  {
    label: 'Memory Usage',
    query: '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100',
    unit: '%',
  },
  {
    label: 'Disk I/O',
    query: 'avg by(instance, job)(rate(node_disk_io_time_seconds_total[5m])) * 100',
    unit: '%',
  },
  {
    label: 'Network In',
    query: 'sum by(instance, job)(rate(node_network_receive_bytes_total{device!="lo"}[5m]))',
    unit: 'B/s',
  },
  {
    label: 'Load Avg',
    query: 'node_load1',
    unit: '',
  },
]

type TimeRange = '1h' | '3h' | '6h' | '24h'

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: 'Last 1h', value: '1h' },
  { label: 'Last 3h', value: '3h' },
  { label: 'Last 6h', value: '6h' },
  { label: 'Last 24h', value: '24h' },
]

function getRange(range: TimeRange): { start: string; end: string; step: string } {
  const end = new Date()
  const start = new Date(end)
  const hours: Record<TimeRange, number> = { '1h': 1, '3h': 3, '6h': 6, '24h': 24 }
  start.setHours(start.getHours() - hours[range])
  const step = range === '24h' ? '300' : range === '6h' ? '120' : '60'
  return { start: start.toISOString(), end: end.toISOString(), step }
}

function formatValue(v: number, unit: string): string {
  if (unit === 'B/s') {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} MB/s`
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)} KB/s`
    return `${v.toFixed(0)} B/s`
  }
  if (unit === '%') return `${v.toFixed(1)}%`
  return v.toFixed(2)
}

function getTrendColor(trend: number, unit: string): string {
  if (unit === '%') {
    if (trend > 3) return 'text-red-400'
    if (trend > 0.5) return 'text-yellow-400'
    if (trend < -0.5) return 'text-green-400'
  } else {
    if (trend > 0) return 'text-yellow-400'
    if (trend < 0) return 'text-green-400'
  }
  return 'text-gray-500'
}

function getValueColor(v: number, unit: string): string {
  if (unit !== '%') return 'text-gray-200'
  if (v >= 80) return 'text-red-400'
  if (v >= 60) return 'text-yellow-400'
  return 'text-green-400'
}

const VISIBLE_ROWS = 20

export function MetricsExplorer() {
  const [query, setQuery] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [timeRange, setTimeRange] = useState<TimeRange>('1h')
  const [enabled, setEnabled] = useState(false)
  const [activeUnit, setActiveUnit] = useState('')
  const [activePresetQuery, setActivePresetQuery] = useState('')
  const [showAll, setShowAll] = useState(false)

  const params = useMemo<MetricsRangeParams>(() => {
    const { start, end, step } = getRange(timeRange)
    return { query, start, end, step }
  }, [query, timeRange])

  const { data, isLoading, isFetching, isError } = useMetricsRange(params, enabled && !!query)

  const runQuery = () => {
    setQuery(inputValue)
    setEnabled(true)
  }

  const applyPreset = (p: typeof PRESETS[0]) => {
    if (activePresetQuery === p.query) {
      // 재클릭 → 해제 + 초기화
      setInputValue('')
      setQuery('')
      setActiveUnit('')
      setEnabled(false)
      setActivePresetQuery('')
      setShowAll(false)
    } else {
      setInputValue(p.query)
      setQuery(p.query)
      setActiveUnit(p.unit)
      setEnabled(true)
      setActivePresetQuery(p.query)
      setShowAll(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setActivePresetQuery('')
  }

  const series: PrometheusMatrixItem[] =
    data?.status === 'success' ? (data.data.result as PrometheusMatrixItem[]) : []

  const latestRows = useMemo(() => {
    return series
      .map((s) => {
        const vals = s.values
        const lastVal = vals.length > 0 ? parseFloat(vals[vals.length - 1][1]) : NaN
        const prevVal = vals.length > 1 ? parseFloat(vals[vals.length - 2][1]) : NaN
        const trend = !isNaN(lastVal) && !isNaN(prevVal) ? lastVal - prevVal : 0
        return {
          instance: s.metric.instance ?? s.metric.__name__ ?? '—',
          job: s.metric.job ?? '—',
          value: lastVal,
          trend,
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [series])

  const stats = useMemo(() => {
    const vals = latestRows.map((r) => r.value).filter((v) => !isNaN(v))
    if (vals.length === 0) return null
    return {
      avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      max: Math.max(...vals),
      min: Math.min(...vals),
      count: vals.length,
    }
  }, [latestRows])

  const visibleRows = showAll ? latestRows : latestRows.slice(0, VISIBLE_ROWS)
  const hiddenCount = latestRows.length - VISIBLE_ROWS

  const activePreset = PRESETS.find((p) => p.query === activePresetQuery)

  return (
    <div className="space-y-4">
      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-500 dark:text-gray-600 mr-1">Preset</span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              activePresetQuery === p.query
                ? 'bg-violet-600/20 border-violet-500/50 text-violet-600 dark:text-violet-300'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Query bar */}
      <div className="flex gap-2">
        <div className={`flex-1 flex items-center gap-2 bg-white dark:bg-gray-900 border rounded-lg px-3 py-2 transition-colors ${
          inputValue ? 'border-violet-500/50' : 'border-gray-200 dark:border-gray-700'
        }`}>
          <span className="text-violet-500 text-[10px] font-bold uppercase tracking-wider flex-shrink-0">PromQL</span>
          <input
            className="flex-1 bg-transparent text-gray-800 dark:text-gray-200 text-sm font-mono focus:outline-none placeholder-gray-400 dark:placeholder-gray-600"
            placeholder="Enter a PromQL query or select a preset..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && runQuery()}
          />
        </div>
        <select
          value={timeRange}
          onChange={(e) => {
            setTimeRange(e.target.value as TimeRange)
            if (query) setEnabled(true)
          }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500"
        >
          {TIME_RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <button
          onClick={runQuery}
          disabled={!inputValue.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Play size={13} />
          Run
        </button>
      </div>

      {/* Chart Card */}
      <Card>
        {isLoading || isFetching ? (
          <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
            <span className="animate-pulse">Loading...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-52 gap-2 text-red-400 text-sm">
            <span>Query failed</span>
            <span className="text-xs text-gray-500">Check your PromQL query or Prometheus connection.</span>
          </div>
        ) : !enabled || !query ? (
          <div className="flex flex-col items-center justify-center h-52 gap-1 text-gray-400 text-sm">
            <span>Select a preset or enter a PromQL query</span>
            <span className="text-xs text-gray-500">Press Enter or click Run to execute</span>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Chart header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate max-w-[60%]">
                {activePreset?.label ?? query} — {stats?.count ?? 0} series
              </span>
              {stats && (
                <div className="flex gap-4 text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                  <span>avg <span className="text-gray-600 dark:text-gray-300 font-medium">{formatValue(stats.avg, activeUnit)}</span></span>
                  <span>max <span className="text-red-500 font-medium">{formatValue(stats.max, activeUnit)}</span></span>
                  <span>min <span className="text-green-500 font-medium">{formatValue(stats.min, activeUnit)}</span></span>
                </div>
              )}
            </div>
            <MetricChart series={series} unit={activeUnit} />
          </div>
        )}
      </Card>

      {/* Latest Values Table */}
      {enabled && query && !isLoading && !isFetching && latestRows.length > 0 && (
        <Card title="Latest Values">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left pb-2 text-gray-400 dark:text-gray-500 font-medium">instance</th>
                  <th className="text-left pb-2 text-gray-400 dark:text-gray-500 font-medium">job</th>
                  <th className="text-right pb-2 text-gray-400 dark:text-gray-500 font-medium">value</th>
                  <th className="text-right pb-2 text-gray-400 dark:text-gray-500 font-medium">trend</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="py-2 pr-4 font-mono text-gray-700 dark:text-gray-300">{row.instance}</td>
                    <td className="py-2 pr-4 text-gray-400 dark:text-gray-500">{row.job}</td>
                    <td className={`py-2 pr-4 text-right font-bold ${getValueColor(row.value, activeUnit)}`}>
                      {isNaN(row.value) ? '—' : formatValue(row.value, activeUnit)}
                    </td>
                    <td className={`py-2 text-right font-medium ${getTrendColor(row.trend, activeUnit)}`}>
                      {row.trend > 0 ? '▲' : row.trend < 0 ? '▼' : '—'}{' '}
                      {Math.abs(row.trend) > 0.01 ? formatValue(Math.abs(row.trend), activeUnit) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!showAll && hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-3 w-full text-xs text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-400 transition-colors py-1"
            >
              Show {hiddenCount} more
            </button>
          )}
          {showAll && latestRows.length > VISIBLE_ROWS && (
            <button
              onClick={() => setShowAll(false)}
              className="mt-3 w-full text-xs text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-400 transition-colors py-1"
            >
              Show less
            </button>
          )}
        </Card>
      )}
    </div>
  )
}
