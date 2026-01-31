/**
 * Create New Project Page
 *
 * Server component that displays the project creation form.
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProjectForm from '@/components/ProjectForm'

export default async function NewProjectPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Get user's organization from user_roles
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!userRole) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">No organization assigned</p>
          <p className="text-sm">Please contact an administrator to assign you to an organization.</p>
        </div>
      </div>
    )
  }

  // Get admin project region from env or default
  const adminProjectRegion = process.env.ADMIN_PROJECT_REGION || 'us-east-1'

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/projects"
          className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
        >
          ← Back to Projects
        </Link>
        <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
        <p className="text-gray-600">
          Create a new Supabase Pico project for your organization
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">What you need to know</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Projects are created on the Pico (free) tier</li>
          <li>• Project provisioning typically completes in 1-2 minutes</li>
          <li>• All projects include PostgreSQL database, Auth, Storage, and Realtime</li>
          <li>• Projects will be created in the {adminProjectRegion} region</li>
        </ul>
      </div>

      {/* Form */}
      <ProjectForm
        defaultOrganizationId={userRole.organization_id}
        defaultRegion={adminProjectRegion}
      />
    </div>
  )
}
