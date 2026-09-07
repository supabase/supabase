/**
 * Studio root index page — /
 *
 * Platform mode:   redirect to /projects (unchanged behaviour)
 * Self-hosted mode (single project):   redirect to /project/default/editor
 * Self-hosted mode (multi-database):   redirect to /self-hosted-projects
 *
 * The multi-database detection is done server-side so the user sees no flash.
 * It calls the same registry API that useSelfHostedProjects() calls on the client.
 */
import type { GetServerSideProps } from 'next'

// This page never renders — it always redirects
export default function Index() {
  return null
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const IS_PLATFORM = process.env.NEXT_PUBLIC_IS_PLATFORM === 'true'

  // --- Platform mode: unchanged ---
  if (IS_PLATFORM) {
    return {
      redirect: { destination: '/projects', permanent: false },
    }
  }

  // --- Self-hosted mode: check registry project count ---
  try {
    // Build an absolute URL for server-side fetch.
    // STUDIO_DEFAULT_PROJECT_REF can be set to override the single-project default.
    const defaultRef = process.env.STUDIO_DEFAULT_PROJECT_REF ?? 'default'

    const registryUrl = process.env.REGISTRY_API_URL
    if (registryUrl) {
      const res = await fetch(`${registryUrl}/projects`, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000),
      })
      if (res.ok) {
        const projects: Array<{ ref: string }> = await res.json()
        if (projects.length > 1) {
          return {
            redirect: { destination: '/self-hosted-projects', permanent: false },
          }
        }
        if (projects.length === 1) {
          return {
            redirect: {
              destination: `/project/${projects[0].ref}/editor`,
              permanent: false,
            },
          }
        }
      }
    }
  } catch {
    // Registry unreachable — fall through to default single-project redirect
  }

  return {
    redirect: {
      destination: `/project/${process.env.STUDIO_DEFAULT_PROJECT_REF ?? 'default'}/editor`,
      permanent: false,
    },
  }
}