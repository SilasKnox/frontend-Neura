'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { apiRequest } from '@/lib/api/client'
import { Insight } from '@/stores/overviewStore'
import { DashboardSkeleton } from '@/components/DashboardSkeleton'
import InsightFeedbackModal from '@/components/InsightFeedbackModal'

interface InsightsResponse {
  insights: Insight[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
  calculated_at: string | null
}

export default function InsightsPage() {
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; insightId: string; isPositive: boolean }>({
    isOpen: false,
    insightId: '',
    isPositive: true,
  })
  
  // Get filters from URL params
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const severityFilter = searchParams.get('severity') || 'all'
  const statusFilter = searchParams.get('status') || 'all'
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, total_pages: 0 })

  useEffect(() => {
    if (user) {
      fetchInsights()
    }
  }, [user, page, limit, severityFilter, statusFilter])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      
      if (severityFilter !== 'all') {
        params.append('severity', severityFilter)
      }
      
      const response = await apiRequest<InsightsResponse>(`/api/insights/?${params.toString()}`)
      
      // Filter by status (resolved/active) on frontend since backend doesn't support it
      let filteredInsights = response.insights
      if (statusFilter === 'active') {
        filteredInsights = response.insights.filter(i => !i.is_marked_done)
      } else if (statusFilter === 'resolved') {
        filteredInsights = response.insights.filter(i => i.is_marked_done)
      }
      
      setInsights(filteredInsights)
      setPagination(response.pagination)
    } catch (err: any) {
      console.error('Failed to fetch insights:', err)
      showToast('Failed to load insights', 'error')
    } finally {
      setLoading(false)
    }
  }

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all' || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.set('page', '1') // Reset to first page when filtering
    router.push(`/insights?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`/insights?${params.toString()}`)
  }

  const handleResolve = async (insightId: string) => {
    try {
      await apiRequest(`/api/insights/${insightId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_marked_done: true }),
      })
      showToast('Insight marked as resolved', 'success')
      fetchInsights()
      setExpandedCardId(null)
    } catch (err: any) {
      showToast('Failed to resolve insight', 'error')
    }
  }

  const handleGotIt = async (insightId: string) => {
    try {
      await apiRequest(`/api/insights/${insightId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_acknowledged: true }),
      })
      showToast('Insight acknowledged', 'success')
      fetchInsights()
    } catch (err: any) {
      showToast('Failed to acknowledge insight', 'error')
    }
  }

  const handleFeedbackSubmit = async (feedbackText: string) => {
    try {
      const insight = insights.find(i => i.insight_id === feedbackModal.insightId)
      if (!insight) {
        showToast('Insight not found', 'error')
        return
      }

      await apiRequest('/api/feedback/', {
        method: 'POST',
        body: JSON.stringify({
          insight_id: insight.insight_id,
          insight_type: insight.insight_type,
          insight_title: insight.title,
          is_helpful: feedbackModal.isPositive,
          comment: feedbackText || undefined,
        }),
      })

      setFeedbackModal({ isOpen: false, insightId: '', isPositive: true })
      showToast('Thank you for your feedback!', 'success')
    } catch (err: any) {
      console.error('Failed to submit feedback:', err)
      showToast('Failed to submit feedback. Please try again.', 'error')
    }
  }

  if (authLoading || loading) {
    return <DashboardSkeleton />
  }

  if (!user) {
    return null
  }

  // Group insights by severity for display
  const watchInsights = insights.filter(i => i.severity === 'high')
  const okInsights = insights.filter(i => i.severity === 'medium')
  const lowInsights = insights.filter(i => i.severity === 'low')

  return (
    <div className="min-h-screen bg-bg-primary p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary-900">All Insights</h1>
            <p className="mt-1 text-sm text-text-secondary-700">
              {pagination.total} {pagination.total === 1 ? 'insight' : 'insights'} total
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <select
            value={severityFilter}
            onChange={(e) => updateFilters('severity', e.target.value)}
            className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary px-3 py-2 text-sm text-text-primary-900 focus:border-text-brand-tertiary-600 focus:outline-none focus:ring-1 focus:ring-text-brand-tertiary-600"
          >
            <option value="all">All Severities</option>
            <option value="high">High (WATCH)</option>
            <option value="medium">Medium (OK)</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => updateFilters('status', e.target.value)}
            className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary px-3 py-2 text-sm text-text-primary-900 focus:border-text-brand-tertiary-600 focus:outline-none focus:ring-1 focus:ring-text-brand-tertiary-600"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* Insights List */}
        {insights.length === 0 ? (
          <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-12 text-center">
            <p className="text-text-secondary-700">No insights found matching your filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* WATCH Insights */}
            {watchInsights.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                  <span className="h-0.5 w-8 bg-[#f59e0b]"></span>
                  WATCH ({watchInsights.length})
                </h2>
                <div className="space-y-3">
                  {watchInsights.map((insight) => (
                    <WatchCard
                      key={insight.insight_id}
                      insight={insight}
                      isExpanded={expandedCardId === insight.insight_id}
                      onExpand={() => setExpandedCardId(expandedCardId === insight.insight_id ? null : insight.insight_id)}
                      onResolve={() => handleResolve(insight.insight_id)}
                      onFeedback={(isPositive) => setFeedbackModal({ isOpen: true, insightId: insight.insight_id, isPositive })}
                      calculatedAt={null}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* OK Insights */}
            {okInsights.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                  <span className="h-0.5 w-8 bg-text-brand-tertiary-600"></span>
                  OK ({okInsights.length})
                </h2>
                <div className="space-y-3">
                  {okInsights.map((insight) => (
                    <OKCard
                      key={insight.insight_id}
                      insight={insight}
                      isExpanded={expandedCardId === insight.insight_id}
                      onExpand={() => setExpandedCardId(expandedCardId === insight.insight_id ? null : insight.insight_id)}
                      onGotIt={() => handleGotIt(insight.insight_id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Low Severity Insights */}
            {lowInsights.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                  <span className="h-0.5 w-8 bg-text-quaternary-500"></span>
                  LOW ({lowInsights.length})
                </h2>
                <div className="space-y-3">
                  {lowInsights.map((insight) => (
                    <OKCard
                      key={insight.insight_id}
                      insight={insight}
                      isExpanded={expandedCardId === insight.insight_id}
                      onExpand={() => setExpandedCardId(expandedCardId === insight.insight_id ? null : insight.insight_id)}
                      onGotIt={() => handleGotIt(insight.insight_id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary px-3 py-2 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                let pageNum: number
                if (pagination.total_pages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= pagination.total_pages - 2) {
                  pageNum = pagination.total_pages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      pageNum === page
                        ? 'bg-text-brand-tertiary-600 text-white'
                        : 'border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary text-text-primary-900 hover:bg-bg-secondary'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === pagination.total_pages}
              className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary px-3 py-2 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Feedback Modal */}
        <InsightFeedbackModal
          isOpen={feedbackModal.isOpen}
          onClose={() => setFeedbackModal({ isOpen: false, insightId: '', isPositive: true })}
          onSubmit={handleFeedbackSubmit}
          isPositive={feedbackModal.isPositive}
        />
      </div>
    </div>
  )
}

// WATCH Card Component (reused from overview)
function WatchCard({
  insight,
  isExpanded,
  onExpand,
  onResolve,
  onFeedback,
  calculatedAt,
}: {
  insight: Insight
  isExpanded: boolean
  onExpand: () => void
  onResolve: () => void
  onFeedback: (isPositive: boolean) => void
  calculatedAt: string | null
}) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (dateOnly.getTime() === today.getTime()) {
      return `Today at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase()}`
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const timeframe = insight.supporting_numbers.find(n => 
    n.label.toLowerCase().includes('day') || n.label.toLowerCase().includes('timeframe')
  )

  const financialDetail = insight.supporting_numbers.find(n => 
    n.label.toLowerCase().includes('vs') || 
    n.label.toLowerCase().includes('average') ||
    n.label.toLowerCase().includes('change') ||
    n.label.toLowerCase().includes('difference')
  )

  const getInputsUsed = (): string[] => {
    const inputs: string[] = []
    const insightType = insight.insight_type.toLowerCase()
    const dataNotes = (insight.data_notes || '').toLowerCase()

    if (insightType.includes('cash') || insightType.includes('runway') || insightType.includes('squeeze')) {
      inputs.push('Bank transactions')
    }
    if (insightType.includes('receivable') || dataNotes.includes('invoice')) {
      inputs.push('Invoices')
    }
    if (insightType.includes('expense') || insightType.includes('bill') || dataNotes.includes('bill')) {
      inputs.push('Bills')
    }
    if (insightType.includes('profitability') || dataNotes.includes('trial balance')) {
      inputs.push('Trial Balance')
    }

    if (inputs.length === 0) {
      inputs.push('Bank transactions', 'Invoices', 'Bills')
    }

    return inputs
  }

  const inputsUsed = getInputsUsed()

  return (
    <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-[#f59e0b] px-2 py-0.5 text-xs font-semibold text-white">
              WATCH
            </span>
            <span className="rounded-full border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary px-2 py-0.5 text-xs text-text-primary-900">
              {insight.confidence_level === 'high' ? 'High' : insight.confidence_level === 'medium' ? 'Medium' : 'Low'} confidence
            </span>
          </div>
          <h3 className="mb-1 break-words text-sm font-semibold text-text-primary-900">{insight.title}</h3>
          {financialDetail && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary px-2 py-0.5 text-xs font-medium text-text-primary-900">
                <span>💰</span>
                <span>{typeof financialDetail.value === 'number' 
                  ? `${financialDetail.value >= 0 ? '+' : ''}$${Math.abs(financialDetail.value).toLocaleString()} vs average`
                  : `${financialDetail.value} vs average`}
                </span>
              </span>
            </div>
          )}
          <p className="mb-3 break-words text-sm leading-relaxed text-text-secondary-700">{insight.summary}</p>
          
          {!isExpanded && (
            <button
              onClick={onExpand}
              className="flex items-center gap-1 text-sm text-text-brand-tertiary-600 hover:underline"
            >
              How we worked this out
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {timeframe && (
            <div className="flex items-center gap-1.5 text-sm text-text-quaternary-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{typeof timeframe.value === 'number' ? `~${timeframe.value} days` : timeframe.value}</span>
            </div>
          )}
          <button
            onClick={onResolve}
            className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary px-3 py-1.5 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary whitespace-nowrap"
          >
            Resolve
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onFeedback(true)}
              className="rounded p-1 text-text-quaternary-500 hover:text-text-primary-900 hover:bg-bg-secondary transition-colors"
              title="Helpful"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
              </svg>
            </button>
            <button
              onClick={() => onFeedback(false)}
              className="rounded p-1 text-text-quaternary-500 hover:text-text-primary-900 hover:bg-bg-secondary transition-colors"
              title="Not helpful"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4 border-t border-border-secondary pt-4">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
              WHAT WE'RE SEEING
            </h4>
            <ul className="space-y-1 text-sm leading-relaxed text-text-secondary-700">
              {insight.why_it_matters.split('\n').map((line, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-primary-900"></span>
                  <span className="break-words">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
              INPUTS USED
            </h4>
            <div className="flex flex-wrap gap-2">
              {inputsUsed.map((input, i) => (
                <span
                  key={i}
                  className="rounded-md border border-border-secondary/40 bg-white dark:bg-bg-secondary-subtle px-2 py-1 text-xs font-medium text-text-primary-900"
                >
                  {input}
                </span>
              ))}
            </div>
          </div>

          {insight.data_notes && (
            <div className="rounded-md bg-[#fef3c7] dark:bg-[#78350f]/20 border border-[#fbbf24] dark:border-[#fbbf24]/40 p-3">
              <div className="flex items-start gap-2">
                <svg className="h-5 w-5 shrink-0 text-[#d97706]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-[#92400e] dark:text-[#fbbf24]">{insight.data_notes}</p>
              </div>
            </div>
          )}

          {insight.supporting_numbers.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                KEY NUMBERS
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {insight.supporting_numbers.map((num, i) => (
                  <div key={i}>
                    <div className="text-xs text-text-quaternary-500">{num.label}</div>
                    <div className="text-sm font-semibold text-text-primary-900">{num.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border-secondary pt-4 text-xs text-text-quaternary-500">
            <span>Based on last 90 days</span>
            <span>Updated {formatDate(calculatedAt)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// OK Card Component (reused from overview)
function OKCard({
  insight,
  isExpanded,
  onExpand,
  onGotIt,
}: {
  insight: Insight
  isExpanded: boolean
  onExpand: () => void
  onGotIt: () => void
}) {
  const impactAmount = insight.supporting_numbers.find(n => 
    n.label.toLowerCase().includes('impact') || 
    n.label.toLowerCase().includes('change') ||
    n.label.toLowerCase().includes('difference')
  )
  const suggestedAction = insight.recommended_actions[0] || ''

  return (
    <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="rounded-full border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary px-2 py-0.5 text-xs font-medium text-text-primary-900 shrink-0">
            OK
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-sm font-semibold text-text-primary-900 mb-0.5">{insight.title}</h3>
            {(impactAmount || suggestedAction) && (
              <p className="break-words text-xs leading-relaxed text-text-quaternary-500">
                {impactAmount && typeof impactAmount.value === 'number' 
                  ? `${impactAmount.value >= 0 ? '+' : ''}$${Math.abs(impactAmount.value).toLocaleString()}`
                  : impactAmount?.value || ''}
                {impactAmount && suggestedAction && ' · '}
                {suggestedAction}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onGotIt}
            className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary px-3 py-1.5 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary whitespace-nowrap"
          >
            Got it
          </button>
          <button
            onClick={onExpand}
            className="rounded-md p-1.5 text-text-primary-900 hover:bg-bg-secondary"
          >
            <svg
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4 border-t border-border-secondary pt-4">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
              WHAT WE'RE SEEING
            </h4>
            <p className="break-words text-sm leading-relaxed text-text-secondary-700">{insight.why_it_matters}</p>
          </div>

          {insight.recommended_actions.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                RECOMMENDED ACTIONS
              </h4>
              <ul className="space-y-1 text-sm leading-relaxed text-text-secondary-700">
                {insight.recommended_actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-primary-900"></span>
                    <span className="break-words">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
