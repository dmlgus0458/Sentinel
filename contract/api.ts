/**
 * Sentinel API Contract
 * BE / FE 공유 타입 정의 — Single Source of Truth
 * BE는 이 구조로 응답을 구성하고, FE는 이 타입으로 API를 소비한다.
 */

// ─────────────────────────────────────────────
// Shared Primitives
// ─────────────────────────────────────────────

export type Severity = 'critical' | 'warning' | 'info'
export type AlertStatus = 'firing' | 'resolved'
export type NotificationChannel = 'email' | 'web'

// ─────────────────────────────────────────────
// Alert
// ─────────────────────────────────────────────

export interface AlertAck {
  id: number
  alertEventId: number
  ackedBy: string
  ackedAt: string        // ISO 8601
  note: string | null
}

export interface AlertComment {
  id: number
  alertEventId: number
  author: string
  body: string
  createdAt: string      // ISO 8601
}

export interface AlertEvent {
  id: number
  fingerprint: string
  alertName: string
  severity: Severity
  status: AlertStatus
  labels: Record<string, string>
  annotations: Record<string, string>
  startsAt: string       // ISO 8601
  endsAt: string | null  // null = 진행 중
  createdAt: string      // ISO 8601
  ack: AlertAck | null
}

// ─────────────────────────────────────────────
// Alert Requests
// ─────────────────────────────────────────────

export interface AckRequest {
  ackedBy: string
  note?: string
}

export interface CommentRequest {
  author: string
  body: string
}

// ─────────────────────────────────────────────
// Alert List / Filters
// ─────────────────────────────────────────────

export interface AlertListParams {
  severity?: Severity
  status?: AlertStatus
  from?: string          // ISO 8601 date
  to?: string            // ISO 8601 date
  page?: number          // 1-based, default 1
  limit?: number         // default 20, max 100
}

export interface AlertListResponse {
  data: AlertEvent[]
  total: number
  page: number
  limit: number
}

// ─────────────────────────────────────────────
// Metrics (Prometheus Proxy)
// ─────────────────────────────────────────────

export interface MetricsQueryParams {
  query: string
  time?: string          // ISO 8601, instant query
}

export interface MetricsRangeParams {
  query: string
  start: string          // ISO 8601
  end: string            // ISO 8601
  step: string           // e.g. "60", "5m"
}

export interface PrometheusResult {
  status: 'success' | 'error'
  data: {
    resultType: 'matrix' | 'vector' | 'scalar' | 'string'
    result: PrometheusMatrixItem[] | PrometheusVectorItem[]
  }
}

export interface PrometheusMatrixItem {
  metric: Record<string, string>
  values: [number, string][]  // [timestamp, value]
}

export interface PrometheusVectorItem {
  metric: Record<string, string>
  value: [number, string]     // [timestamp, value]
}

export interface NodeMetric {
  instance: string
  cpuUsage: number      // 0~100 (%)
  memoryUsage: number   // 0~100 (%)
  diskUsage: number     // 0~100 (%)
}

export interface NodesMetricResponse {
  data: NodeMetric[]
}

// ─────────────────────────────────────────────
// Dashboard Stats
// ─────────────────────────────────────────────

export interface DashboardStats {
  totalFiring: number
  totalCritical: number
  totalWarning: number
  totalResolved: number
}

// Heatmap: 요일(0=Mon~6=Sun) × 시(0~23) 별 알림 발생 수
export interface HeatmapCell {
  day: number    // 0~6
  hour: number   // 0~23
  count: number
}

export interface DashboardHeatmapResponse {
  data: HeatmapCell[]
}

// ─────────────────────────────────────────────
// Notification Settings
// ─────────────────────────────────────────────

export interface NotificationSetting {
  id: number
  channel: NotificationChannel
  target: string             // 이메일 주소 등
  severityFilter: Severity[] // 빈 배열 = 모든 severity
  enabled: boolean
  createdAt: string          // ISO 8601
}

export interface NotificationSettingRequest {
  channel: NotificationChannel
  target: string
  severityFilter: Severity[]
  enabled?: boolean           // default true
}

export interface NotificationSettingUpdateRequest {
  target?: string
  severityFilter?: Severity[]
  enabled?: boolean
}

// ─────────────────────────────────────────────
// SSE Event
// ─────────────────────────────────────────────

// GET /api/v1/notifications/stream 수신 이벤트 포맷
// event: alert
// data: SseAlertEvent (JSON)
export interface SseAlertEvent {
  id: number
  alertName: string
  severity: Severity
  status: AlertStatus
  instance: string     // labels.instance
  startsAt: string
}

// ─────────────────────────────────────────────
// Alertmanager Webhook (참고용 — BE only)
// ─────────────────────────────────────────────

export interface AlertmanagerWebhookPayload {
  version: string
  groupKey: string
  status: AlertStatus
  alerts: AlertmanagerAlert[]
}

export interface AlertmanagerAlert {
  status: AlertStatus
  labels: Record<string, string>
  annotations: Record<string, string>
  startsAt: string
  endsAt: string
  fingerprint: string
}

// ─────────────────────────────────────────────
// Common Response Wrappers
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
}

export interface ApiError {
  code: string
  message: string
}
