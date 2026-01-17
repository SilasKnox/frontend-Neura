'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/lib/api/client'

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

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiRequest<SettingsData>('/settings')
        setSettings(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchSettings()
    }
  }, [user])

  const handleDisconnect = async () => {
    try {
      await apiRequest('/integrations/xero/disconnect', {
        method: 'POST',
      })
      // Refresh settings after disconnect
      const data = await apiRequest<SettingsData>('/settings')
      setSettings(data)
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect Xero')
    }
  }

  const handleReconnect = async () => {
    try {
      // Fetch the authorization URL from backend
      const response = await apiRequest<{ authorization_url: string; state: string }>('/integrations/xero/connect')
      // Redirect to Xero authorization page
      window.location.href = response.authorization_url
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Xero')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (dateOnly.getTime() === today.getTime()) {
      // Today - show time
      return `Today at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase()}`
    } else {
      // Other date - show full date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-md text-text-secondary-700">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null // Middleware will redirect
  }

  const xeroIntegration = settings?.xero_integration
  const lastSyncedAt = xeroIntegration?.last_synced_at || settings?.last_sync_time

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-6">
        {/* Back to overview */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-text-quaternary-500 hover:text-text-primary-900 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to overview
        </Link>

        {/* Settings Title */}
        <h1 className="mb-8 text-display-md text-text-primary-900 font-bold">
          Settings
        </h1>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-bg-error-secondary p-3 text-sm text-text-primary-900">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* 5.2 ACCOUNT Section */}
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
              ACCOUNT
            </h2>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <label htmlFor="email" className="text-sm font-medium text-text-primary-900 md:min-w-[80px]">
                Email
              </label>
              <div className="relative flex-1 md:max-w-[400px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg
                    className="h-4 w-4 text-text-quaternary-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={settings?.email || user.email || ''}
                  readOnly
                  className="w-full rounded-md border border-border-secondary bg-bg-primary pl-9 pr-3 py-2 text-sm text-text-quaternary-500"
                />
              </div>
            </div>
          </section>

          {/* 5.3 INTEGRATION Section */}
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
              INTEGRATION
            </h2>
            <div className="space-y-3">
              {/* Xero Integration Card */}
              <div className="flex flex-col gap-4 rounded-md border border-border-secondary bg-bg-primary p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  {/* Xero Logo - Blue circle with white text */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#13B5E3] text-[10px] font-semibold leading-none text-white">
                    xero
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary-900">Xero</span>
                    {xeroIntegration?.is_connected && (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#079455]"></span>
                        <span className="text-sm text-[#079455]">Connected</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 md:ml-auto">
                  {xeroIntegration?.is_connected ? (
                    <>
                      <button
                        onClick={handleReconnect}
                        className="text-sm font-medium text-text-brand-tertiary-600 hover:underline whitespace-nowrap"
                      >
                        Reconnect
                      </button>
                      <button
                        onClick={handleDisconnect}
                        className="whitespace-nowrap rounded-md border border-border-secondary bg-bg-primary px-3 py-1.5 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleReconnect}
                      className="whitespace-nowrap rounded-md border border-border-secondary bg-bg-primary px-3 py-1.5 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Last Synced Info - Two lines as per design */}
              {xeroIntegration?.is_connected && lastSyncedAt && (
                <div className="flex flex-col gap-0 md:flex-row md:items-center md:justify-end md:gap-4">
                  <div className="text-sm text-text-quaternary-500">
                    Last synced
                  </div>
                  <div className="text-sm text-[#079455] md:text-right">
                    {formatDate(lastSyncedAt)}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 5.6 SUPPORT Section */}
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
              SUPPORT
            </h2>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <span className="text-sm text-text-primary-900">Help & support</span>
              <a
                href={settings?.support_link || 'mailto:support@getneura.co'}
                className="flex items-center gap-2 text-sm font-medium text-text-brand-tertiary-600 hover:underline md:ml-auto"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Contact us
              </a>
            </div>
          </section>

          {/* 5.7 Log Out Button */}
          <section>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 rounded-md bg-[#d92d20] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#b91c1c]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span>Log out</span>
            </button>
          </section>
        </div>

        {/* Bottom Status Bar */}
        {xeroIntegration?.is_connected && (
          <div className="mt-8 border-t border-border-secondary pt-4">
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#079455]"></span>
              <span className="text-[#079455]">Connected to Xero</span>
              <span className="text-text-primary-900">•</span>
              <span className="text-text-primary-900">Read-only</span>
              {lastSyncedAt && (
                <>
                  <span className="text-text-primary-900">•</span>
                  <span className="text-text-primary-900">Synced {formatDate(lastSyncedAt)}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
