'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const router = useRouter()

  const handleSettingsClick = () => {
    router.push('/settings')
  }

  const handleProfileClick = () => {
    // Profile menu could be added here
    router.push('/settings')
  }

  return (
    <nav className="w-full border-b border-border-secondary bg-bg-primary">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-4 md:px-8 md:py-4">
        {/* Left Side - Logo */}
        <Link href="/dashboard" className="flex items-center gap-[12px]">
          <img
            src="/logo.svg"
            alt="Neura"
            width={38}
            height={38}
            className="flex-shrink-0"
          />
          <span className="text-display-xs text-text-primary-900 font-bold">
            Neura
          </span>
        </Link>

        {/* Right Side - Icons */}
        <div className="flex items-center gap-[16px]">
          {/* Dark/Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-[40px] w-[40px] items-center justify-center rounded-md text-text-primary-900 transition-colors hover:bg-bg-secondary"
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            )}
          </button>

          {/* Settings Icon */}
          <button
            onClick={handleSettingsClick}
            className="flex h-[40px] w-[40px] items-center justify-center rounded-md text-text-primary-900 transition-colors hover:bg-bg-secondary"
            aria-label="Settings"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* User Profile Icon */}
          <button
            onClick={handleProfileClick}
            className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-border-secondary bg-bg-primary text-text-primary-900 transition-colors hover:bg-bg-secondary"
            aria-label="User profile"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}
