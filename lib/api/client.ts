/**
 * Centralized API Client
 * Handles all backend API calls with proper authentication
 */

import { supabase } from '@/lib/supabase/client'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Client-side API request (automatically includes Supabase token)
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      const { data } = await supabase.auth.refreshSession()
      if (data.session) {
        return apiRequest<T>(endpoint, options)
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new APIError('Unauthorized', 401, 'Unauthorized')
    }

    const errorText = await response.text().catch(() => response.statusText)
    throw new APIError(
      errorText || `API request failed`,
      response.status,
      response.statusText
    )
  }

  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T
  }

  return response.json()
}

/**
 * Server-side API request (requires explicit token)
 */
export async function apiRequestWithToken<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new APIError(
      errorText || `API request failed`,
      response.status,
      response.statusText
    )
  }

  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T
  }

  return response.json()
}
