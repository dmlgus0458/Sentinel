import type { HeatmapCell } from '../../types'

interface EventHeatmapProps {
  data: HeatmapCell[]
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function getCellColor(count: number): string {
  if (count === 0) return 'bg-gray-200 dark:bg-gray-800'
  if (count <= 5) return 'bg-green-400/60 dark:bg-green-700/70'
  if (count <= 11) return 'bg-green-500/70 dark:bg-green-500/70'
  if (count <= 23) return 'bg-yellow-400/80 dark:bg-yellow-500/70'
  if (count <= 35) return 'bg-orange-400/80 dark:bg-orange-500/70'
  return 'bg-red-500/80 dark:bg-red-500/70'
}

export function EventHeatmap({ data }: EventHeatmapProps) {
  const cellMap = new Map<string, number>()
  for (const cell of data) {
    cellMap.set(`${cell.day}-${cell.hour}`, cell.count)
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Hour labels */}
        <div className="flex mb-1 ml-10">
          {HOURS.map((h) => (
            <div
              key={h}
              className="flex-1 text-center text-[10px] text-gray-400 dark:text-gray-500"
            >
              {h % 6 === 0 ? `${h}h` : ''}
            </div>
          ))}
        </div>

        {/* Rows */}
        {DAYS.map((day, dayIdx) => (
          <div key={day} className="flex items-center mb-1">
            <div className="w-10 text-[11px] text-gray-400 dark:text-gray-500 text-right pr-2">
              {day}
            </div>
            {HOURS.map((hour) => {
              const count = cellMap.get(`${dayIdx}-${hour}`) ?? 0
              return (
                <div
                  key={hour}
                  title={`${day} ${hour}:00 — ${count} alerts`}
                  className={`flex-1 h-4 mx-px rounded-sm ${getCellColor(count)} cursor-default transition-opacity hover:opacity-80`}
                />
              )
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 ml-10 text-[11px] text-gray-400 dark:text-gray-500">
          <span>Less</span>
          {[0, 3, 12, 24, 36].map((v) => (
            <div key={v} className={`w-3 h-3 rounded-sm ${getCellColor(v)}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
