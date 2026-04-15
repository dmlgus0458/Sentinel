import type { Severity } from '../../types'

interface BadgeProps {
  severity: Severity
  className?: string
}

const severityStyles: Record<Severity, string> = {
  critical:
    'bg-red-500/20 text-red-400 border border-red-500/30',
  warning:
    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  info:
    'bg-blue-500/20 text-blue-400 border border-blue-500/30',
}

export function Badge({ severity, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${severityStyles[severity]} ${className}`}
    >
      {severity.toUpperCase()}
    </span>
  )
}
