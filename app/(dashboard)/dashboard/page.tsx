'use client'

import { useAuth } from '@/context/AuthContext'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4 py-12">
      <div className="mx-auto w-full max-w-lg space-y-6 text-center">
        <div>
          <h1 className="text-display-md text-text-primary-900 font-bold mb-2">
            Dashboard
          </h1>
          <p className="text-md text-text-secondary-700">
            Welcome, {user.email}
          </p>
        </div>

        <button
          onClick={() => signOut()}
          className="w-full rounded-xl bg-bg-brand-solid px-3 py-2 text-sm font-bold text-text-white transition-colors hover:bg-fg-brand-primary-600"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
