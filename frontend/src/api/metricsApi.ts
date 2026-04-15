import axios from 'axios'
import type {
  MetricsQueryParams,
  MetricsRangeParams,
  PrometheusResult,
  NodesMetricResponse,
  DashboardStats,
  DashboardHeatmapResponse,
  InfraType,
  InfraStatusResponse,
} from '../types'

const BASE = '/api/v1'

export const queryMetrics = (params: MetricsQueryParams) =>
  axios
    .get<PrometheusResult>(`${BASE}/metrics/query`, { params })
    .then((r) => r.data)

export const queryMetricsRange = (params: MetricsRangeParams) =>
  axios
    .get<PrometheusResult>(`${BASE}/metrics/query_range`, { params })
    .then((r) => r.data)

export const getNodesMetric = () =>
  axios.get<NodesMetricResponse>(`${BASE}/metrics/nodes`).then((r) => r.data)

export const getDashboardStats = () =>
  axios.get<DashboardStats>(`${BASE}/dashboard/stats`).then((r) => r.data)

export const getDashboardHeatmap = () =>
  axios
    .get<DashboardHeatmapResponse>(`${BASE}/dashboard/heatmap`)
    .then((r) => r.data)

export const getInfraStatus = (type: InfraType = 'all') =>
  axios
    .get<InfraStatusResponse>(`${BASE}/metrics/infra-status`, { params: { type } })
    .then((r) => r.data)
