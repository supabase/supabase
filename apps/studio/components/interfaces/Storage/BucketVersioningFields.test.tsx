import { zodResolver } from '@hookform/resolvers/zod'
import { screen, waitForElementToBeRemoved, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, test } from 'vitest'
import { z } from 'zod'

import { BucketVersioningFields } from './BucketVersioningFields'
import {
  bucketVersioningFormFields,
  superRefineBucketVersioning,
  type BucketVersioningFormValues,
} from './BucketVersioningFields.schema'
import type { BucketVersioningState } from './StorageVersioning.constants'
import { customRender } from '@/tests/lib/custom-render'

/** Mirrors how the bucket modals compose these fields into their own schema. */
const FormSchema = z.object(bucketVersioningFormFields).superRefine(superRefineBucketVersioning)

const DEFAULT_VALUES: BucketVersioningFormValues = {
  enable_versioning: false,
  version_expiry_days: 30,
  max_noncurrent_versions: 10,
  expiration_mode: 'and',
}

/** The fields expect their parent modal's form provider, so supply a minimal one. */
const Harness = ({
  defaultValues,
  ...props
}: {
  defaultValues?: Partial<BucketVersioningFormValues>
  initialVersioningState?: BucketVersioningState
  initialRetentionDays?: number | null
  initialMaxVersions?: number | null
  isPublicBucket?: boolean
}) => {
  const form = useForm<BucketVersioningFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { ...DEFAULT_VALUES, ...defaultValues },
    mode: 'onChange',
  })

  return (
    <Form {...form}>
      <form>
        <BucketVersioningFields {...props} />
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
    // S3 rejects a noncurrent-count rule with no noncurrent-days condition, so
    // the cap can't be left behind once the age is cleared.
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

    // One condition left means there is nothing to combine. The section animates
    // out, so it lingers in the DOM until the exit transition finishes.
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
      within(warning.parentElement!).getByText(/past the shorter retention window/)
    ).toBeInTheDocument()
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
