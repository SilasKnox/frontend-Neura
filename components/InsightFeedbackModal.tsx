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
      <div className="relative z-10 w-[500px] max-w-[90vw] rounded-xl bg-bg-primary p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-text-quaternary-500 hover:text-text-primary-900 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon - Light green circle with teal thumbs icon (matching Figma) */}
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full mb-4 ${isPositive ? 'bg-[#D1FADF]' : 'bg-[#FEE4E2]'}`}>
          {isPositive ? (
            // Thumbs up - outlined style matching Figma
            <svg className="h-6 w-6 text-[#039855]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 22V11M2 13V20C2 21.1046 2.89543 22 4 22H17.4262C18.907 22 20.1662 20.9197 20.3914 19.4562L21.4683 12.4562C21.7479 10.6389 20.3418 9 18.5032 9H15C14.4477 9 14 8.55228 14 8V4.46584C14 3.10399 12.896 2 11.5342 2C11.2093 2 10.915 2.1913 10.7831 2.48812L7.26394 10.4061C7.10344 10.7673 6.74532 11 6.35013 11H4C2.89543 11 2 11.8954 2 13Z" />
            </svg>
          ) : (
            // Thumbs down - outlined style matching Figma
            <svg className="h-6 w-6 text-[#D92D20]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 2V13M22 11V4C22 2.89543 21.1046 2 20 2H6.57381C5.09304 2 3.83381 3.08034 3.60856 4.54379L2.53168 11.5438C2.25212 13.3611 3.65819 15 5.49681 15H9C9.55228 15 10 15.4477 10 16V19.5342C10 20.896 11.104 22 12.4658 22C12.7907 22 13.085 21.8087 13.2169 21.5119L16.7361 13.5939C16.8966 13.2327 17.2547 13 17.6499 13H20C21.1046 13 22 12.1046 22 11Z" />
            </svg>
          )}
        </div>

        {/* Header text */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text-primary-900 mb-1">
            Thanks for your feedback
          </h2>
          <p className="text-sm text-text-secondary-700">
            {isPositive
              ? 'We\'re glad this insight was helpful. Your feedback helps us improve.'
              : 'We\'re sorry this insight wasn\'t helpful. Your feedback helps us improve.'}
          </p>
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
            className="w-full min-h-[100px] rounded-lg border border-border-secondary bg-bg-primary px-3 py-2 text-sm text-text-primary-900 placeholder:text-text-quaternary-500 focus:border-brand-solid focus:outline-none focus:ring-1 focus:ring-brand-solid resize-y"
            rows={4}
          />
        </div>

        {/* Action Buttons - matching Figma layout */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-border-secondary bg-bg-primary px-4 py-2.5 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-brand-solid px-4 py-2.5 text-sm font-semibold text-text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
