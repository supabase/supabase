import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If logged in, redirect to projects dashboard
  if (user) {
    redirect('/projects')
  }

  // Show landing page for non-authenticated users
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-50 to-white">
      <main className="flex flex-col items-center gap-8 max-w-4xl text-center">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SupaBuilder
          </h1>
          <p className="text-2xl text-gray-600">
            Enterprise Self-Service Supabase Project Provisioning
          </p>
          <p className="text-lg text-gray-500 max-w-2xl">
            Empower your team to create and manage Supabase projects with proper governance,
            audit trails, and role-based access control.
          </p>
        </div>

        {/* CTA Button */}
        <div className="flex gap-4 mt-8">
          <Link
            href="/login"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Sign In to Get Started
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12">
          <div className="p-6 border border-gray-200 rounded-lg bg-white">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="font-semibold text-lg mb-2">Self-Service</h3>
            <p className="text-sm text-gray-600">
              Builders can create projects instantly without waiting for IT approval
            </p>
          </div>

          <div className="p-6 border border-gray-200 rounded-lg bg-white">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-semibold text-lg mb-2">Secure by Default</h3>
            <p className="text-sm text-gray-600">
              Role-based access, encrypted credentials, and complete audit trails
            </p>
          </div>

          <div className="p-6 border border-gray-200 rounded-lg bg-white">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-lg mb-2">Rate Limited</h3>
            <p className="text-sm text-gray-600">
              Built-in protections prevent abuse with 5 projects per hour limit
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="w-full max-w-2xl mt-8 p-8 border border-gray-200 rounded-lg bg-white text-left">
          <h2 className="text-2xl font-semibold mb-4 text-center">Key Features</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-1">✓</span>
              <span className="text-gray-700">
                <strong>SSO Authentication:</strong> Seamless sign-in with Google, Azure AD, or any OAuth provider
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-1">✓</span>
              <span className="text-gray-700">
                <strong>Role-Based Access:</strong> Admins manage all projects, builders manage their own
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-1">✓</span>
              <span className="text-gray-700">
                <strong>Automatic Provisioning:</strong> Projects created in 1-2 minutes via Management API
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-1">✓</span>
              <span className="text-gray-700">
                <strong>Audit Logging:</strong> Complete immutable history of all project operations
              </span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-12 text-sm text-gray-500">
          <p>Built with Supabase • Next.js • TypeScript</p>
        </div>
      </main>
    </div>
  )
}
