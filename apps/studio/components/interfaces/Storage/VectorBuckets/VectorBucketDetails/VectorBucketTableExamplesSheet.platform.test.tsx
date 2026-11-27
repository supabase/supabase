import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { VectorBucketTableExamplesSheet } from './VectorBucketTableExamplesSheet'
import type { VectorBucketIndex } from '@/data/storage/vector-buckets-indexes-query'
import { FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { mockPermissionsError } from '@/tests/lib/msw-permissions'
import { ALL_FGA_PERMISSIONS, type PermissionsV2Response } from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return {
    ...actual,
    useIsLoggedIn: () => true,
    useParams: () => ({ ref: 'default', bucketId: 'bucket' }),
  }
})
vi.mock('../useS3VectorsWrapper', () => ({
  useS3VectorsWrapperExtension: () => ({ extension: undefined }),
}))
vi.mock('../useS3VectorsWrapperInstance', () => ({
  useS3VectorsWrapperInstance: () => ({ data: undefined }),
}))

type ApiKeyResponse = components['schemas']['ApiKeyResponse_Output']

const index: VectorBucketIndex = {
  indexName: 'docs',
  vectorBucketName: 'bucket',
  dimension: 3,
  dataType: 'float32',
  distanceMetric: 'cosine',
  creationTime: 1,
}

const profileContext = createMockProfileContext()

const withoutKeysRead = (): PermissionsV2Response => ({
  organizations: [
    {
      slug: 'acme',
      role: 'developer',
      permissions: ALL_FGA_PERMISSIONS.filter(
        (permission) => permission !== FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_READ
      ),
      projects: [],
    },
  ],
})

const mockApiKeys = () => {
  const requests = vi.fn()
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/api-keys',
    response: () => {
      requests()
      return HttpResponse.json<ApiKeyResponse[]>([])
    },
  })
  return requests
}

const openJavaScriptExample = async () => {
  const user = userEvent.setup()
  customRender(<VectorBucketTableExamplesSheet index={index} />, { profileContext })
  await user.click(screen.getByRole('button', { name: 'Insert vectors' }))
  await user.click(await screen.findByRole('button', { name: /SQL/ }))
  await user.click(await screen.findByText('JavaScript'))
}

describe('VectorBucketTableExamplesSheet', () => {
  it('explains the missing permission and skips the request when denied', async () => {
    mockProjectGrantContext({ ref: 'default', permissions: withoutKeysRead() })
    const requests = mockApiKeys()

    await openJavaScriptExample()

    expect(
      await screen.findByText(/You need additional permissions to view API keys\./)
    ).toBeVisible()
    expect(requests).not.toHaveBeenCalled()
  })

  it('shows an error when permissions fail to load', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockPermissionsError()

    await openJavaScriptExample()

    expect(await screen.findByText(/Failed to check API key permissions/)).toBeVisible()
  })

  it('shows no note when api-keys are readable', async () => {
    mockProjectGrantContext({ ref: 'default' })
    const requests = mockApiKeys()

    await openJavaScriptExample()

    await vi.waitFor(() => expect(requests).toHaveBeenCalled())
    expect(screen.queryByText(/need additional permissions/)).not.toBeInTheDocument()
  })
})
