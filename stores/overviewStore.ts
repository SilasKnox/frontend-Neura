import { create } from 'zustand'

interface CashRunwayMetrics {
  current_cash: number
  monthly_burn_rate: number
  runway_months: number | null
  status: string
  confidence_level?: string
}

interface CashPressureMetrics {
  status: string
  confidence: string
}

interface ProfitabilityMetrics {
  revenue?: number
  gross_margin_pct?: number
  net_profit?: number
  risk_level: string
}

export interface Insight {
  insight_id: string
  insight_type: string
  title: string
  severity: string
  confidence_level: string
  summary: string
  why_it_matters: string
  recommended_actions: string[]
  supporting_numbers: Array<{ label: string; value: string | number }>
  data_notes?: string
  generated_at: string
  is_acknowledged: boolean
  is_marked_done: boolean
}

interface UpcomingCommitmentsMetrics {
  upcoming_amount: number
  upcoming_count: number
  days_ahead: number
  large_upcoming_bills: Array<{ label: string; amount: number; due_date: string }>
  squeeze_risk: string
}

export interface OverviewData {
  cash_runway: CashRunwayMetrics | null
  cash_pressure: CashPressureMetrics | null
  profitability: ProfitabilityMetrics | null
  upcoming_commitments: UpcomingCommitmentsMetrics | null
  insights: Insight[]
  calculated_at: string | null
}

interface OverviewStore {
  data: OverviewData | null
  isLoading: boolean
  lastFetched: number | null
  error: string | null
  
  // Actions
  fetchOverview: (forceRefresh?: boolean) => Promise<void>
  updateOverview: (data: OverviewData) => void
  clearOverview: () => void
}

export const useOverviewStore = create<OverviewStore>((set, get) => ({
  data: null,
  isLoading: false,
  lastFetched: null,
  error: null,

  fetchOverview: async (forceRefresh = false) => {
    const state = get()
    
    // Return cached data if still valid and not forcing refresh
    if (!forceRefresh && state.data && state.lastFetched) {
      // Cache persists until page refresh (no TTL)
      return // Use cached data
    }

    // Don't fetch if already loading
    if (state.isLoading) {
      return
    }

    set({ isLoading: true, error: null })

    try {
      const { apiRequest } = await import('@/lib/api/client')
      const data = await apiRequest<OverviewData>('/api/insights/')
      set({
        data,
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      })
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Failed to load overview data',
      })
    }
  },

  updateOverview: (data: OverviewData) => {
    set({
      data,
      lastFetched: Date.now(),
      error: null,
    })
  },

  clearOverview: () => {
    set({
      data: null,
      lastFetched: null,
      error: null,
    })
  },
}))
