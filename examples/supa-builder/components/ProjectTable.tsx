'use client'

/**
 * ProjectTable Component
 *
 * Displays a table of projects with admin actions (pause, resume, delete).
 * Includes loading states and error handling.
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  pauseProject,
  resumeProject,
  deleteProject,
  type Project,
} from '@/app/actions/projects'

interface ProjectTableProps {
  projects: Project[]
  isAdmin: boolean
}

export default function ProjectTable({ projects, isAdmin }: ProjectTableProps) {
  const router = useRouter()
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePause = async (projectId: string) => {
    if (!confirm('Are you sure you want to pause this project?')) {
      return
    }

    setLoadingAction(projectId)
    setError(null)

    const result = await pauseProject(projectId)

    if (!result.success) {
      setError(result.error || 'Failed to pause project')
    } else {
      router.refresh()
    }

    setLoadingAction(null)
  }

  const handleResume = async (projectId: string) => {
    setLoadingAction(projectId)
    setError(null)

    const result = await resumeProject(projectId)

    if (!result.success) {
      setError(result.error || 'Failed to resume project')
    } else {
      router.refresh()
    }

    setLoadingAction(null)
  }

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    setLoadingAction(projectId)
    setError(null)

    const result = await deleteProject(projectId)

    if (!result.success) {
      setError(result.error || 'Failed to delete project')
    } else {
      router.refresh()
    }

    setLoadingAction(null)
  }

  const getStatusBadge = (status: Project['status']) => {
    const styles = {
      provisioning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      paused: 'bg-gray-100 text-gray-800 border-gray-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      deleted: 'bg-red-100 text-red-800 border-red-200',
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          styles[status] || styles.active
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 mb-4">No projects found</p>
        <Link
          href="/projects/new"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Create Your First Project
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Region
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Creator
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {project.project_name}
                  </Link>
                  {project.purpose && (
                    <p className="text-xs text-gray-500 mt-1">{project.purpose}</p>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {project.project_ref}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {project.region}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(project.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {project.creator_email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(project.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View
                  </Link>

                  {isAdmin && (
                    <>
                      {project.status === 'active' && (
                        <button
                          onClick={() => handlePause(project.id)}
                          disabled={loadingAction === project.id}
                          className="text-yellow-600 hover:text-yellow-800 disabled:text-gray-400"
                        >
                          {loadingAction === project.id ? 'Loading...' : 'Pause'}
                        </button>
                      )}

                      {project.status === 'paused' && (
                        <button
                          onClick={() => handleResume(project.id)}
                          disabled={loadingAction === project.id}
                          className="text-green-600 hover:text-green-800 disabled:text-gray-400"
                        >
                          {loadingAction === project.id ? 'Loading...' : 'Resume'}
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(project.id)}
                        disabled={loadingAction === project.id}
                        className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                      >
                        {loadingAction === project.id ? 'Loading...' : 'Delete'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="text-xs text-gray-500 mt-4">
        <p>
          <strong>Note:</strong> {isAdmin ? 'As an admin, you can pause, resume, and delete projects.' : 'Contact an admin to pause, resume, or delete projects.'}
        </p>
      </div>
    </div>
  )
}
