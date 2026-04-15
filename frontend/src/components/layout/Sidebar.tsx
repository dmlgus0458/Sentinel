import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Bell,
  BarChart2,
  Settings,
  Shield,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/metrics', icon: BarChart2, label: 'Metrics' },
  { to: '/settings/notifications', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  return (
    <aside className="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <span className="text-gray-900 dark:text-gray-100 font-semibold text-base tracking-tight">
            Sentinel
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-violet-500/20 text-violet-300 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 text-[11px] text-gray-600">
        v0.1.0
      </div>
    </aside>
  )
}
