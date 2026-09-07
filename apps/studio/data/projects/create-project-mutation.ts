import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface CreateProjectParams {
  name: string
  ref?: string
  password?: string
}

export interface CreatedProject {
  ref: string
  name: string
  host: string
  port: number
  database: string
  status: string
  created_at: string
  credentials: {
    password: string
    jwt_secret: string
    password_env: string
    jwt_secret_env: string
  }
  env_vars: string[]
  next_steps: string[]
  generator_errors?: string[]
}

export async function createProject(params: CreateProjectParams): Promise<CreatedProject> {
  const response = await fetch('/api/platform/projects/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error ?? `Failed to create project (${response.status})`)
  }

  return data
}

export function useCreateProject({
  onSuccess,
}: {
  onSuccess?: (data: CreatedProject) => void
} = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProject,
    onSuccess: (data) => {
      // Invalidate the projects list so the new project appears immediately
      queryClient.invalidateQueries({ queryKey: ['self-hosted-projects'] })
      onSuccess?.(data)
    },
    onError: (error: Error) => {
      toast.error('Failed to create project', { description: error.message })
    },
  })
}

export async function deleteProject(ref: string): Promise<{ deleted: boolean; message: string }> {
  const response = await fetch(`/api/platform/projects/${ref}/delete`, {
    method: 'DELETE',
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error ?? `Failed to delete project (${response.status})`)
  }

  return data
}

export function useDeleteProject({
  onSuccess,
}: {
  onSuccess?: (ref: string) => void
} = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (data, ref) => {
      queryClient.invalidateQueries({ queryKey: ['self-hosted-projects'] })
      toast.success(`Project deleted`, { description: data.message })
      onSuccess?.(ref)
    },
    onError: (error: Error) => {
      toast.error('Failed to delete project', { description: error.message })
    },
  })
}