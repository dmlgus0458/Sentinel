import type { AlertStatus } from '../../types'

interface StatusDotProps {
  status: AlertStatus
  showLabel?: boolean
}

export function StatusDot({ status, showLabel = false }: StatusDotProps) {
  const isFiring = status === 'firing'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          isFiring ? 'bg-red-500 animate-pulse' : 'bg-gray-500'
        }`}
      />
      {showLabel && (
        <span className={`text-xs ${isFiring ? 'text-red-400' : 'text-gray-400'}`}>
          {isFiring ? 'Firing' : 'Resolved'}
        </span>
      )}
    </span>
  )
}
