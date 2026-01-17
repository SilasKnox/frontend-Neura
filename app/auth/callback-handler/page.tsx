'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { apiRequest } from '@/lib/api/client'

export default function CallbackHandler() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        router.push('/login?error=auth_failed')
        return
      }

      // Sync to server cookies
      await fetch('/auth/sync-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }),
      }).catch(() => {})

      // Sync to backend
      await apiRequest('/auth/me').catch(() => {})

      router.push('/dashboard')
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-md text-text-secondary-700">Completing sign in...</p>
    </div>
  )
}
