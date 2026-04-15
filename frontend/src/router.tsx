import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { AlertList } from './pages/AlertList'
import { AlertDetail } from './pages/AlertDetail'
import { MetricsExplorer } from './pages/MetricsExplorer'
import { NotificationSettings } from './pages/NotificationSettings'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'alerts', element: <AlertList /> },
      { path: 'alerts/:id', element: <AlertDetail /> },
      { path: 'metrics', element: <MetricsExplorer /> },
      { path: 'settings/notifications', element: <NotificationSettings /> },
    ],
  },
])
