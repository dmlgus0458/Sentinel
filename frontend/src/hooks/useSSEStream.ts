import { useEffect } from 'react'
import type { SseAlertEvent } from '../types'
import { useAlertStore } from '../store/useAlertStore'

export function useSSEStream() {
  useEffect(() => {
    let es: EventSource | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      es = new EventSource('/api/v1/notifications/stream')

      es.addEventListener('alert', (e: MessageEvent) => {
        try {
          const event = JSON.parse(e.data) as SseAlertEvent
          useAlertStore.getState().addUnread(event)
        } catch {
          // ignore parse errors
        }
      })

      es.onerror = () => {
        es?.close()
        timeoutId = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      es?.close()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])
}
