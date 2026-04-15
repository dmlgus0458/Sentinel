import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { PrometheusMatrixItem } from '../../types'

const COLORS = [
  '#8b5cf6', '#22d3ee', '#10b981', '#f59e0b',
  '#ef4444', '#a78bfa', '#fb923c', '#34d399',
  '#60a5fa', '#f472b6', '#a3e635', '#fb7185',
]

interface MetricChartProps {
  series: PrometheusMatrixItem[]
  title?: string
  unit?: string
}

interface ChartDataPoint {
  time: string
  [key: string]: string | number
}

function formatYAxis(value: number, unit: string): string {
  if (unit === '%') return `${value.toFixed(0)}%`
  if (unit === 'B/s') {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
    return `${value.toFixed(0)}`
  }
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(2)
}

function formatTooltipValue(value: number, unit: string): string {
  if (unit === '%') return `${value.toFixed(2)}%`
  if (unit === 'B/s') {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} MB/s`
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)} KB/s`
    return `${value.toFixed(0)} B/s`
  }
  return value.toFixed(3)
}

export function MetricChart({ series, title, unit = '' }: MetricChartProps) {
  if (!series || series.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">
        No data
      </div>
    )
  }

  const timeMap = new Map<number, ChartDataPoint>()

  series.forEach((s, idx) => {
    const label = s.metric.instance ?? s.metric.__name__ ?? `series-${idx}`
    s.values.forEach(([ts, v]) => {
      const existing = timeMap.get(ts) ?? {
        time: new Date(ts * 1000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
      existing[label] = parseFloat(v)
      timeMap.set(ts, existing)
    })
  })

  const chartData = Array.from(timeMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v)

  const keys = series.map(
    (s, idx) => s.metric.instance ?? s.metric.__name__ ?? `series-${idx}`
  )

  const MAX_LEGEND = 12
  const hiddenCount = keys.length > MAX_LEGEND ? keys.length - MAX_LEGEND : 0

  return (
    <div>
      {title && <p className="text-xs text-gray-500 dark:text-gray-500 mb-2 font-mono truncate">{title}</p>}
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[&>line]:stroke-gray-800" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v) => formatYAxis(v, unit)}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 6,
              color: '#f3f4f6',
              fontSize: 12,
            }}
            formatter={(value, name) => [
              typeof value === 'number' ? formatTooltipValue(value, unit) : String(value ?? ''),
              String(name ?? ''),
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#9ca3af', paddingTop: 8 }}
            formatter={(value) =>
              keys.indexOf(value) < MAX_LEGEND ? value : ''
            }
          />
          {keys.map((key, idx) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[idx % COLORS.length]}
              dot={false}
              strokeWidth={1.5}
              activeDot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {hiddenCount > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-600 text-center mt-1">
          +{hiddenCount} more series not shown in legend
        </p>
      )}
    </div>
  )
}
