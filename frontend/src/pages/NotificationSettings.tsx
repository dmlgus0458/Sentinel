import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import {
  getNotificationSettings,
  createNotificationSetting,
  updateNotificationSetting,
  deleteNotificationSetting,
} from '../api/notificationApi'
import type { Severity, NotificationSettingRequest } from '../types'

const SEVERITY_OPTIONS: Severity[] = ['critical', 'warning', 'info']

const severityBadge: Record<Severity, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

export function NotificationSettings() {
  const qc = useQueryClient()
  const { data: settings, isLoading } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: getNotificationSettings,
  })

  const createMutation = useMutation({
    mutationFn: createNotificationSetting,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-settings'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: { enabled: boolean } }) =>
      updateNotificationSetting(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-settings'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNotificationSetting,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-settings'] }),
  })

  const [target, setTarget] = useState('')
  const [severityFilter, setSeverityFilter] = useState<Severity[]>([])

  const toggleSeverity = (s: Severity) => {
    setSeverityFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  const handleCreate = () => {
    if (!target.trim()) return
    const body: NotificationSettingRequest = {
      channel: 'email',
      target,
      severityFilter,
      enabled: true,
    }
    createMutation.mutate(body, {
      onSuccess: () => {
        setTarget('')
        setSeverityFilter([])
      },
    })
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Add new */}
      <Card title="Add Email Recipient">
        <div className="space-y-4">
          <input
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-violet-500"
            placeholder="Email address"
            type="email"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <div>
            <p className="text-xs text-gray-500 mb-2">
              Severity Filter{' '}
              <span className="text-gray-600">(empty = all severities)</span>
            </p>
            <div className="flex gap-2">
              {SEVERITY_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSeverity(s)}
                  className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                    severityFilter.includes(s)
                      ? `${severityBadge[s]} border`
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={!target.trim() || createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
          >
            <Plus size={16} />
            Add Recipient
          </button>
        </div>
      </Card>

      {/* List */}
      <Card title="Recipients">
        {isLoading ? (
          <div className="py-8 text-center text-gray-500 text-sm">Loading...</div>
        ) : !settings || settings.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            No recipients configured
          </div>
        ) : (
          <div className="space-y-2">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="flex items-center gap-3 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg px-3 py-3"
              >
                {/* Toggle */}
                <button
                  onClick={() =>
                    updateMutation.mutate({
                      id: setting.id,
                      body: { enabled: !setting.enabled },
                    })
                  }
                  className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                    setting.enabled ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                  title={setting.enabled ? 'Disable' : 'Enable'}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      setting.enabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${setting.enabled ? 'text-gray-700 dark:text-gray-200' : 'text-gray-500'}`}>
                    {setting.target}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] text-gray-600 uppercase">{setting.channel}</span>
                    <span className="text-gray-400 dark:text-gray-700 mx-1">·</span>
                    {setting.severityFilter.length === 0 ? (
                      <span className="text-[10px] text-gray-600">All severities</span>
                    ) : (
                      setting.severityFilter.map((s) => (
                        <span
                          key={s}
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${severityBadge[s]}`}
                        >
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteMutation.mutate(setting.id)}
                  className="text-gray-400 dark:text-gray-600 hover:text-red-400 transition-colors shrink-0"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
