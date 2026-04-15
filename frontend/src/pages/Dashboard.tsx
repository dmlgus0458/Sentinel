import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Flame, CheckCircle, Activity } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { StatusDot } from '../components/ui/StatusDot'
import { EventHeatmap } from '../components/charts/EventHeatmap'
import { InfraErrorPanel } from '../components/ui/InfraErrorPanel'
import { useDashboardStats, useDashboardHeatmap, useInfraStatus, useNodesMetric } from '../hooks/useMetrics'
import { useAlerts } from '../hooks/useAlerts'
import type { InfraType, InfraTypeStatus, InfraService, NodeMetric } from '../types'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | undefined
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value ?? '—'}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function InfraTypeTab({
  typeStatus,
  selected,
  onClick,
}: {
  typeStatus: InfraTypeStatus
  selected: boolean
  onClick: () => void
}) {
  const allUp = typeStatus.up === typeStatus.total
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
        selected
          ? 'bg-violet-600/20 border-violet-500/50 text-violet-600 dark:text-violet-300'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'
      }`}
    >
      <span className="font-semibold text-[11px] text-gray-700 dark:text-gray-300">{typeStatus.label}</span>
      <span className={`text-[10px] font-bold ${allUp ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
        {typeStatus.up}/{typeStatus.total}
      </span>
    </button>
  )
}

// ── Q2 + Q3: 색상 테두리 + OK/ERROR 인라인 배지 ──
function InfraServiceCard({ svc }: { svc: InfraService }) {
  const displayName = svc.role ?? svc.name
  return (
    <div className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 border transition-colors ${
      svc.up
        ? 'bg-white dark:bg-gray-900 border-green-400/50 dark:border-green-500/30 dark:shadow-[0_0_6px_rgba(74,222,128,0.12)]'
        : 'bg-red-50 dark:bg-red-900/10 border-red-400/60 dark:border-red-500/40 dark:shadow-[0_0_6px_rgba(248,113,113,0.18)]'
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${svc.up ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{displayName}</span>
      </div>
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
        svc.up
          ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
          : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
      }`}>
        {svc.up ? 'OK' : 'ERROR'}
      </span>
    </div>
  )
}

// ── Q1-A: HOSTS 탭 전용 CPU/MEM/DISK 메트릭 카드 ──
function MetricBar({ label, value }: { label: string; value: number }) {
  const barColor =
    value >= 80 ? 'bg-red-500' :
    value >= 60 ? 'bg-yellow-500' :
    'bg-green-500'
  const textColor =
    value >= 80 ? 'text-red-600 dark:text-red-400' :
    value >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
    'text-green-600 dark:text-green-500'

  return (
    <div className="flex items-center gap-1.5 mb-[3px]">
      <span className="text-[10px] text-gray-400 dark:text-gray-500 w-7 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-[10px] font-bold w-7 text-right flex-shrink-0 ${textColor}`}>{value}%</span>
    </div>
  )
}

function HostMetricCard({ svc, metric }: { svc: InfraService; metric?: NodeMetric }) {
  const displayName = svc.role ?? svc.name
  return (
    <div className={`rounded-lg p-3 border transition-colors ${
      svc.up
        ? 'bg-white dark:bg-gray-900 border-green-400/50 dark:border-green-500/30 dark:shadow-[0_0_8px_rgba(74,222,128,0.12)]'
        : 'bg-red-50 dark:bg-red-900/10 border-red-400/60 dark:border-red-500/40 dark:shadow-[0_0_8px_rgba(248,113,113,0.18)]'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{displayName}</span>
        <span className={`text-[10px] font-bold flex-shrink-0 ml-2 ${svc.up ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
          {svc.up ? '● UP' : '● DOWN'}
        </span>
      </div>
      {metric ? (
        <>
          <MetricBar label="CPU" value={metric.cpuUsage} />
          <MetricBar label="MEM" value={metric.memoryUsage} />
          <MetricBar label="DISK" value={metric.diskUsage} />
        </>
      ) : (
        <div className="text-[10px] text-gray-400 text-center py-1">메트릭 없음</div>
      )}
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState<InfraType>('all')
  const { data: stats } = useDashboardStats()
  const { data: heatmap } = useDashboardHeatmap()
  const { data: infraStatus } = useInfraStatus('all')
  const { data: recentAlerts } = useAlerts({ limit: 5, page: 1 })
  const { data: nodesData } = useNodesMetric()

  // role → NodeMetric 맵
  const nodeMetricMap = useMemo<Map<string, NodeMetric>>(() => {
    const map = new Map<string, NodeMetric>()
    for (const n of nodesData?.data ?? []) {
      if (n.role) map.set(n.role, n)
      map.set(n.instance, n)
    }
    return map
  }, [nodesData])

  const displayedServices = useMemo(() => {
    if (!infraStatus) return []
    if (selectedType === 'all') return infraStatus.types.flatMap((t) => t.services)
    return infraStatus.types.find((t) => t.type === selectedType)?.services ?? []
  }, [infraStatus, selectedType])

  const isHostsTab = selectedType === 'node'

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Firing" value={stats?.totalFiring} icon={Flame} color="bg-red-500/20" />
        <StatCard label="Critical" value={stats?.totalCritical} icon={AlertTriangle} color="bg-red-600/30" />
        <StatCard label="Warning" value={stats?.totalWarning} icon={Activity} color="bg-yellow-500/20" />
        <StatCard label="Resolved (24h)" value={stats?.totalResolved} icon={CheckCircle} color="bg-green-500/20" />
      </div>

      {/* Heatmap */}
      <Card title="Alert Event Heatmap (Day × Hour)">
        {heatmap ? (
          <EventHeatmap data={heatmap.data} />
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
        )}
      </Card>

      {/* Infra Error Panel */}
      <InfraErrorPanel data={infraStatus} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Infrastructure Status */}
        <Card title="Infrastructure Status">
          {/* Type Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                selectedType === 'all'
                  ? 'bg-violet-600/20 border-violet-500/50 text-violet-600 dark:text-violet-300'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'
              }`}
            >
              All
            </button>
            {infraStatus?.types.map((t) => (
              <InfraTypeTab
                key={t.type}
                typeStatus={t}
                selected={selectedType === t.type}
                onClick={() => setSelectedType(t.type as InfraType)}
              />
            ))}
          </div>

          {/* Service Grid */}
          {infraStatus ? (
            <div className={`grid gap-2 max-h-64 overflow-y-auto ${isHostsTab ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {isHostsTab
                ? displayedServices.map((svc, i) => (
                    <HostMetricCard
                      key={`${svc.instance}-${i}`}
                      svc={svc}
                      metric={nodeMetricMap.get(svc.role ?? '') ?? nodeMetricMap.get(svc.instance)}
                    />
                  ))
                : displayedServices.map((svc, i) => (
                    <InfraServiceCard key={`${svc.instance}-${i}`} svc={svc} />
                  ))
              }
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
          )}
        </Card>

        {/* Recent Alerts */}
        <Card title="Recent Alerts">
          {recentAlerts ? (
            <div className="space-y-2">
              {recentAlerts.data.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => navigate(`/alerts/${alert.id}`)}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <StatusDot status={alert.status} />
                  <Badge severity={alert.severity} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{alert.alertName}</span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {new Date(alert.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
          )}
        </Card>
      </div>
    </div>
  )
}
