import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { getProjectHealthLints, HEALTH_LINT_NAMES } from './health-lints-query'
import type { components } from '@/data/api'
import { addAPIMock } from '@/tests/lib/msw'

type AdvisorsResponse = components['schemas']['V2ProjectAdvisorsResponse_Output']
type AdvisorsRequestBody = components['schemas']['V2RunProjectAdvisorsBody']
type AdvisorLint = AdvisorsResponse['data']['attributes']['lints'][number]

const createLint = (overrides: Partial<AdvisorLint> = {}): AdvisorLint =>
  ({
    cache_key: 'instance_db_down',
    name: 'instance_db_down',
    title: 'Database process is down',
    level: 'ERROR',
    facing: 'EXTERNAL',
    categories: ['HEALTH'],
    description: 'The instance is running but Postgres is not accepting connections locally.',
    detail: 'The on-host check of Postgres is failing.',
    remediation: 'https://supabase.com/docs/guides/platform/troubleshooting',
    metadata: { type: 'health', entity: 'Database' },
    ...overrides,
  }) as AdvisorLint

const mockAdvisorsRun = (lints: AdvisorLint[], onRequest?: (body: AdvisorsRequestBody) => void) => {
  addAPIMock({
    method: 'post',
    path: '/v2/projects/:ref/advisors/run',
    response: async ({ request }) => {
      onRequest?.((await request.json()) as AdvisorsRequestBody)
      return HttpResponse.json<AdvisorsResponse>({
        data: { type: 'project_advisors', attributes: { lints } },
      })
    },
  })
}

describe('getProjectHealthLints', () => {
  it('asks the endpoint for the health lints Studio surfaces', async () => {
    let requestBody: AdvisorsRequestBody | undefined
    mockAdvisorsRun([], (body) => {
      requestBody = body
    })

    await getProjectHealthLints({ projectRef: 'default' })

    expect(requestBody?.data.attributes.lints.map((lint) => lint.name)).toEqual([
      ...HEALTH_LINT_NAMES,
    ])
  })

  it('returns the health issues the project actually has', async () => {
    mockAdvisorsRun([createLint()])

    const result = await getProjectHealthLints({ projectRef: 'default' })

    expect(result.map((lint) => lint.name)).toEqual(['instance_db_down'])
  })

  it('drops results that report on the check rather than on the project', async () => {
    mockAdvisorsRun([
      createLint(),
      createLint({
        cache_key: 'advisor_check_unavailable:metrics_unavailable',
        name: 'advisor_check_unavailable',
        level: 'INFO',
      }),
      createLint({ cache_key: 'project_not_active', name: 'project_not_active' }),
    ])

    const result = await getProjectHealthLints({ projectRef: 'default' })

    expect(result.map((lint) => lint.name)).toEqual(['instance_db_down'])
  })

  it('throws when no project ref is given', async () => {
    await expect(getProjectHealthLints({})).rejects.toThrow('Project ref is required')
  })
})
