import { create } from 'zustand'

// Types matching backend schemas (operational data only - no financial data)
export interface OrganizationSummary {
  id: string
  name: string
  user_email: string
  created_at: string
  sync_status: 'IDLE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  sync_step: string | null
  last_sync_error: string | null
  has_xero_connection: boolean
  last_sync_at: string | null
}

export interface AdminDashboardStats {
  total_organizations: number
  active_xero_connections: number
  syncs_in_progress: number
  failed_syncs: number
}

export interface AdminDashboardData {
  stats: AdminDashboardStats
  organizations: OrganizationSummary[]
}

// Feedback types (matching existing backend)
export interface FeedbackItem {
  id: string
  insight_id: string
  insight_type: string
  insight_title: string
  is_helpful: boolean
  comment: string | null
  user_id: string
  organization_id: string
  created_at: string
}

export interface FeedbackSummaryItem {
  insight_type: string
  insight_title: string
  total_feedback: number
  helpful_count: number
  not_helpful_count: number
  helpful_percentage: number
  comments: Array<{
    comment: string
    is_helpful: boolean
    created_at: string
  }>
}

export interface OverallFeedbackStats {
  total_feedback: number
  helpful_count: number
  not_helpful_count: number
  helpful_percentage: number
}

export interface FeedbackSummaryData {
  summary: FeedbackSummaryItem[]
  overall_stats: OverallFeedbackStats
}

// Feedback list response
interface FeedbackListResponse {
  total: number
  feedback: FeedbackItem[]
}

// Store state
interface AdminStore {
  // Dashboard data
  dashboard: AdminDashboardData | null
  isDashboardLoading: boolean
  dashboardError: string | null
  
  // Feedback summary
  feedbackSummary: FeedbackSummaryData | null
  isFeedbackLoading: boolean
  feedbackError: string | null
  
  // Feedback list (paginated)
  feedbackList: FeedbackItem[]
  feedbackTotal: number
  isFeedbackListLoading: boolean
  feedbackListError: string | null
  
  // Actions
  fetchDashboard: () => Promise<void>
  fetchFeedbackSummary: () => Promise<void>
  fetchFeedbackList: (limit?: number, offset?: number) => Promise<void>
  clearAdmin: () => void
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  dashboard: null,
  isDashboardLoading: false,
  dashboardError: null,
  
  feedbackSummary: null,
  isFeedbackLoading: false,
  feedbackError: null,
  
  feedbackList: [],
  feedbackTotal: 0,
  isFeedbackListLoading: false,
  feedbackListError: null,

  fetchDashboard: async () => {
    set({ isDashboardLoading: true, dashboardError: null })
    
    try {
      const { apiRequest } = await import('@/lib/api/client')
      const data = await apiRequest<AdminDashboardData>('/api/admin/dashboard')
      set({
        dashboard: data,
        isDashboardLoading: false,
        dashboardError: null,
      })
    } catch (err) {
      set({
        isDashboardLoading: false,
        dashboardError: err instanceof Error ? err.message : 'Failed to load admin dashboard',
      })
    }
  },

  fetchFeedbackSummary: async () => {
    set({ isFeedbackLoading: true, feedbackError: null })
    
    try {
      const { apiRequest } = await import('@/lib/api/client')
      const data = await apiRequest<FeedbackSummaryData>('/api/feedback/admin/summary')
      set({
        feedbackSummary: data,
        isFeedbackLoading: false,
        feedbackError: null,
      })
    } catch (err) {
      set({
        isFeedbackLoading: false,
        feedbackError: err instanceof Error ? err.message : 'Failed to load feedback summary',
      })
    }
  },

  fetchFeedbackList: async (limit = 20, offset = 0) => {
    set({ isFeedbackListLoading: true, feedbackListError: null })
    
    try {
      const { apiRequest } = await import('@/lib/api/client')
      const data = await apiRequest<FeedbackListResponse>(
        `/api/feedback/admin?limit=${limit}&offset=${offset}`
      )
      set({
        feedbackList: data.feedback,
        feedbackTotal: data.total,
        isFeedbackListLoading: false,
        feedbackListError: null,
      })
    } catch (err) {
      set({
        isFeedbackListLoading: false,
        feedbackListError: err instanceof Error ? err.message : 'Failed to load feedback list',
      })
    }
  },

  clearAdmin: () => {
    set({
      dashboard: null,
      dashboardError: null,
      feedbackSummary: null,
      feedbackError: null,
      feedbackList: [],
      feedbackTotal: 0,
      feedbackListError: null,
    })
  },
}))
