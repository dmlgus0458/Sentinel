import { create } from 'zustand'
import type { SseAlertEvent } from '../types'

interface AlertStore {
  unreadCount: number
  recentEvents: SseAlertEvent[]
  addUnread: (event: SseAlertEvent) => void
  clearUnread: () => void
}

export const useAlertStore = create<AlertStore>((set) => ({
  unreadCount: 0,
  recentEvents: [],
  addUnread: (event) =>
    set((state) => ({
      unreadCount: state.unreadCount + 1,
      recentEvents: [event, ...state.recentEvents].slice(0, 20),
    })),
  clearUnread: () => set({ unreadCount: 0 }),
}))
