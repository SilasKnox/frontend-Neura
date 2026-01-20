'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Check admin access by making a test API call
  // Backend will return 403 if not admin
  useEffect(() => {
    if (user && isAuthorized === null) {
      checkAdminAccess()
    }
  }, [user, isAuthorized])

  const checkAdminAccess = async () => {
    try {
      const { apiRequest } = await import('@/lib/api/client')
      await apiRequest('/api/admin/dashboard')
      setIsAuthorized(true)
    } catch (err: unknown) {
      // Check if it's a 403 error
      if (err && typeof err === 'object' && 'status' in err && err.status === 403) {
        setIsAuthorized(false)
        router.push('/overview')
      } else {
        // Other errors (network, etc) - still try to show page
        setIsAuthorized(true)
      }
    }
  }

  if (loading || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="flex min-h-screen items-center justify-center">
          <div className="space-y-4 text-center">
            <Skeleton className="mx-auto h-12 w-48" />
            <Skeleton className="mx-auto h-4 w-32" />
          </div>
        </div>
      </div>
    )
  }

  if (!user || isAuthorized === false) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Admin Navigation Bar */}
      <nav className="border-b border-border-secondary bg-bg-primary">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="text-lg font-semibold text-text-primary-900">
                Neura Admin
              </Link>
            </div>
            <Link
              href="/overview"
              className="text-sm text-text-quaternary-500 hover:text-text-secondary-700 transition-colors"
            >
              Back to App
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
