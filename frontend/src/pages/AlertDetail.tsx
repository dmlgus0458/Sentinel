import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { StatusDot } from '../components/ui/StatusDot'
import { Card } from '../components/ui/Card'
import { useAlertDetail, useAlertComments } from '../hooks/useAlertDetail'
import { useAckAlert, useAddComment } from '../hooks/useAlerts'

export function AlertDetail() {
  const { id } = useParams<{ id: string }>()
  const alertId = parseInt(id ?? '0')
  const navigate = useNavigate()

  const { data: alert, isLoading } = useAlertDetail(alertId)
  const { data: comments } = useAlertComments(alertId)
  const ackMutation = useAckAlert(alertId)
  const addCommentMutation = useAddComment(alertId)

  const [ackedBy, setAckedBy] = useState('')
  const [ackNote, setAckNote] = useState('')
  const [commentAuthor, setCommentAuthor] = useState('')
  const [commentBody, setCommentBody] = useState('')

  const handleAck = () => {
    if (!ackedBy.trim()) return
    ackMutation.mutate(
      { ackedBy, note: ackNote || undefined },
      {
        onSuccess: () => {
          setAckedBy('')
          setAckNote('')
        },
      }
    )
  }

  const handleComment = () => {
    if (!commentAuthor.trim() || !commentBody.trim()) return
    addCommentMutation.mutate(
      { author: commentAuthor, body: commentBody },
      {
        onSuccess: () => {
          setCommentBody('')
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading...
      </div>
    )
  }

  if (!alert) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Alert not found
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{alert.alertName}</h2>
            <p className="text-sm text-gray-500 mt-1 font-mono">{alert.fingerprint}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge severity={alert.severity} />
            <StatusDot status={alert.status} showLabel />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Started At</span>
            <p className="text-gray-700 dark:text-gray-300 mt-0.5">{new Date(alert.startsAt).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-500">Ended At</span>
            <p className="text-gray-700 dark:text-gray-300 mt-0.5">
              {alert.endsAt ? new Date(alert.endsAt).toLocaleString() : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Labels & Annotations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Labels">
          <div className="space-y-1.5">
            {Object.entries(alert.labels).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-xs">
                <span className="text-gray-500 min-w-[80px]">{k}</span>
                <span className="text-gray-700 dark:text-gray-300 font-mono break-all">{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Annotations">
          <div className="space-y-2">
            {Object.entries(alert.annotations).map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-gray-500">{k}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Ack */}
      <Card title="Acknowledgement">
        {alert.ack ? (
          <div className="flex items-start gap-3">
            <CheckCircle size={18} className="text-green-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="text-green-400 font-medium">
                ACK'd by <span className="font-bold">{alert.ack.ackedBy}</span>
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                {new Date(alert.ack.ackedAt).toLocaleString()}
              </p>
              {alert.ack.note && (
                <p className="text-gray-700 dark:text-gray-300 mt-2 bg-gray-100 dark:bg-gray-800 rounded p-2 text-xs">
                  {alert.ack.note}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-violet-500"
                placeholder="Your name"
                value={ackedBy}
                onChange={(e) => setAckedBy(e.target.value)}
              />
              <input
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-violet-500"
                placeholder="Note (optional)"
                value={ackNote}
                onChange={(e) => setAckNote(e.target.value)}
              />
            </div>
            <button
              onClick={handleAck}
              disabled={!ackedBy.trim() || ackMutation.isPending}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
            >
              {ackMutation.isPending ? 'Processing...' : 'Acknowledge'}
            </button>
          </div>
        )}
      </Card>

      {/* Comments */}
      <Card title="Comments">
        <div className="space-y-4">
          {comments && comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-violet-300">{c.author}</span>
                    <span className="text-[11px] text-gray-500">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{c.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No comments yet.</p>
          )}

          {/* Add comment */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2">
            <input
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-violet-500"
              placeholder="Your name"
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
            />
            <textarea
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-violet-500 resize-none"
              rows={3}
              placeholder="Write a comment..."
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
            />
            <button
              onClick={handleComment}
              disabled={
                !commentAuthor.trim() ||
                !commentBody.trim() ||
                addCommentMutation.isPending
              }
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
            >
              {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
