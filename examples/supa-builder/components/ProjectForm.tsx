'use client'

/**
 * ProjectForm Component
 *
 * Client component for creating new Supabase projects.
 * Handles form validation, submission, and loading states.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProject, type CreateProjectInput } from '@/app/actions/projects'

const REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU West (Ireland)' },
  { value: 'eu-west-2', label: 'EU West (London)' },
  { value: 'eu-central-1', label: 'EU Central (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'sa-east-1', label: 'South America (São Paulo)' },
]

interface ProjectFormProps {
  defaultOrganizationId?: string
  defaultRegion?: string
}

export default function ProjectForm({ defaultOrganizationId, defaultRegion }: ProjectFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateProjectInput>({
    project_name: '',
    organization_id: defaultOrganizationId || '',
    region: defaultRegion || 'us-east-1',
    purpose: '',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Client-side validation
      if (formData.project_name.length < 3) {
        setError('Project name must be at least 3 characters')
        setIsSubmitting(false)
        return
      }

      if (!formData.organization_id) {
        setError('Organization ID is required')
        setIsSubmitting(false)
        return
      }

      // Call server action
      const result = await createProject(formData)

      if (!result.success) {
        setError(result.error || 'Failed to create project')
        setIsSubmitting(false)
        return
      }

      // Success - redirect to projects list
      router.push('/projects')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Project Name */}
      <div>
        <label htmlFor="project_name" className="block text-sm font-medium mb-2">
          Project Name *
        </label>
        <input
          type="text"
          id="project_name"
          name="project_name"
          value={formData.project_name}
          onChange={handleInputChange}
          required
          minLength={3}
          maxLength={63}
          placeholder="my-awesome-project"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500 mt-1">
          3-63 characters, lowercase letters, numbers, and hyphens
        </p>
      </div>

      {/* Hidden fields - automatically set */}
      <input type="hidden" name="organization_id" value={formData.organization_id} />
      <input type="hidden" name="region" value={formData.region} />

      {/* Purpose */}
      <div>
        <label htmlFor="purpose" className="block text-sm font-medium mb-2">
          Purpose
        </label>
        <input
          type="text"
          id="purpose"
          name="purpose"
          value={formData.purpose}
          onChange={handleInputChange}
          placeholder="Development, Staging, Production, etc."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500 mt-1">
          Optional: What will this project be used for?
        </p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          placeholder="Describe your project..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500 mt-1">
          Optional: Additional details about this project
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {isSubmitting ? 'Creating Project...' : 'Create Project'}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
        >
          Cancel
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Projects are provisioned as Pico (free) tier.
        </p>
      </div>
    </form>
  )
}
