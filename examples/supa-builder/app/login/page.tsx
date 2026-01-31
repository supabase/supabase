/**
 * Login Page
 *
 * Handles SSO authentication via Supabase Auth.
 * Supports Google OAuth and other configured providers.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginButton from '@/components/LoginButton'

export default async function LoginPage() {
  const supabase = await createClient()

  // Check if user is already authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If already logged in, redirect to projects
  if (user) {
    redirect('/projects')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            SupaBuilder
          </h1>
          <p className="text-gray-600">
            Sign in to manage your Supabase projects
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Sign In
          </h2>

          {/* SSO Login Buttons */}
          <div className="space-y-4">
            <LoginButton provider="google" />

            {/* Add more providers as needed */}
            {/* <LoginButton provider="azure" /> */}
            {/* <LoginButton provider="github" /> */}
          </div>

          {/* Info Text */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Sign in with your organization account</p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 text-center">
            <strong>First-time users:</strong> The first person to sign in from your organization will automatically receive admin privileges.
          </p>
        </div>
      </div>
    </div>
  )
}
