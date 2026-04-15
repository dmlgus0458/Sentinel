import { AlertTriangle, CheckCircle } from 'lucide-react'
import { Card } from './Card'
import type { InfraStatusResponse } from '../../types'

interface ErrorEntry {
  name: string
  instance: string
  typeLabel: string
}

interface InfraErrorPanelProps {
  data: InfraStatusResponse | undefined
}

export function InfraErrorPanel({ data }: InfraErrorPanelProps) {
  if (!data) {
    return (
      <Card title="Infra Errors">
        <div className="h-10 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
          Loading...
        </div>
      </Card>
    )
  }

  const errorEntries: ErrorEntry[] = data.types.flatMap((t) =>
    t.services
      .filter((svc) => !svc.up)
      .map((svc) => ({
        name: svc.role ?? svc.name,
        instance: svc.instance,
        typeLabel: t.label,
      }))
  )

  return (
    <Card title="Infra Errors">
      {errorEntries.length === 0 ? (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm py-1">
          <CheckCircle size={16} />
          <span>All systems operational</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
          {errorEntries.map((entry, i) => (
            <div
              key={`${entry.instance}-${i}`}
              className="flex items-center gap-3 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/10 border border-red-400/60 dark:border-red-500/40"
            >
              <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate flex-1">
                {entry.name}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                {entry.instance}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 flex-shrink-0">
                {entry.typeLabel}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
