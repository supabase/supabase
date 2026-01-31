'use server'

/**
 * SupaBuilder Server Actions
 *
 * Server-side actions for project management that bridge Next.js and
 * Supabase edge functions.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateProjectInput {
  project_name: string
  organization_id: string
  region: string
  purpose?: string
  description?: string
}

export interface Project {
  id: string
  project_ref: string
  project_name: string
  organization_id: string
  anon_key: string
  region: string
  status: 'provisioning' | 'active' | 'paused' | 'failed' | 'deleted'
  purpose?: string
  description?: string
  creator_id: string
  creator_email: string
  created_at: string
  updated_at: string
}

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================================
// CREATE PROJECT
// ============================================================================

export async function createProject(
  input: CreateProjectInput
): Promise<ActionResult<{ project_id: string; project_ref: string; anon_key: string }>> {
  try {
    const supabase = await createClient()

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return {
        success: false,
        error: 'You must be logged in to create a project',
      }
    }

    // Call edge function to create project
    const functionUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/create-project'

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to create project',
      }
    }

    // Revalidate projects page
    revalidatePath('/projects')

    return {
      success: true,
      data: {
        project_id: result.project_id,
        project_ref: result.project_ref,
        anon_key: result.anon_key,
      },
    }
  } catch (error) {
    console.error('Error creating project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// ============================================================================
// GET PROJECTS
// ============================================================================

export async function getProjects(): Promise<ActionResult<Project[]>> {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to view projects',
      }
    }

    // Fetch projects (RLS policies will filter based on user role)
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: projects as Project[],
    }
  } catch (error) {
    console.error('Error fetching projects:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// ============================================================================
// GET SINGLE PROJECT
// ============================================================================

export async function getProject(projectId: string): Promise<ActionResult<Project>> {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to view this project',
      }
    }

    // Fetch project (RLS will enforce access control)
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    if (!project) {
      return {
        success: false,
        error: 'Project not found',
      }
    }

    return {
      success: true,
      data: project as Project,
    }
  } catch (error) {
    console.error('Error fetching project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// ============================================================================
// PAUSE PROJECT (Admin only)
// ============================================================================

export async function pauseProject(projectId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to pause projects',
      }
    }

    // Update project status using helper function
    const { error } = await supabase.rpc('update_project_status', {
      p_project_id: projectId,
      p_new_status: 'paused',
      p_actor_id: user.id,
      p_actor_email: user.email!,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate projects pages
    revalidatePath('/projects')
    revalidatePath(`/projects/${projectId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error pausing project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// ============================================================================
// RESUME PROJECT (Admin only)
// ============================================================================

export async function resumeProject(projectId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to resume projects',
      }
    }

    // Update project status using helper function
    const { error } = await supabase.rpc('update_project_status', {
      p_project_id: projectId,
      p_new_status: 'active',
      p_actor_id: user.id,
      p_actor_email: user.email!,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate projects pages
    revalidatePath('/projects')
    revalidatePath(`/projects/${projectId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error resuming project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// ============================================================================
// DELETE PROJECT (Admin only, soft delete)
// ============================================================================

export async function deleteProject(projectId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to delete projects',
      }
    }

    // Soft delete using helper function
    const { error } = await supabase.rpc('soft_delete_project', {
      p_project_id: projectId,
      p_actor_id: user.id,
      p_actor_email: user.email!,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate projects page
    revalidatePath('/projects')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error deleting project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// ============================================================================
// GET USER ROLE
// ============================================================================

export async function getUserRole(organizationId: string): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in',
      }
    }

    // Get user role
    const { data: role, error } = await supabase.rpc('get_user_role', {
      p_user_id: user.id,
      p_organization_id: organizationId,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: role || 'builder',
    }
  } catch (error) {
    console.error('Error getting user role:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
