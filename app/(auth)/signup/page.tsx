'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [organizationError, setOrganizationError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signUp, signInWithGoogle } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setEmailError(null)
    setPasswordError(null)
    setOrganizationError(null)

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      setEmailError('Please fill out this field.')
      return
    }
    if (!emailRegex.test(email)) {
      setEmailError('Must be a valid email address')
      return
    }
    if (!organizationName) {
      setOrganizationError('Please fill out this field.')
      return
    }
    if (!password) {
      setPasswordError('Please fill out this field.')
      return
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, organizationName)
    } catch (err: any) {
      setError(err.message || 'Failed to sign up')
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setEmailError(null)
    setPasswordError(null)
    setOrganizationError(null)
    setLoading(true)

    try {
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
      setLoading(false)
    }
  }

  const handleFacebookSignIn = async () => {
    setError(null)
    setEmailError(null)
    setPasswordError(null)
    setOrganizationError(null)
    setError('Facebook sign-in is not yet implemented')
  }

  const handleAppleSignIn = async () => {
    setError(null)
    setEmailError(null)
    setPasswordError(null)
    setOrganizationError(null)
    setError('Apple sign-in is not yet implemented')
  }

  return (
    // FIX 1: Removed 'items-center', added 'flex-col justify-center'
    <div className="flex min-h-screen w-full flex-col justify-center bg-bg-primary px-4 py-12">
      
      {/* FIX 2: Added 'mx-auto' and 'min-w-[320px]' */}
      <div className="mx-auto w-full max-w-lg min-w-[320px] space-y-6">
        
        {/* Neura Logo */}
        <div className="flex justify-center">
          <img
            src="/logo.svg"
            alt="Neura"
            width={38}
            height={38}
            className="flex-shrink-0"
          />
        </div>
        
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-display-md text-text-primary-900 font-bold">
            Create an account
          </h1>
          <p className="text-md text-text-secondary-700">
            Lorem ipsum dolor sit amet consectetur. Gravida varius fringilla dignissim sed auctor et malesuada ac.
          </p>
        </div>

        {/* General Error */}
        {error && (
          <div className="rounded-md bg-bg-error-secondary p-2 text-sm text-text-primary-900">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Organization Name Field */}
          <div className="space-y-1">
            <label htmlFor="organization" className="block text-sm font-medium text-text-primary-900">
              Organization Name
            </label>
            <input
              id="organization"
              type="text"
              required
              value={organizationName}
              onChange={(e) => {
                setOrganizationName(e.target.value)
                setOrganizationError(null)
              }}
              className={`w-full rounded-md border ${
                organizationError ? 'border-orange-500' : 'border-border-secondary'
              } bg-bg-primary px-2 py-1.5 text-sm text-text-primary-900 placeholder:text-text-quaternary-500 focus:border-fg-brand-primary-600 focus:outline-none focus:ring-1 focus:ring-fg-brand-primary-600`}
              placeholder="My Company"
            />
            {organizationError && (
              <div className="flex items-center gap-1 rounded-md bg-orange-100 px-2 py-1 text-sm text-orange-800">
                <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{organizationError}</span>
              </div>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-text-primary-900">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setEmailError(null)
              }}
              className={`w-full rounded-md border ${
                emailError ? 'border-red-500' : 'border-border-secondary'
              } bg-bg-primary px-3 py-2 text-sm text-text-primary-900 placeholder:text-text-quaternary-500 focus:border-fg-brand-primary-600 focus:outline-none focus:ring-1 focus:ring-fg-brand-primary-600`}
              placeholder="Enter your email"
            />
            {emailError && (
              <p className="text-sm text-red-500">
                {emailError}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-text-primary-900">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setPasswordError(null)
              }}
              className={`w-full rounded-md border ${
                passwordError ? 'border-orange-500' : 'border-border-secondary'
              } bg-bg-primary px-2 py-1.5 text-sm text-text-primary-900 placeholder:text-text-quaternary-500 focus:border-fg-brand-primary-600 focus:outline-none focus:ring-1 focus:ring-fg-brand-primary-600`}
              placeholder="••••••••"
            />
            {passwordError ? (
              <div className="flex items-center gap-1 rounded-md bg-orange-100 px-2 py-1 text-sm text-orange-800">
                <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{passwordError}</span>
              </div>
            ) : (
              <p className="text-xs text-text-quaternary-500">
                Must be at least 8 characters
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-bg-brand-solid px-3 py-2 text-sm font-bold text-text-white transition-colors hover:bg-fg-brand-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Get started'}
          </button>
        </form>

        {/* Separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-secondary"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-bg-primary px-2 text-text-quaternary-500">
              or
            </span>
          </div>
        </div>

        {/* Social Sign Up Buttons */}
        <div className="space-y-3">
          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full rounded-xl border border-border-secondary bg-bg-primary px-3 py-2 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <img
              src="/icons/google.svg"
              alt="Google"
              width={24}
              height={24}
              className="flex-shrink-0"
            />
            <span>Sign up with Google</span>
          </button>

          {/* Facebook Sign Up Button */}
          <button
            type="button"
            onClick={handleFacebookSignIn}
            disabled={loading}
            className="w-full rounded-xl border border-border-secondary bg-bg-primary px-3 py-2 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <img
              src="/icons/facebook.svg"
              alt="Facebook"
              width={24}
              height={24}
              className="flex-shrink-0"
            />
            <span>Sign up with Facebook</span>
          </button>

          {/* Apple Sign Up Button */}
          <button
            type="button"
            onClick={handleAppleSignIn}
            disabled={loading}
            className="w-full rounded-xl border border-border-secondary bg-bg-primary px-3 py-2 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <img
              src="/icons/apple.svg"
              alt="Apple"
              width={19}
              height={22}
              className="flex-shrink-0"
            />
            <span>Sign up with Apple</span>
          </button>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-sm text-text-quaternary-500">
          Already have an account?{' '}
          <Link href="/login" className="text-text-brand-tertiary-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}