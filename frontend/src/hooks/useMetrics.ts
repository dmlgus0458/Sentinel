import { useQuery } from '@tanstack/react-query'
import {
  queryMetricsRange,
  getNodesMetric,
  getDashboardStats,
  getDashboardHeatmap,
  getInfraStatus,
} from '../api/metricsApi'
import type { MetricsRangeParams, InfraType } from '../types'

export function useMetricsRange(params: MetricsRangeParams, enabled = true) {
  return useQuery({
    queryKey: ['metrics-range', params],
    queryFn: () => queryMetricsRange(params),
    enabled,
  })
}

export function useNodesMetric() {
  return useQuery({
    queryKey: ['nodes-metric'],
    queryFn: getNodesMetric,
    refetchInterval: 30000,
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000,
  })
}

export function useDashboardHeatmap() {
  return useQuery({
    queryKey: ['dashboard-heatmap'],
    queryFn: getDashboardHeatmap,
  })
}

export function useInfraStatus(type: InfraType = 'all') {
  return useQuery({
    queryKey: ['infra-status', type],
    queryFn: () => getInfraStatus(type),
    refetchInterval: 30000,
  })
}
