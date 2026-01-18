'use client'

import { useToast } from '@/context/ToastContext'
import { useEffect } from 'react'

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 space-y-2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: { id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }; onClose: () => void }) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(onClose, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.duration, onClose])

  const styles = {
    success: 'bg-[#079455] text-white border-[#079455]',
    error: 'bg-[#d92d20] text-white border-[#d92d20]',
    info: 'bg-text-brand-tertiary-600 text-white border-text-brand-tertiary-600',
    warning: 'bg-[#f59e0b] text-white border-[#f59e0b]',
  }

  const icons = {
    success: (
      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  }

  return (
    <div
      className={`flex min-w-[280px] max-w-[90vw] items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all sm:min-w-[320px] ${styles[toast.type]}`}
      role="alert"
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm font-medium break-words">{toast.message}</p>
      <button
        onClick={onClose}
        className="shrink-0 rounded p-1 transition-colors hover:bg-black/10"
        aria-label="Close"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
