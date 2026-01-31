/**
 * Projects List Page
 *
 * Server component that displays all projects for the authenticated user.
 * Shows different views based on user role (admin vs builder).
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProjects } from '@/app/actions/projects'
import ProjectTable from '@/components/ProjectTable'

export default async function ProjectsPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch projects (respects RLS)
  const result = await getProjects()

  if (!result.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error loading projects</p>
          <p className="text-sm">{result.error}</p>
        </div>
      </div>
    )
  }

  const projects = result.data || []

  // Check if user is admin (simple check - look at first project's org)
  // In production, you might want to fetch this separately
  let isAdmin = false
  if (projects.length > 0) {
    const { data: role } = await supabase.rpc('get_user_role', {
      p_user_id: user.id,
      p_organization_id: projects[0].organization_id,
    })
    isAdmin = role === 'admin'
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="text-gray-600">
            Manage your Supabase projects
            {isAdmin && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">Admin</span>}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Create Project
        </Link>
      </div>

      {/* User Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-700">
          Logged in as: <strong>{user.email}</strong>
        </p>
      </div>

      {/* Projects Table */}
      <ProjectTable projects={projects} isAdmin={isAdmin} />

      {/* Footer Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">About SupaBuilder</h3>
        <p className="text-sm text-blue-800">
          SupaBuilder is an enterprise self-service platform for provisioning Supabase Pico projects.
          All projects are automatically created with the free (Pico) tier and can be managed through this interface.
        </p>
      </div>
    </div>
  )
}
