import { describe, expect, it, vi } from 'vitest'

import { IntegrationConnection } from './IntegrationPanels'
import type { IntegrationProjectConnection } from '@/data/integrations/integrations.types'
import { render } from '@/tests/helpers'

vi.mock('@/data/projects/project-detail-query', () => ({
  useProjectDetailQuery: () => ({ data: undefined, isPending: false }),
}))

const connectionWithFramework = (framework: string) =>
  ({
    id: 'connection-1',
    supabase_project_ref: 'project-ref',
    foreign_project_id: 'vercel-project-1',
    metadata: { id: 'vercel-project-1', name: 'my-app', framework },
  }) as IntegrationProjectConnection

const frameworkIconSelector = 'img[src*="/img/icons/frameworks/"]'

describe('IntegrationConnection', () => {
  it('renders the fallback badge for a framework without a shipped icon', () => {
    const { container } = render(
      <IntegrationConnection type="Vercel" connection={connectionWithFramework('express')} />
    )

    expect(container.querySelector(frameworkIconSelector)).toBeNull()
  })

  it('renders the framework icon for a framework with a shipped icon', () => {
    const { container } = render(
      <IntegrationConnection type="Vercel" connection={connectionWithFramework('nextjs')} />
    )

    expect(container.querySelector(frameworkIconSelector)?.getAttribute('src')).toMatch(
      /\/img\/icons\/frameworks\/nextjs\.svg$/
    )
  })
})
