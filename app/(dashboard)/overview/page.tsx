'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { apiRequest } from '@/lib/api/client'
import { useSettingsStore } from '@/stores/settingsStore'
import { useOverviewStore, OverviewData, Insight } from '@/stores/overviewStore'
import XeroConnectModal from '@/components/XeroConnectModal'
import InsightGenerationModal from '@/components/InsightGenerationModal'
import InsightFeedbackModal from '@/components/InsightFeedbackModal'
import { DashboardSkeleton } from '@/components/DashboardSkeleton'

// Types are imported from overviewStore

interface XeroIntegration {
  is_connected: boolean
  status: string
  connected_at: string | null
  last_synced_at: string | null
  needs_reconnect: boolean
}

interface SettingsData {
  email: string
  xero_integration: XeroIntegration
  last_sync_time: string | null
  support_link: string | null
}

export default function OverviewPage() {
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [dataQuality, setDataQuality] = useState<'Good' | 'Mixed' | 'Low'>('Good')
  const [showXeroModal, setShowXeroModal] = useState(false)
  const [showInsightModal, setShowInsightModal] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [triggerTimestamp, setTriggerTimestamp] = useState<number | undefined>(undefined)
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; insightId: string; isPositive: boolean }>({
    isOpen: false,
    insightId: '',
    isPositive: true,
  })
  
  // Use Zustand stores
  const { settings, fetchSettings, getXeroConnected } = useSettingsStore()
  const { data, isLoading, error, fetchOverview, updateOverview } = useOverviewStore()

  useEffect(() => {
    if (user) {
      // Fetch from store (uses cache unless page refresh)
      fetchOverview()
      fetchSettings()
    }
  }, [user, fetchOverview, fetchSettings])

  // Update data quality when data changes
  useEffect(() => {
    if (data) {
      const hasLowConfidence = data.cash_runway?.confidence_level === 'Low' || 
                               data.cash_pressure?.confidence === 'low'
      const hasMediumConfidence = data.cash_runway?.confidence_level === 'Medium' || 
                                  data.cash_pressure?.confidence === 'medium'
      
      if (hasLowConfidence) {
        setDataQuality('Low')
      } else if (hasMediumConfidence) {
        setDataQuality('Mixed')
      } else {
        setDataQuality('Good')
      }
    }
  }, [data])

  // Calculate Business Health Score (0-100)
  const calculateHealthScore = (): number => {
    if (!data) return 0

    let score = 50 // Base score

    // Cash runway contribution (0-30 points)
    if (data.cash_runway) {
      const status = data.cash_runway.status
      if (status === 'healthy') score += 30
      else if (status === 'warning') score += 15
      else if (status === 'critical') score += 5
      else if (status === 'negative') score -= 20
      // infinite (profitable) gets full points
      if (status === 'infinite') score += 30
    }

    // Cash pressure contribution (0-25 points)
    if (data.cash_pressure) {
      const status = data.cash_pressure.status
      if (status === 'GREEN') score += 25
      else if (status === 'AMBER') score += 12
      else if (status === 'RED') score -= 10
    }

    // Profitability contribution (0-25 points)
    if (data.profitability) {
      const risk = data.profitability.risk_level
      if (risk === 'low') score += 25
      else if (risk === 'medium') score += 10
      else if (risk === 'high') score -= 10
    }

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score))
  }

  const healthScore = calculateHealthScore()
  const healthStatus = healthScore >= 60 ? 'Healthy' : healthScore >= 40 ? 'At Risk' : 'Take Action'
  const healthStatusColor = healthScore >= 60 ? '#079455' : healthScore >= 40 ? '#f59e0b' : '#d92d20'

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (dateOnly.getTime() === today.getTime()) {
      return `Today, ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase()}`
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const handleResolve = async (insightId: string) => {
    try {
      await apiRequest(`/api/insights/${insightId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_marked_done: true }),
      })
      // Refresh data from store
      await fetchOverview(true)
      setExpandedCardId(null)
      showToast('Insight marked as resolved', 'success')
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
      // Refresh data from store
      await fetchOverview(true)
      showToast('Insight acknowledged', 'success')
    } catch (err: any) {
      showToast('Failed to acknowledge insight', 'error')
    }
  }

  const handleFeedbackSubmit = async (feedbackText: string) => {
    try {
      const insight = data?.insights.find(i => i.insight_id === feedbackModal.insightId)
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

      // Close modal and show success toast
      setFeedbackModal({ isOpen: false, insightId: '', isPositive: true })
      showToast('Thank you for your feedback!', 'success')
    } catch (err: any) {
      console.error('Failed to submit feedback:', err)
      showToast('Failed to submit feedback. Please try again.', 'error')
    }
  }

  const handleGenerateInsights = async () => {
    try {
      // Ensure settings are loaded
      if (!settings) {
        await fetchSettings()
      }
      
      // Check Xero connection using store
      const xeroConnected = getXeroConnected()
      
      if (!xeroConnected) {
        setShowXeroModal(true)
        return
      }

      // Record trigger timestamp BEFORE opening modal (UTC milliseconds)
      const triggeredAt = Date.now()
      setTriggerTimestamp(triggeredAt)
      
      // Open modal IMMEDIATELY (optimistic UI)
      setShowInsightModal(true)
      
      // Then trigger the backend process
      await apiRequest('/api/insights/trigger', {
        method: 'POST',
      })
    } catch (err: any) {
      // Close modal on error
      setShowInsightModal(false)
      setTriggerTimestamp(undefined)
    }
  }

  const handleInsightGenerationComplete = async () => {
    setShowInsightModal(false)
    setTriggerTimestamp(undefined)
    // Refresh overview data from store (force refresh)
    await fetchOverview(true)
  }

  const handleReSync = async () => {
    try {
      setSyncing(true)
      
      // Ensure settings are loaded
      if (!settings) {
        await fetchSettings()
      }
      
      // Check Xero connection using store
      const xeroConnected = getXeroConnected()
      
      if (!xeroConnected) {
        setShowXeroModal(true)
        setSyncing(false)
        return
      }

      // Record trigger timestamp BEFORE opening modal (UTC milliseconds)
      const triggeredAt = Date.now()
      setTriggerTimestamp(triggeredAt)
      
      // Open modal IMMEDIATELY (optimistic UI)
      setShowInsightModal(true)
      
      // Then trigger the backend process
      await apiRequest('/api/insights/trigger', {
        method: 'POST',
      })
    } catch (err: any) {
      // Close modal on error
      setShowInsightModal(false)
      setTriggerTimestamp(undefined)
    } finally {
      setSyncing(false)
    }
  }

  if (authLoading || isLoading) {
    return <DashboardSkeleton />
  }

  if (!user) {
    return null // Middleware will redirect
  }

  // Check if we have no insights
  const hasNoInsights = !data || data.insights.length === 0

  // Filter insights by severity and status
  const watchInsights = data?.insights.filter(
    i => i.severity === 'high' && !i.is_marked_done
  ).slice(0, 3) || []

  const okInsights = data?.insights.filter(
    i => i.severity === 'medium' && !i.is_marked_done
  ) || []

  const resolvedInsights = data?.insights.filter(
    i => i.is_marked_done
  ).slice(0, 5) || []

  // Calculate breakdown metrics from actual data
  // Cash Position: Based on runway status (higher runway = better score)
  const getCashPositionScore = (): number => {
    if (!data?.cash_runway) return 0
    const status = data.cash_runway.status
    if (status === 'infinite' || status === 'healthy') return 85
    if (status === 'warning') return 65
    if (status === 'critical') return 45
    return 25 // negative
  }

  // Revenue: Based on profitability risk
  const getRevenueScore = (): number => {
    if (!data?.profitability) return 0
    const risk = data.profitability.risk_level
    if (risk === 'low') return 85
    if (risk === 'medium') return 65
    return 45 // high
  }

  // Expenses: Inverse of profitability risk (lower risk = better expense management)
  const getExpensesScore = (): number => {
    if (!data?.profitability) return 0
    const risk = data.profitability.risk_level
    if (risk === 'low') return 80
    if (risk === 'medium') return 60
    return 40 // high
  }

  const cashPositionScore = getCashPositionScore()
  const revenueScore = getRevenueScore()
  const expensesScore = getExpensesScore()

  // Determine trend arrow colors (green = good, orange = warning, gray = neutral)
  const getCashTrend = () => {
    if (!data?.cash_runway) return { icon: '→', color: 'text-text-quaternary-500' }
    const status = data.cash_runway.status
    if (status === 'infinite' || status === 'healthy') return { icon: '↑', color: 'text-[#079455]' }
    if (status === 'warning') return { icon: '→', color: 'text-[#f59e0b]' }
    return { icon: '↓', color: 'text-[#d92d20]' }
  }

  const getRevenueTrend = () => {
    if (!data?.profitability) return { icon: '→', color: 'text-text-quaternary-500' }
    const risk = data.profitability.risk_level
    if (risk === 'low') return { icon: '↑', color: 'text-[#079455]' }
    if (risk === 'medium') return { icon: '→', color: 'text-[#f59e0b]' }
    return { icon: '↓', color: 'text-[#d92d20]' }
  }

  const getExpensesTrend = () => {
    if (!data?.profitability) return { icon: '→', color: 'text-text-quaternary-500' }
    const risk = data.profitability.risk_level
    // Lower risk = better expense management = good outcome
    if (risk === 'low') return { icon: '→', color: 'text-[#079455]' }
    if (risk === 'medium') return { icon: '→', color: 'text-[#f59e0b]' }
    return { icon: '↑', color: 'text-[#d92d20]' } // High risk = expenses going up = bad
  }

  const cashTrend = getCashTrend()
  const revenueTrend = getRevenueTrend()
  const expensesTrend = getExpensesTrend()

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="mb-2 text-display-md text-text-primary-900 font-bold">
                Your business today
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-text-quaternary-500">
                  Last updated: {formatDate(data?.calculated_at || null)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-text-quaternary-500">Data quality:</span>
                  <div className="flex gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      dataQuality === 'Good' ? 'bg-[#079455] text-white' : 'bg-bg-secondary-subtle text-text-quaternary-500'
                    }`}>
                      Good
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      dataQuality === 'Mixed' ? 'bg-[#f59e0b] text-white' : 'bg-bg-secondary-subtle text-text-quaternary-500'
                    }`}>
                      Mixed
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      dataQuality === 'Low' ? 'bg-[#d92d20] text-white' : 'bg-bg-secondary-subtle text-text-quaternary-500'
                    }`}>
                      Low
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Re-sync Button */}
            {!hasNoInsights && (
              <button
                onClick={handleReSync}
                disabled={syncing || showInsightModal}
                className="flex items-center gap-2 rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary px-4 py-2 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Re-sync
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-bg-error-secondary p-3 text-sm text-text-primary-900">
            {error}
          </div>
        )}

        {/* Empty State */}
        {hasNoInsights && !isLoading && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center py-12">
            <div className="mx-auto w-full max-w-2xl text-center">
              <div className="mb-6 flex justify-center">
                <svg
                  className="h-16 w-16 text-text-quaternary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="mb-3 text-xl font-semibold text-text-primary-900">
                No insights yet
              </h2>
              <p className="mb-8 text-base text-text-secondary-700">
                Generate insights to get started with your business health analysis.
              </p>
              <button
                onClick={handleGenerateInsights}
                disabled={showInsightModal}
                className="rounded-md bg-bg-brand-solid px-6 py-2.5 text-sm font-semibold text-text-white transition-colors hover:bg-fg-brand-primary-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate insights
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!hasNoInsights && (
        <div className="space-y-8">
          {/* Business Health Score Card */}
          <section>
            <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                  BUSINESS HEALTH SCORE
                </h2>
                <Link
                  href="/overview/health-score"
                  className="text-sm font-medium text-text-brand-tertiary-600 hover:underline cursor-pointer"
                >
                  View details &gt;
                </Link>
              </div>
              
              <div className="mb-4 flex items-baseline gap-3">
                <span className="text-5xl font-bold text-text-brand-tertiary-600">
                  {healthScore}
                </span>
                <span className="text-lg text-text-quaternary-500">/100</span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: healthStatusColor }}
                >
                  {healthStatus}
                </span>
              </div>

              <p className="mb-6 text-sm text-text-secondary-700">
                {healthScore >= 60
                  ? 'Your business is performing well with stable cash flow and manageable risks. A few items need attention but nothing urgent.'
                  : healthScore >= 40
                  ? 'Your business shows some areas of concern. Monitor cash flow closely and address key issues promptly.'
                  : 'Your business requires immediate attention. Take action on critical issues to improve financial health.'}
              </p>

              {/* Score Breakdown */}
              <div className="mb-4 grid grid-cols-3 gap-4 border-t border-border-secondary pt-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary-900">Cash position</span>
                    <span className={`text-sm font-semibold ${cashTrend.color}`}>
                      {cashTrend.icon === '↑' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : cashTrend.icon === '↓' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                        </svg>
                      )}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary-900">{Math.round(cashPositionScore)}</span>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary-900">Revenue</span>
                    <span className={`text-sm font-semibold ${revenueTrend.color}`}>
                      {revenueTrend.icon === '↑' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : revenueTrend.icon === '↓' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                        </svg>
                      )}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary-900">{Math.round(revenueScore)}</span>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary-900">Expenses</span>
                    <span className={`text-sm font-semibold ${expensesTrend.color}`}>
                      {expensesTrend.icon === '↑' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : expensesTrend.icon === '↓' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                        </svg>
                      )}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary-900">{Math.round(expensesScore)}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-text-quaternary-500">
                <span>Updated daily</span>
                <span>•</span>
                <span>Medium confidence</span>
              </div>
            </div>
          </section>

          {/* What needs your attention */}
          {watchInsights.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                WHAT NEEDS YOUR ATTENTION
              </h2>
              <div className="space-y-4">
                {watchInsights.map((insight) => (
                  <WatchCard
                    key={insight.insight_id}
                    insight={insight}
                    isExpanded={expandedCardId === insight.insight_id}
                    onExpand={() => setExpandedCardId(expandedCardId === insight.insight_id ? null : insight.insight_id)}
                    onResolve={() => handleResolve(insight.insight_id)}
                    onFeedback={(isPositive) => setFeedbackModal({ isOpen: true, insightId: insight.insight_id, isPositive })}
                    calculatedAt={data?.calculated_at || null}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Also worth knowing */}
          {okInsights.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                <span className="h-0.5 w-8 bg-text-brand-tertiary-600"></span>
                ALSO WORTH KNOWING
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

          {/* Coming up */}
          {data?.upcoming_commitments && data.upcoming_commitments.large_upcoming_bills.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                <span className="h-0.5 w-8 bg-text-brand-tertiary-600"></span>
                COMING UP
              </h2>
              <div className="space-y-3">
                {data.upcoming_commitments.large_upcoming_bills.slice(0, 3).map((bill, i) => (
                  <OKCard
                    key={i}
                    insight={{
                      insight_id: `upcoming-${i}`,
                      insight_type: 'upcoming_commitment',
                      title: `${bill.label || 'Payment'} due ${new Date(bill.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                      severity: 'medium',
                      confidence_level: 'high',
                      summary: `$${bill.amount.toLocaleString()} due soon`,
                      why_it_matters: `This payment is due in the coming days. Ensure sufficient cash is available.`,
                      recommended_actions: ['Review cash position', 'Confirm payment timing'],
                      supporting_numbers: [{ label: 'Amount', value: `$${bill.amount.toLocaleString()}` }],
                      generated_at: new Date().toISOString(),
                      is_acknowledged: false,
                      is_marked_done: false,
                    }}
                    isExpanded={expandedCardId === `upcoming-${i}`}
                    onExpand={() => setExpandedCardId(expandedCardId === `upcoming-${i}` ? null : `upcoming-${i}`)}
                    onGotIt={() => {}}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Resolved */}
          {resolvedInsights.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                RESOLVED
              </h2>
              <div className="space-y-2">
                {resolvedInsights.map((insight) => (
                  <div
                    key={insight.insight_id}
                    className="flex items-center gap-3 py-2"
                  >
                    <svg className="h-5 w-5 shrink-0 text-text-brand-tertiary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="min-w-0 flex-1 break-words text-sm font-medium text-text-primary-900">{insight.title}</span>
                    <span className="text-xs text-text-quaternary-500">Resolved</span>
                    <span className="text-xs text-text-quaternary-500">
                      {new Date(insight.generated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        )}

        {/* Footer */}
        {settings?.xero_integration?.is_connected && (
          <div className="mt-12 flex items-center justify-center gap-2 text-sm text-text-quaternary-500">
            <span className="h-1.5 w-1.5 rounded-full bg-[#079455]"></span>
            <span className="text-[#079455]">Connected to Xero</span>
            <span className="text-[#079455]">•</span>
            <span className="text-text-quaternary-500">Read-only</span>
            {data?.calculated_at && (
              <>
                <span className="text-[#079455]">•</span>
                <span className="text-text-quaternary-500">Synced {formatDate(data.calculated_at)}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Xero Connect Modal */}
      <XeroConnectModal
        isOpen={showXeroModal}
        onClose={() => setShowXeroModal(false)}
      />

      {/* Insight Generation Modal */}
      <InsightGenerationModal
        isOpen={showInsightModal}
        onClose={() => {
          setShowInsightModal(false)
          setTriggerTimestamp(undefined)
        }}
        onComplete={handleInsightGenerationComplete}
        triggeredAt={triggerTimestamp}
      />

      {/* Feedback Modal */}
      <InsightFeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ isOpen: false, insightId: '', isPositive: true })}
        onSubmit={handleFeedbackSubmit}
        isPositive={feedbackModal.isPositive}
      />
    </div>
  )
}

// WATCH Card Component
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

  // Extract timeframe from supporting numbers (e.g., "Days until tight ~12")
  const timeframe = insight.supporting_numbers.find(n => 
    n.label.toLowerCase().includes('day') || n.label.toLowerCase().includes('timeframe')
  )

  // Extract financial detail badge (e.g., "+$2,400 vs average")
  const financialDetail = insight.supporting_numbers.find(n => 
    n.label.toLowerCase().includes('vs') || 
    n.label.toLowerCase().includes('average') ||
    n.label.toLowerCase().includes('change') ||
    n.label.toLowerCase().includes('difference')
  )

  // Determine INPUTS USED based on insight type and data notes
  const getInputsUsed = (): string[] => {
    const inputs: string[] = []
    const insightType = insight.insight_type.toLowerCase()
    const dataNotes = (insight.data_notes || '').toLowerCase()

    // Always include bank transactions for cash-related insights
    if (insightType.includes('cash') || insightType.includes('runway') || insightType.includes('squeeze')) {
      inputs.push('Bank transactions')
    }

    // Add based on insight type
    if (insightType.includes('receivable') || dataNotes.includes('invoice')) {
      inputs.push('Invoices')
    }
    if (insightType.includes('expense') || insightType.includes('bill') || dataNotes.includes('bill')) {
      inputs.push('Bills')
    }
    if (insightType.includes('profitability') || dataNotes.includes('trial balance')) {
      inputs.push('Trial Balance')
    }

    // Default inputs if none found
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
              className="flex items-center gap-1 text-sm text-text-brand-tertiary-600 hover:underline cursor-pointer"
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
            className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary px-3 py-1.5 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary whitespace-nowrap cursor-pointer"
          >
            Resolve
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onFeedback(true)}
              className="rounded p-1 text-text-quaternary-500 hover:text-text-primary-900 hover:bg-bg-secondary transition-colors cursor-pointer"
              title="Helpful"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
              </svg>
            </button>
            <button
              onClick={() => onFeedback(false)}
              className="rounded p-1 text-text-quaternary-500 hover:text-text-primary-900 hover:bg-bg-secondary transition-colors cursor-pointer"
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

          {/* Data Notes Warning */}
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

// OK Card Component
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
  // Extract impact amount and suggested action for supporting line
  // Format: "impact amount · suggested action"
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
            className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary px-3 py-1.5 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary whitespace-nowrap cursor-pointer"
          >
            Got it
          </button>
          <button
            onClick={onExpand}
            className="rounded-md p-1.5 text-text-primary-900 hover:bg-bg-secondary cursor-pointer"
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
