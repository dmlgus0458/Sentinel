import axios from 'axios'
import type {
  NotificationSetting,
  NotificationSettingRequest,
  NotificationSettingUpdateRequest,
} from '../types'

const BASE = '/api/v1'

export const getNotificationSettings = () =>
  axios
    .get<{ data: NotificationSetting[] }>(`${BASE}/notification-settings`)
    .then((r) => r.data.data ?? [])

export const createNotificationSetting = (body: NotificationSettingRequest) =>
  axios
    .post<NotificationSetting>(`${BASE}/notification-settings`, body)
    .then((r) => r.data)

export const updateNotificationSetting = (
  id: number,
  body: NotificationSettingUpdateRequest
) =>
  axios
    .put<NotificationSetting>(`${BASE}/notification-settings/${id}`, body)
    .then((r) => r.data)

export const deleteNotificationSetting = (id: number) =>
  axios.delete(`${BASE}/notification-settings/${id}`).then((r) => r.data)
