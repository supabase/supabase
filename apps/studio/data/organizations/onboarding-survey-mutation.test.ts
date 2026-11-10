import { describe, expect, it, vi } from 'vitest'

import { buildOnboardingSurveyPayload, submitOnboardingSurvey } from './onboarding-survey-mutation'

const postMock = vi.fn()

vi.mock('@/data/fetchers', () => ({
  post: (...args: unknown[]) => postMock(...args),
  handleError: (error: unknown) => {
    throw error
  },
}))

describe('buildOnboardingSurveyPayload', () => {
  it('matches the onboarding survey API body shape', () => {
    expect(
      buildOnboardingSurveyPayload({
        slug: 'test-org',
        building: ' a mobile game backend ',
      })
    ).toEqual({
      slug: 'test-org',
      building: 'a mobile game backend',
    })
  })

  it('omits empty optional values', () => {
    expect(
      buildOnboardingSurveyPayload({
        slug: 'test-org',
        kind: ' ',
        building: '',
      })
    ).toEqual({ slug: 'test-org' })
  })

  it('includes kind and size when present', () => {
    expect(
      buildOnboardingSurveyPayload({
        slug: 'test-org',
        kind: '  STARTUP  ',
        size: '10',
        building: 'a saas',
      })
    ).toEqual({
      slug: 'test-org',
      kind: 'STARTUP',
      size: '10',
      building: 'a saas',
    })
  })
})

describe('submitOnboardingSurvey', () => {
  it('posts to the platform endpoint with the typed payload', async () => {
    postMock.mockReset()
    postMock.mockResolvedValue({ error: undefined })

    await submitOnboardingSurvey({
      slug: 'acme',
      kind: 'COMPANY',
      size: '10',
      building: 'a saas',
    })

    expect(postMock).toHaveBeenCalledWith('/platform/organizations/onboarding-survey', {
      body: {
        slug: 'acme',
        kind: 'COMPANY',
        size: '10',
        building: 'a saas',
      },
    })
  })

  it('throws when the slug is missing', async () => {
    await expect(submitOnboardingSurvey({ slug: '' })).rejects.toThrow(
      'Organization slug is required'
    )
  })
})
