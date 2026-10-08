import { zodResolver } from '@hookform/resolvers/zod'
import { screen, waitForElementToBeRemoved, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, test } from 'vitest'

import { BucketFormSchema, type BucketFormValues } from '../FilesBucket.schema'
import { BucketVersioningFields } from './BucketVersioningFields'
import type { BucketVersioningState } from '@/components/interfaces/Storage/StorageVersioning.constants'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const DEFAULT_VALUES: BucketFormValues = {
  name: 'bucket',
  public: false,
  has_file_size_limit: false,
  allowed_mime_types: '',
  enable_versioning: false,
  version_expiry_days: 30,
  max_noncurrent_versions: 10,
  expiration_mode: 'and',
}

const Harness = ({
  defaultValues,
  ...props
}: {
  defaultValues?: Partial<BucketFormValues>
  initialVersioningState?: BucketVersioningState
  initialRetentionDays?: number | null
  initialMaxVersions?: number | null
  isPublicBucket?: boolean
  isLoadingPolicy?: boolean
  isUnsupportedPolicy?: boolean
  policyError?: { message: string } | null
}) => {
  const form = useForm<BucketFormValues>({
    resolver: zodResolver(BucketFormSchema),
    defaultValues: { ...DEFAULT_VALUES, ...defaultValues },
    mode: 'onChange',
  })

  return (
    <Form {...form}>
      <form>
        <BucketVersioningFields form={form} {...props} />
      </form>
    </Form>
  )
}

const renderFields = (props: Parameters<typeof Harness>[0] = {}) =>
  customRender(<Harness {...props} />)

const getVersioningSwitch = () => screen.getByRole('switch')
const getDaysInput = () =>
  screen.getByRole('spinbutton', { name: /noncurrent version expiration/i })
const getVersionsInput = () =>
  screen.getByRole('spinbutton', { name: /retained noncurrent versions/i })

