import { create } from 'zustand'
import { Insight } from '@/stores/overviewStore'

interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
}

interface InsightsResponse {
  insights: Insight[]
  pagination: Pagination
  calculated_at: string | null
}

interface InsightsStore {
  insights: Insight[]
  pagination: Pagination
  isLoading: boolean
  error: string | null
  
  fetchInsights: () => Promise<void>
  refetchInsights: () => Promise<void>
  clearInsights: () => void
}

export const useInsightsStore = create<InsightsStore>((set, get) => ({
  insights: [],
  pagination: { total: 0, page: 1, limit: 20, total_pages: 0 },
  isLoading: false,
  error: null,

  fetchInsights: async () => {
    // If already have data, don't refetch
    if (get().insights.length > 0) return
    
    set({ isLoading: true, error: null })
    try {
      const { apiRequest } = await import('@/lib/api/client')
      const response = await apiRequest<InsightsResponse>('/api/insights/')
      set({ 
        insights: response.insights, 
        pagination: response.pagination,
        isLoading: false 
      })
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Failed to load insights', 
        isLoading: false 
      })
    }
  },

  refetchInsights: async () => {
    set({ isLoading: true, error: null })
    try {
      const { apiRequest } = await import('@/lib/api/client')
      const response = await apiRequest<InsightsResponse>('/api/insights/')
      set({ 
        insights: response.insights, 
        pagination: response.pagination,
        isLoading: false 
      })
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Failed to load insights', 
        isLoading: false 
      })
    }
  },

  clearInsights: () => set({ 
    insights: [], 
    pagination: { total: 0, page: 1, limit: 20, total_pages: 0 } 
  }),
}))
