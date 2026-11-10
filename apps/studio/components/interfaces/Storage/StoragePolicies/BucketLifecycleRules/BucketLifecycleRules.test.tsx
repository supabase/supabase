import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { Card } from 'ui'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { BucketLifecycleRules } from './BucketLifecycleRules'
import type { BucketLifecycle } from '@/data/storage/bucket-lifecycle-query'
import type { Bucket } from '@/data/storage/buckets-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()

vi.mock(
  '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext',
  async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return { ...actual, useIsStorageVersioningEnabled: () => true }
  }
)

const LIFECYCLE_PATH = '/platform/storage/:ref/buckets/:id/lifecycle'

const bucket: Bucket = {
  id: 'photos',
  name: 'photos',
  owner: 'owner',
  public: false,
  allowed_mime_types: [],
  file_size_limit: undefined,
  type: 'STANDARD',
  versioning_status: 'ENABLED',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const ageRule: BucketLifecycle['rules'][number] = {
  id: 'expire-after-month',
  status: 'Enabled',
  filter: {},
  noncurrent_version_expiration: { noncurrent_days: 30 },
}

const mockLifecycle = (lifecycle: BucketLifecycle) =>
  addAPIMock({
    method: 'get',
    path: LIFECYCLE_PATH,
    response: () => HttpResponse.json<BucketLifecycle>(lifecycle),
  })

const renderRules = (props: { bucket?: Bucket } = {}) =>
  customRender(
    <Card>
      <BucketLifecycleRules projectRef="default" bucket={props.bucket ?? bucket} />
    </Card>
  )

describe('BucketLifecycleRules', () => {
  beforeEach(() => {
    // useAsyncCheckPermissionsV2 -> selected project
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      // @ts-expect-error only the fields the permission check reads
      response: { id: 1, ref: 'default', organization_id: 1, status: 'ACTIVE_HEALTHY' },
    })
  })

  test('renders nothing for a bucket that has never been versioned', () => {
    renderRules({ bucket: { ...bucket, versioning_status: 'DISABLED' } })
    expect(screen.queryByText('Lifecycle rules')).not.toBeInTheDocument()
  })

  test('lists stored rules field for field', async () => {
    mockLifecycle({
      rules: [
        ageRule,
        {
          id: 'keep-five',
          status: 'Disabled',
          filter: {},
          noncurrent_version_expiration: { noncurrent_days: 1, newer_noncurrent_versions: 5 },
        },
      ],
    })

    renderRules()

    expect(await screen.findByText('expire-after-month')).toBeInTheDocument()
    expect(screen.getByText('keep-five')).toBeInTheDocument()
    expect(screen.getByText('Disabled')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  test('adds a rule by sending the whole configuration', async () => {
    mockLifecycle({ rules: [ageRule] })
    const requests: unknown[] = []
    addAPIMock({
      method: 'put',
      path: LIFECYCLE_PATH,
      response: async ({ request }) => {
        requests.push(await request.json())
        return HttpResponse.json<BucketLifecycle>({ rules: [] })
      },
    })

    renderRules()

    await screen.findByText('expire-after-month')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Add rule' })).not.toHaveAttribute(
        'aria-disabled',
        'true'
      )
    )
    await userEvent.click(screen.getByRole('button', { name: 'Add rule' }))

    await userEvent.type(await screen.findByLabelText('Rule ID'), 'keep-three')
    await userEvent.type(screen.getByLabelText('Newer noncurrent versions'), '3')

    // The preview shows what a save sends: the existing rule plus the new one.
    expect(
      screen.getByText(/PUT \/platform\/storage\/default\/buckets\/photos\/lifecycle/)
    ).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Add rule' }).at(-1)!)

    await waitFor(() =>
      expect(requests).toEqual([
        {
          rules: [
            ageRule,
            {
              id: 'keep-three',
              status: 'Enabled',
              filter: {},
              noncurrent_version_expiration: { noncurrent_days: 30, newer_noncurrent_versions: 3 },
            },
          ],
        },
      ])
    )
  })

  test('rejects a rule ID already used in the bucket', async () => {
    mockLifecycle({ rules: [ageRule] })

    renderRules()

    await screen.findByText('expire-after-month')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Add rule' })).not.toHaveAttribute(
        'aria-disabled',
        'true'
      )
    )
    await userEvent.click(screen.getByRole('button', { name: 'Add rule' }))
    await userEvent.type(await screen.findByLabelText('Rule ID'), 'expire-after-month')
    fireEvent.click(screen.getAllByRole('button', { name: 'Add rule' }).at(-1)!)

    expect(await screen.findByText('Must be unique within the bucket')).toBeInTheDocument()
  })

  test('deleting the only rule removes the configuration', async () => {
    mockLifecycle({ rules: [ageRule] })
    let deleteCount = 0
    addAPIMock({
      method: 'delete',
      path: LIFECYCLE_PATH,
      response: () => {
        deleteCount += 1
        return HttpResponse.json(null)
      },
    })

    renderRules()

    await screen.findByText('expire-after-month')
    await userEvent.click(screen.getByRole('button', { name: 'expire-after-month actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete rule' }))

    expect(await screen.findByText(/lifecycle configuration will be removed/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete rule' }))

    await waitFor(() => expect(deleteCount).toBe(1))
  })

  test('locks editing when a rule could not be sent back intact', async () => {
    mockLifecycle({ rules: [ageRule, { id: 'transition', status: 'Enabled', filter: {} }] })

    renderRules()

    expect(await screen.findByText("Some rules can't be edited here")).toBeInTheDocument()
    expect(screen.getByText('Unsupported action')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add rule' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })
})
