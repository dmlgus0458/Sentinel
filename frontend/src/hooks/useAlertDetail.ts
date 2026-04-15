import { useQuery } from '@tanstack/react-query'
import { getAlert, getComments } from '../api/alertApi'

export function useAlertDetail(id: number) {
  return useQuery({
    queryKey: ['alert', id],
    queryFn: () => getAlert(id),
    enabled: !!id,
  })
}

export function useAlertComments(id: number) {
  return useQuery({
    queryKey: ['comments', id],
    queryFn: () => getComments(id),
    enabled: !!id,
  })
}
