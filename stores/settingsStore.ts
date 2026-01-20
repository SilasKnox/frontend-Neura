import { create } from 'zustand'

interface XeroIntegration {
  is_connected: boolean
  status: string
  connected_at: string | null
  last_synced_at: string | null
  needs_reconnect: boolean
  xero_org_name: string | null
}

interface SettingsData {
  email: string
  organization_name: string
  xero_integration: XeroIntegration
  last_sync_time: string | null
  support_link: string | null
}

interface SettingsStore {
  settings: SettingsData | null
  isLoading: boolean
  lastFetched: number | null
  error: string | null
  
  // Actions
  fetchSettings: () => Promise<void>
  getXeroConnected: () => boolean
  updateSettings: (settings: SettingsData) => void
  updateOrgName: (name: string) => Promise<boolean>
  clearSettings: () => void
}

const CACHE_TTL = 20 * 60 * 1000 // 20 minutes

// Store pending promise for request deduplication
let pendingFetchPromise: Promise<void> | null = null

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  isLoading: false,
  lastFetched: null,
  error: null,

  fetchSettings: async () => {
    const state = get()
    
    // Return cached data if still valid
    if (state.settings && state.lastFetched) {
      const age = Date.now() - state.lastFetched
      if (age < CACHE_TTL) {
        return // Use cached data
      }
    }

    // If a fetch is already in progress, return the existing promise (deduplication)
    if (pendingFetchPromise) {
      return pendingFetchPromise
    }

    set({ isLoading: true, error: null })

    const fetchTask = async () => {
      try {
        const { apiRequest } = await import('@/lib/api/client')
        const data = await apiRequest<SettingsData>('/settings/')
        set({
          settings: data,
          isLoading: false,
          lastFetched: Date.now(),
          error: null,
        })
      } catch (err) {
        set({
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load settings',
        })
      } finally {
        pendingFetchPromise = null
      }
    }

    pendingFetchPromise = fetchTask()
    return pendingFetchPromise
  },

  getXeroConnected: () => {
    const state = get()
    return state.settings?.xero_integration?.is_connected ?? false
  },

  updateSettings: (settings: SettingsData) => {
    set({
      settings,
      lastFetched: Date.now(),
      error: null,
    })
  },

  updateOrgName: async (name: string) => {
    try {
      const { apiRequest } = await import('@/lib/api/client')
      const data = await apiRequest<SettingsData>('/settings/organization', {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      })
      set({ settings: data, lastFetched: Date.now() })
      return true
    } catch {
      return false
    }
  },

  clearSettings: () => {
    set({
      settings: null,
      lastFetched: null,
      error: null,
    })
  },
}))
