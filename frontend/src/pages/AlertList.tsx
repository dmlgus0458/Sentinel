import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { StatusDot } from '../components/ui/StatusDot'
import { useAlerts } from '../hooks/useAlerts'
import type { AlertListParams, Severity, AlertStatus } from '../types'

export function AlertList() {
  const navigate = useNavigate()
  const [params, setParams] = useState<AlertListParams>({ page: 1, limit: 20 })

  const { data, isLoading } = useAlerts(params)

  const setFilter = (key: keyof AlertListParams, value: string) => {
    setParams((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
      page: 1,
    }))
  }

  const totalPages = data ? Math.ceil(data.total / (params.limit ?? 20)) : 1

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-violet-500"
          value={params.severity ?? ''}
          onChange={(e) => setFilter('severity', e.target.value)}
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>

        <select
          className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-violet-500"
          value={params.status ?? ''}
          onChange={(e) => setFilter('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="firing">Firing</option>
          <option value="resolved">Resolved</option>
        </select>

        <input
          type="date"
          className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-violet-500"
          value={params.from?.split('T')[0] ?? ''}
          onChange={(e) =>
            setFilter('from', e.target.value ? `${e.target.value}T00:00:00Z` : '')
          }
        />
        <input
          type="date"
          className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-violet-500"
          value={params.to?.split('T')[0] ?? ''}
          onChange={(e) =>
            setFilter('to', e.target.value ? `${e.target.value}T23:59:59Z` : '')
          }
        />

        {data && (
          <span className="ml-auto text-sm text-gray-500 self-center">
            {data.total} alerts
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Alert Name</th>
              <th className="px-4 py-3 text-left">Severity</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Instance</th>
              <th className="px-4 py-3 text-left">Started At</th>
              <th className="px-4 py-3 text-left">Ack</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : data?.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No alerts found
                </td>
              </tr>
            ) : (
              data?.data.map((alert) => (
                <tr
                  key={alert.id}
                  onClick={() => navigate(`/alerts/${alert.id}`)}
                  className="border-b border-gray-200/50 dark:border-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-200 font-medium">
                    {alert.alertName}
                  </td>
                  <td className="px-4 py-3">
                    <Badge severity={alert.severity as Severity} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusDot status={alert.status as AlertStatus} showLabel />
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                    {alert.labels.instance ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {new Date(alert.startsAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {alert.ack ? (
                      <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
                        ACK'd
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40"
            disabled={params.page === 1}
            onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
          >
            Prev
          </button>
          <span className="text-sm text-gray-500">
            {params.page} / {totalPages}
          </span>
          <button
            className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40"
            disabled={params.page === totalPages}
            onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
