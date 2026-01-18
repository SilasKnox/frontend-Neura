'use client'

import { useState } from 'react'

interface InsightFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (feedback: string) => Promise<void>
  isPositive: boolean // true for thumbs up, false for thumbs down
}

export default function InsightFeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  isPositive,
}: InsightFeedbackModalProps) {
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit(feedback)
      setFeedback('')
      // Parent will close modal after showing toast
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirm = () => {
    // Just close without submitting if user clicks Confirm
    setFeedback('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-[500px] max-w-[90vw] rounded-lg bg-bg-secondary-subtle dark:bg-bg-secondary p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-text-quaternary-500 hover:text-text-primary-900 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isPositive ? 'bg-[#079455]' : 'bg-[#d92d20]'}`}>
            {isPositive ? (
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v5m7 0l-5 5m5-5l-5-5" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .966-.18 1.32-.51l3.76-3.76c.19-.19.3-.45.3-.71V14a2 2 0 00-2-2h-5m-5 0V5a2 2 0 012-2h4a2 2 0 012 2v5m-5 0l5 5m-5-5l5-5" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-text-primary-900 mb-1">
              Thanks for your feedback
            </h2>
            <p className="text-sm text-text-secondary-700">
              {isPositive
                ? 'We\'re glad this insight was helpful. Your feedback helps us improve.'
                : 'We\'re sorry this insight wasn\'t helpful. Your feedback helps us improve.'}
            </p>
          </div>
        </div>

        {/* Feedback Input */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-text-primary-900">
            Tell us more
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={isPositive ? 'What made this insight helpful?' : 'What could we improve?'}
            className="w-full min-h-[100px] rounded-md border border-border-secondary bg-bg-primary px-3 py-2 text-sm text-text-primary-900 placeholder:text-text-quaternary-500 focus:border-text-brand-tertiary-600 focus:outline-none focus:ring-1 focus:ring-text-brand-tertiary-600 resize-y"
            rows={4}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 rounded-md border border-border-secondary bg-bg-primary px-4 py-2.5 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 rounded-md bg-text-brand-tertiary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-text-brand-tertiary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Submitting...</span>
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
