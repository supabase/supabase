import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { submitOnboardingSurvey } from './onboarding-survey-mutation'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type OnboardingSurveyBody = components['schemas']['OnboardingSurveyBody']

const mockSurveyEndpoint = (status: 204 | 500 = 204) => {
  const requests: OnboardingSurveyBody[] = []
  addAPIMock({
    method: 'post',
    path: '/platform/organizations/onboarding-survey',
    response: async ({ request }) => {
      requests.push((await request.json()) as OnboardingSurveyBody)
      if (status === 500) {
        return HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 })
      }
      return new HttpResponse(null, { status: 204 })
    },
  })
  return requests
}

describe('submitOnboardingSurvey', () => {
  it('leaves unanswered questions out of the request', async () => {
    const requests = mockSurveyEndpoint()

    await submitOnboardingSurvey({ slug: 'acme', kind: 'COMPANY', size: '10', building: '' })
    await submitOnboardingSurvey({ slug: 'acme', kind: ' ', building: ' b2b_saas ' })

    expect(requests).toEqual([
      { slug: 'acme', kind: 'COMPANY', size: '10' },
      { slug: 'acme', building: 'b2b_saas' },
    ])
  })

  it('rejects when the request fails, so callers can keep the answers', async () => {
    mockSurveyEndpoint(500)

    await expect(submitOnboardingSurvey({ slug: 'acme', kind: 'COMPANY' })).rejects.toThrow('Boom')
  })

  it('sends nothing without an org slug', async () => {
    const requests = mockSurveyEndpoint()

    await expect(submitOnboardingSurvey({ slug: '' })).rejects.toThrow(
      'Organization slug is required'
    )
    expect(requests).toEqual([])
  })
})
