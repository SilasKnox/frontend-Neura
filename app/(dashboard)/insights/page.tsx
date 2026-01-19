'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { apiRequest } from '@/lib/api/client'
import { useInsightsStore } from '@/stores/insightsStore'
import { DashboardSkeleton } from '@/components/DashboardSkeleton'
import InsightFeedbackModal from '@/components/InsightFeedbackModal'
import WatchCard from '@/components/WatchCard'
import OKCard from '@/components/OKCard'

export default function InsightsPage() {
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Use Zustand store for insights data
  const { 
    insights: allInsights, 
    pagination, 
    isLoading, 
    fetchInsights, 
    refetchInsights 
  } = useInsightsStore()
  
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; insightId: string; isPositive: boolean }>({
    isOpen: false,
    insightId: '',
    isPositive: true,
  })
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  
  // Get filters from URL params
  const page = parseInt(searchParams.get('page') || '1', 10)
  const severityFilter = searchParams.get('severity') || 'all'
  const statusFilter = searchParams.get('status') || 'all'

  // Fetch insights once when user is available
  const userId = user?.id
  useEffect(() => {
    if (userId) {
      fetchInsights()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Filter insights on frontend based on URL params
  const insights = useMemo(() => {
    let filtered = allInsights
    
    // Filter by severity
    if (severityFilter !== 'all') {
      filtered = filtered.filter(i => i.severity === severityFilter)
    }
    
    // Filter by status (resolved/active)
    if (statusFilter === 'active') {
      filtered = filtered.filter(i => !i.is_marked_done)
    } else if (statusFilter === 'resolved') {
      filtered = filtered.filter(i => i.is_marked_done)
    }
    
    return filtered
  }, [allInsights, severityFilter, statusFilter])

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
    if (actionLoadingId) return
    setActionLoadingId(insightId)
    try {
      await apiRequest(`/api/insights/${insightId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_marked_done: true }),
      })
      showToast('Insight marked as resolved', 'success')
      refetchInsights() // Force refetch after action
      setExpandedCardId(null)
    } catch (err) {
      showToast('Failed to resolve insight', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleGotIt = async (insightId: string) => {
    if (actionLoadingId) return
    setActionLoadingId(insightId)
    try {
      await apiRequest(`/api/insights/${insightId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_acknowledged: true }),
      })
      showToast('Insight acknowledged', 'success')
      refetchInsights() // Force refetch after action
    } catch (err) {
      showToast('Failed to acknowledge insight', 'error')
    } finally {
      setActionLoadingId(null)
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
    } catch (err) {
      console.error('Failed to submit feedback:', err)
      showToast('Failed to submit feedback. Please try again.', 'error')
    }
  }

  if (authLoading || isLoading) {
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
                      isLoading={actionLoadingId === insight.insight_id}
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
                      isLoading={actionLoadingId === insight.insight_id}
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
                      isLoading={actionLoadingId === insight.insight_id}
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
