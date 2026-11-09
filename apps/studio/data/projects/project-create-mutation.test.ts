import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { createProject } from './project-create-mutation'
import { addAPIMock } from '@/tests/lib/msw'

const baseVariables = {
  name: 'test-project',
  organizationSlug: 'test-org',
  dbPass: 'secret-password',
  dbRegion: 'West US (North California)',
}

async function createProjectAndCaptureBody(variables: Parameters<typeof createProject>[0]) {
  let body: unknown
  addAPIMock({
    method: 'post',
    path: '/platform/projects',
    response: async ({ request }) => {
      body = await request.json()
      return HttpResponse.json(null)
    },
  })
  await createProject(variables)
  return body
}

describe('createProject', () => {
  it('sends GitHub connection fields when provided', async () => {
    const body = await createProjectAndCaptureBody({
      ...baseVariables,
      githubInstallationId: 1234,
      githubRepositoryId: 5678,
    })

    expect(body).toMatchObject({
      name: 'test-project',
      organization_slug: 'test-org',
      db_pass: 'secret-password',
      db_region: 'West US (North California)',
      github_installation_id: 1234,
      github_repository_id: 5678,
    })
  })

  it('does not send GitHub connection fields when omitted', async () => {
    const body = await createProjectAndCaptureBody(baseVariables)

    expect(body).not.toHaveProperty('github_installation_id')
    expect(body).not.toHaveProperty('github_repository_id')
  })
})
