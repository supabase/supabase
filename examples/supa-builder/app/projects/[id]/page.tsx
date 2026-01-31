/**
 * Project Detail Page
 *
 * Server component that displays detailed information about a single project.
 */

import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProject } from '@/app/actions/projects'

interface ProjectDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch project
  const result = await getProject(id)

  if (!result.success) {
    notFound()
  }

  const project = result.data!

  // Check if user is admin
  const { data: role } = await supabase.rpc('get_user_role', {
    p_user_id: user.id,
    p_organization_id: project.organization_id,
  })
  const isAdmin = role === 'admin'

  // Get audit logs (if admin or creator)
  const { data: auditLogs } = await supabase
    .from('project_audit_logs')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const getStatusBadge = (status: typeof project.status) => {
    const styles = {
      provisioning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      paused: 'bg-gray-100 text-gray-800 border-gray-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      deleted: 'bg-red-100 text-red-800 border-red-200',
    }

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium border ${
          styles[status] || styles.active
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/projects"
          className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
        >
          ← Back to Projects
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.project_name}</h1>
            <p className="text-gray-600">Project Reference: {project.project_ref}</p>
          </div>
          {getStatusBadge(project.status)}
        </div>
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Organization ID</dt>
              <dd className="text-sm text-gray-900">{project.organization_id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Region</dt>
              <dd className="text-sm text-gray-900">{project.region}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created By</dt>
              <dd className="text-sm text-gray-900">{project.creator_email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="text-sm text-gray-900">
                {new Date(project.created_at).toLocaleString()}
              </dd>
            </div>
            {project.purpose && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Purpose</dt>
                <dd className="text-sm text-gray-900">{project.purpose}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Credentials */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">API Credentials</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-1">
                Supabase URL
              </label>
              <code className="block text-xs bg-gray-100 px-3 py-2 rounded border border-gray-200 break-all">
                https://{project.project_ref}.supabase.co
              </code>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-1">
                Anon Key
              </label>
              <code className="block text-xs bg-gray-100 px-3 py-2 rounded border border-gray-200 break-all">
                {project.anon_key}
              </code>
            </div>
            {isAdmin && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
                <p className="text-xs text-yellow-800">
                  <strong>Admin Note:</strong> Service role key is encrypted in the database.
                  Contact system administrator for access.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Description</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.description}</p>
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href={`https://supabase.com/dashboard/project/${project.project_ref}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <span className="text-sm font-medium text-blue-600">Dashboard →</span>
          </a>
          <a
            href={`https://supabase.com/dashboard/project/${project.project_ref}/editor`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <span className="text-sm font-medium text-blue-600">Table Editor →</span>
          </a>
          <a
            href={`https://supabase.com/dashboard/project/${project.project_ref}/auth/users`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <span className="text-sm font-medium text-blue-600">Auth Users →</span>
          </a>
        </div>
      </div>

      {/* Audit Logs */}
      {auditLogs && auditLogs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm border-b border-gray-100 pb-3 last:border-0">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                  {log.action}
                </span>
                <div className="flex-1">
                  <p className="text-gray-900">
                    {log.actor_email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
