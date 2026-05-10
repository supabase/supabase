/* eslint-disable no-restricted-exports */
import type { GetServerSideProps } from 'next'

import { IS_PLATFORM } from '@/lib/constants'
import { getProjects } from '@/lib/api/self-hosted/projects'

/**
 * Root redirect page.
 *
 * - Platform mode: redirected to /org by next.config.ts before this runs.
 * - Self-hosted mode: reads the project registry (Node.js runtime — can read
 *   env vars and SUPABASE_PROJECTS_FILE) and redirects to the first project.
 *
 * This runs server-side so it has full access to all environment variables and
 * the filesystem, unlike Edge-runtime proxy.ts which only sees NEXT_PUBLIC_*
 * vars and has no filesystem access.
 */
export const getServerSideProps: GetServerSideProps = async () => {
  if (IS_PLATFORM) {
    // Should not reach here (next.config.ts redirects / → /org in platform
    // mode), but guard just in case.
    return { redirect: { destination: '/org', permanent: false } }
  }

  let firstRef = 'default'
  try {
    const projects = getProjects()
    if (projects.length > 0) {
      firstRef = projects[0].ref
    }
  } catch {
    // Registry failed to load — fall back to the legacy default ref.
  }

  return { redirect: { destination: `/project/${firstRef}`, permanent: false } }
}

// Next.js requires a default export even when getServerSideProps always redirects.
export default function IndexPage() {
  return null
}
