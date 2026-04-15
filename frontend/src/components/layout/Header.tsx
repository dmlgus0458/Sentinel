import { useLocation } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { AlertBell } from '../ui/AlertBell'
import { useThemeStore } from '../../store/useThemeStore'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/alerts': 'Alert List',
  '/metrics': 'Metrics Explorer',
  '/settings/notifications': 'Notification Settings',
}

export function Header() {
  const location = useLocation()
  const isAlertDetail = location.pathname.startsWith('/alerts/') && location.pathname !== '/alerts'
  const title = isAlertDetail
    ? 'Alert Detail'
    : (PAGE_TITLES[location.pathname] ?? 'Sentinel')

  const { theme, toggleTheme } = useThemeStore()

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6">
      <h1 className="text-gray-900 dark:text-gray-100 font-semibold text-base">{title}</h1>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <AlertBell />
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
          A
        </div>
      </div>
    </header>
  )
}
