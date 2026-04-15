import { Bell } from 'lucide-react'
import { useAlertStore } from '../../store/useAlertStore'

export function AlertBell() {
  const unreadCount = useAlertStore((s) => s.unreadCount)
  const clearUnread = useAlertStore((s) => s.clearUnread)

  return (
    <button
      onClick={clearUnread}
      className="relative p-2 text-gray-400 hover:text-gray-100 transition-colors"
      title="알림"
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
