'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [user, loading, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="text-center">
        <h1 className="text-display-md text-text-primary-900 mb-lg">
          Neura
        </h1>
        <p className="text-md text-text-secondary-700">
          Loading...
        </p>
      </div>
    </div>
  )
}
