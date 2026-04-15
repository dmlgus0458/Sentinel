import axios from 'axios'
import type {
  AlertListParams,
  AlertListResponse,
  AlertEvent,
  AlertAck,
  AlertComment,
  AckRequest,
  CommentRequest,
} from '../types'

const BASE = '/api/v1'

export const getAlerts = (params: AlertListParams) =>
  axios.get<AlertListResponse>(`${BASE}/alerts`, { params }).then((r) => r.data)

export const getAlert = (id: number) =>
  axios.get<{ data: AlertEvent }>(`${BASE}/alerts/${id}`).then((r) => r.data.data)

export const ackAlert = (id: number, body: AckRequest) =>
  axios.post<{ data: AlertAck }>(`${BASE}/alerts/${id}/ack`, body).then((r) => r.data.data)

export const getComments = (id: number) =>
  axios.get<{ data: AlertComment[] }>(`${BASE}/alerts/${id}/comments`).then((r) => r.data.data ?? [])

export const addComment = (id: number, body: CommentRequest) =>
  axios
    .post<{ data: AlertComment }>(`${BASE}/alerts/${id}/comments`, body)
    .then((r) => r.data.data)