describe('BucketVersioningFields', () => {
  test('hides the lifecycle policy until versioning is turned on', async () => {
    renderFields()

    expect(screen.getByText('Object versioning')).toBeInTheDocument()
    expect(screen.queryByText('Lifecycle policy')).not.toBeInTheDocument()

    await userEvent.click(getVersioningSwitch())

    expect(await screen.findByText('Lifecycle policy')).toBeInTheDocument()
    expect(screen.getByText('Noncurrent version expiration')).toBeInTheDocument()
    expect(screen.getByText('Retained noncurrent versions')).toBeInTheDocument()
  })

  test('rejects a version cap above the S3 ceiling', async () => {
    renderFields({ defaultValues: { enable_versioning: true } })

    const versionsInput = getVersionsInput()
    await userEvent.clear(versionsInput)
    await userEvent.type(versionsInput, '150')

    expect(await screen.findByText(/Cannot exceed 100 versions/)).toBeInTheDocument()
  })

  test('disables the version cap until an expiration age is set', async () => {
    renderFields({
      defaultValues: { enable_versioning: true, version_expiry_days: '' },
    })

    expect(getVersionsInput()).toBeDisabled()
    expect(screen.getByText('Requires an expiration age to be set.')).toBeInTheDocument()

    await userEvent.type(getDaysInput(), '30')

    expect(getVersionsInput()).toBeEnabled()
  })

  test('clears an orphaned version cap when the expiration age is removed', async () => {
    // S3 rejects a noncurrent-count rule with no noncurrent-days condition.
    renderFields({
      defaultValues: {
        enable_versioning: true,
        version_expiry_days: 30,
        max_noncurrent_versions: 10,
      },
    })

    expect(getVersionsInput()).toHaveValue(10)

    await userEvent.clear(getDaysInput())

    expect(getVersionsInput()).toHaveValue(null)
    expect(getVersionsInput()).toBeDisabled()
  })

  test('offers the and/or mode only while both conditions are set', async () => {
    renderFields({ defaultValues: { enable_versioning: true } })

    expect(screen.getByText('Expire a noncurrent version when')).toBeInTheDocument()

    // The section animates out, so it lingers in the DOM until the exit transition finishes.
    await userEvent.clear(getVersionsInput())

    await waitForElementToBeRemoved(() => screen.queryByText('Expire a noncurrent version when'))
  })

  test('warns when neither lifecycle condition is set', async () => {
    renderFields({
      defaultValues: {
        enable_versioning: true,
        version_expiry_days: '',
        max_noncurrent_versions: '',
      },
    })

    expect(screen.getByText('No lifecycle policy')).toBeInTheDocument()
  })

  test('warns that a public bucket serves every version', () => {
    renderFields({ defaultValues: { enable_versioning: true }, isPublicBucket: true })

    expect(screen.getByText('A public bucket serves every version')).toBeInTheDocument()
  })

  test('does not warn about public exposure for a private bucket', () => {
    renderFields({ defaultValues: { enable_versioning: true }, isPublicBucket: false })

    expect(screen.getByText('Lifecycle policy')).toBeInTheDocument()
    expect(screen.queryByText('A public bucket serves every version')).not.toBeInTheDocument()
  })

  test('explains that turning the switch off suspends rather than disables', async () => {
    renderFields({
      defaultValues: { enable_versioning: true },
      initialVersioningState: 'enabled',
    })

    await userEvent.click(getVersioningSwitch())

    expect(await screen.findByText('Saving will suspend versioning')).toBeInTheDocument()
    await waitForElementToBeRemoved(() => screen.queryByText('Lifecycle policy'))
  })

  test('warns before tightening the retention window on an already-versioned bucket', async () => {
    renderFields({
      defaultValues: { enable_versioning: true, version_expiry_days: 30 },
      initialVersioningState: 'enabled',
      initialRetentionDays: 30,
      initialMaxVersions: 10,
    })

    const daysInput = getDaysInput()
    await userEvent.clear(daysInput)
    await userEvent.type(daysInput, '7')

    const warning = await screen.findByText('Tightening retention expires some versions')
    expect(
      within(warning.parentElement!).getByText(/past the retention window/)
    ).toBeInTheDocument()
  })

  test('shows a loading state instead of claiming there is no policy, while one is loading', () => {
    renderFields({
      defaultValues: {
        enable_versioning: true,
        version_expiry_days: '',
        max_noncurrent_versions: '',
      },
      initialVersioningState: 'enabled',
      isLoadingPolicy: true,
    })

    expect(screen.getByLabelText('Loading lifecycle policy')).toBeInTheDocument()
    // The bucket may well have a policy; the fetch just hasn't said so yet.
    expect(screen.queryByText('No lifecycle policy')).not.toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
  })

  test('shows the policy fields once it has resolved', () => {
    renderFields({
      defaultValues: {
        enable_versioning: true,
        version_expiry_days: '',
        max_noncurrent_versions: '',
      },
      initialVersioningState: 'enabled',
      isLoadingPolicy: false,
    })

    expect(screen.queryByLabelText('Loading lifecycle policy')).not.toBeInTheDocument()
    expect(getDaysInput()).toBeInTheDocument()
    expect(screen.getByText('No lifecycle policy')).toBeInTheDocument()
  })

  test('reports a policy it failed to read instead of showing empty fields', () => {
    // The alert's support link reads the project it would report against.
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      // @ts-expect-error minimal project shape for useSelectedProject
      response: { id: 1, ref: 'default', name: 'Default Project', status: 'ACTIVE_HEALTHY' },
    })

    renderFields({
      defaultValues: {
        enable_versioning: true,
        version_expiry_days: '',
        max_noncurrent_versions: '',
      },
      initialVersioningState: 'enabled',
      policyError: { message: 'Failed to retrieve bucket lifecycle' },
    })

    expect(screen.getByText('Failed to retrieve the lifecycle policy')).toBeInTheDocument()
    // The bucket may well have a policy; the fetch failed before saying so.
    expect(screen.queryByText('No lifecycle policy')).not.toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
  })

  test('leaves a policy it cannot represent alone instead of offering to edit it', () => {
    renderFields({
      defaultValues: { enable_versioning: true },
      initialVersioningState: 'enabled',
      initialRetentionDays: 30,
      initialMaxVersions: 10,
      isUnsupportedPolicy: true,
    })

    expect(screen.getByText('Lifecycle policy set outside the dashboard')).toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    expect(screen.queryByText('No lifecycle policy')).not.toBeInTheDocument()
  })

  test('does not warn about tightening a policy it only partly read', async () => {
    renderFields({
      defaultValues: { enable_versioning: true, version_expiry_days: 7 },
      initialVersioningState: 'enabled',
      initialRetentionDays: 30,
      initialMaxVersions: 10,
      isUnsupportedPolicy: true,
    })

    expect(screen.queryByText('Tightening retention expires some versions')).not.toBeInTheDocument()
  })

  test('does not warn about tightening when enabling versioning for the first time', async () => {
    renderFields({ initialVersioningState: 'disabled', initialRetentionDays: null })

    await userEvent.click(getVersioningSwitch())

    const daysInput = getDaysInput()
    await userEvent.clear(daysInput)
    await userEvent.type(daysInput, '7')

    expect(screen.queryByText('Tightening retention expires some versions')).not.toBeInTheDocument()
  })
})
