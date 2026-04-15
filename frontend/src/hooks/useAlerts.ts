import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAlerts, ackAlert, addComment } from '../api/alertApi'
import type { AlertListParams, AckRequest, CommentRequest } from '../types'

export function useAlerts(params: AlertListParams = {}) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => getAlerts(params),
  })
}

export function useAckAlert(alertId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AckRequest) => ackAlert(alertId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      qc.invalidateQueries({ queryKey: ['alert', alertId] })
    },
  })
}

export function useAddComment(alertId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CommentRequest) => addComment(alertId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', alertId] })
    },
  })
}
