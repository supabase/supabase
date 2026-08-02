/**
 * Validates that the requested project ref is authorized for the self-hosted environment.
 * In a standard self-hosted Supabase deployment, the project ref is typically 'default'.
 */
export function validateProjectRef(ref: string | string[] | undefined): string | null {
  if (!ref) {
    return 'Project reference is required'
  }
  const projectRef = Array.isArray(ref) ? ref[0] : ref

  if (projectRef !== 'default') {
    return 'Invalid project reference for self-hosted environment'
  }

  return null
}
