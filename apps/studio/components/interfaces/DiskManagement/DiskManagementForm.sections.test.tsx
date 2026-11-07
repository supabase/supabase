import { zodResolver } from '@hookform/resolvers/zod'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, test } from 'vitest'

import { CreateDiskStorageSchema, DiskStorageSchemaType } from './DiskManagement.schema'
import { getDiskConfigEditability, isDiskConfigOverProvisioned } from './DiskManagement.utils'
import { AdvancedSection } from './DiskManagementForm.sections'
import { DiskType } from './ui/DiskManagement.constants'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()

const PROJECT_REF = 'default'

type TestHarnessProps = {
  defaultValues: DiskStorageSchemaType
  isSpendCapEnabled?: boolean
  isComputeSizeGuardrailActive?: boolean
  isHardBlocked?: boolean
}

function TestHarness({
  defaultValues,
  isSpendCapEnabled = false,
  isComputeSizeGuardrailActive = false,
  isHardBlocked = false,
}: TestHarnessProps) {
  const isCostGuardrailActive = isComputeSizeGuardrailActive || isSpendCapEnabled
  const diskConfigEditability = getDiskConfigEditability({
    isHardBlocked,
    isComputeSizeGuardrailActive,
    isSpendCapEnabled,
    isDiskOverProvisioned: isDiskConfigOverProvisioned({
      storageType: defaultValues.storageType as DiskType,
      provisionedIOPS: defaultValues.provisionedIOPS,
      throughput: defaultValues.throughput,
    }),
  })

  const form = useForm<DiskStorageSchemaType>({
    resolver: zodResolver(
      CreateDiskStorageSchema({
        defaultTotalSize: defaultValues.totalSize,
        cloudProvider: 'AWS',
        isSpendCapEnabled,
        downsizeOnlyFrom: isCostGuardrailActive
          ? {
              storageType: defaultValues.storageType as DiskType,
              provisionedIOPS: defaultValues.provisionedIOPS,
              throughput: defaultValues.throughput,
            }
          : undefined,
      })
    ),
    defaultValues,
  })

  return (
    <Form {...form}>
      <form>
        <div data-testid="is-dirty">{String(form.formState.isDirty)}</div>
        <AdvancedSection
          form={form}
          autoscaleSettingsRef={{ current: null }}
          storageSettingsRef={{ current: null }}
          showBillingBadge={false}
          beforePrice={0}
          afterPrice={0}
          canUpdateDiskConfiguration
          isDiskTooSmallForIopsOrThroughput={false}
          disableDiskInputs={isHardBlocked}
          disableDiskSizeInput={isHardBlocked}
          suggestedDiskSizeForCustomIops={8}
          diskConfigEditability={diskConfigEditability}
          provisionedStorageType={defaultValues.storageType as DiskType}
        />
      </form>
    </Form>
  )
}

function mockDiskEndpoints({
  storageType,
  provisionedIOPS,
  throughput,
  region = 'us-east-1',
}: {
  storageType: DiskType
  provisionedIOPS: number
  throughput?: number
  region?: string
}) {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: {
      cloud_provider: 'AWS',
      connectionString: 'postgresql://postgres:password@db.default.supabase.co:5432/postgres',
      db_host: 'db.default.supabase.co',
      dbVersion: 'supabase-postgres-15.1.0',
      high_availability: false,
      id: 1,
      infra_compute_size: 'micro',
      inserted_at: '2026-01-01T00:00:00.000Z',
      integration_source: null,
      is_branch_enabled: false,
      is_physical_backups_enabled: false,
      name: 'Test project',
      organization_id: 1,
      ref: PROJECT_REF,
      region,
      restUrl: `https://${PROJECT_REF}.supabase.co`,
      status: 'ACTIVE_HEALTHY',
      subscription_id: 'subscription-1',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/disk',
    response: {
      attributes: {
        type: storageType,
        iops: provisionedIOPS,
        size_gb: 100,
        throughput_mbps: throughput ?? 0,
        throughput_mibps: throughput ?? 0,
      },
    },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/disk/custom-config',
    response: { growth_percent: null, max_size_gb: null, min_increment_gb: null },
  })
}

function buildDefaultValues(overrides: Partial<DiskStorageSchemaType> = {}): DiskStorageSchemaType {
  return {
    storageType: DiskType.GP3,
    totalSize: 100,
    provisionedIOPS: 3000,
    throughput: 125,
    computeSize: 'ci_micro',
    growthPercent: null,
    minIncrementGb: null,
    maxSizeGb: null,
    ...overrides,
  }
}

describe('DiskManagementForm AdvancedSection — downsize-only cost guardrail carve-out', () => {
  test('over-provisioned disk with a restricted compute size unlocks storage settings for downsizing', async () => {
    const defaultValues = buildDefaultValues({ provisionedIOPS: 8000, throughput: 500 })
    mockDiskEndpoints({ storageType: DiskType.GP3, provisionedIOPS: 8000, throughput: 500 })

    customRender(<TestHarness defaultValues={defaultValues} isComputeSizeGuardrailActive />)

    expect(
      await screen.findByText(
        "Storage type, IOPS, or throughput exceeds what's currently supported"
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Adjusting disk configuration requires Large compute size or above')
    ).not.toBeInTheDocument()

    expect(await screen.findByRole('combobox')).toBeEnabled()
    expect(screen.getByRole('spinbutton', { name: 'IOPS' })).toBeEnabled()
    expect(screen.getByRole('spinbutton', { name: 'Throughput' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Change to Large compute' })).toBeInTheDocument()
  })

  test('over-provisioned disk with spend cap enabled unlocks storage settings and offers to disable the spend cap', async () => {
    const defaultValues = buildDefaultValues({ provisionedIOPS: 8000, throughput: 500 })
    mockDiskEndpoints({ storageType: DiskType.GP3, provisionedIOPS: 8000, throughput: 500 })

    customRender(<TestHarness defaultValues={defaultValues} isSpendCapEnabled />)

    expect(
      await screen.findByText(
        "Storage type, IOPS, or throughput exceeds what's currently supported"
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Disable spend cap' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Change to Large compute' })
    ).not.toBeInTheDocument()

    expect(await screen.findByRole('combobox')).toBeEnabled()
    expect(screen.getByRole('spinbutton', { name: 'IOPS' })).toBeEnabled()
  })

  test('a baseline gp3 disk with a restricted compute size stays fully disabled', async () => {
    const defaultValues = buildDefaultValues()
    mockDiskEndpoints({ storageType: DiskType.GP3, provisionedIOPS: 3000, throughput: 125 })

    customRender(<TestHarness defaultValues={defaultValues} isComputeSizeGuardrailActive />)

    expect(
      await screen.findByText('Adjusting disk configuration requires Large compute size or above')
    ).toBeInTheDocument()
    expect(
      screen.queryByText("Storage type, IOPS, or throughput exceeds what's currently supported")
    ).not.toBeInTheDocument()

    expect(await screen.findByRole('combobox')).toBeDisabled()
    expect(screen.getByRole('spinbutton', { name: 'IOPS' })).toBeDisabled()
    expect(screen.getByRole('spinbutton', { name: 'Throughput' })).toBeDisabled()
  })

  test('io2 is unselectable when the persisted storage type is gp3', async () => {
    const user = userEvent.setup()
    const defaultValues = buildDefaultValues({ provisionedIOPS: 8000, throughput: 500 })
    mockDiskEndpoints({ storageType: DiskType.GP3, provisionedIOPS: 8000, throughput: 500 })

    customRender(<TestHarness defaultValues={defaultValues} isComputeSizeGuardrailActive />)

    await user.click(await screen.findByRole('combobox'))
    const io2Option = await screen.findByRole('option', { name: /High Performance SSD/ })
    expect(io2Option).toHaveAttribute('aria-disabled', 'true')
  })

  test('io2 stays selectable when the persisted storage type is already io2', async () => {
    const user = userEvent.setup()
    const defaultValues = buildDefaultValues({
      storageType: DiskType.IO2,
      provisionedIOPS: 50_000,
      throughput: undefined,
    })
    mockDiskEndpoints({ storageType: DiskType.IO2, provisionedIOPS: 50_000 })

    customRender(<TestHarness defaultValues={defaultValues} isComputeSizeGuardrailActive />)

    await user.click(await screen.findByRole('combobox'))
    const io2Option = await screen.findByRole('option', { name: /High Performance SSD/ })
    expect(io2Option).not.toHaveAttribute('aria-disabled', 'true')
  })

  test('resetting to the supported configuration writes gp3/3000/125 and dirties the form', async () => {
    const user = userEvent.setup()
    const defaultValues = buildDefaultValues({ provisionedIOPS: 8000, throughput: 500 })
    mockDiskEndpoints({ storageType: DiskType.GP3, provisionedIOPS: 8000, throughput: 500 })

    customRender(<TestHarness defaultValues={defaultValues} isComputeSizeGuardrailActive />)

    expect(screen.getByTestId('is-dirty')).toHaveTextContent('false')

    await user.click(
      await screen.findByRole('button', { name: 'Reset to supported configuration' })
    )

    expect(await screen.findByRole('spinbutton', { name: 'IOPS' })).toHaveValue(3000)
    expect(screen.getByRole('spinbutton', { name: 'Throughput' })).toHaveValue(125)
    expect(within(screen.getByRole('combobox')).getByText('gp3')).toBeInTheDocument()
    expect(screen.getByTestId('is-dirty')).toHaveTextContent('true')
  })

  test('a hard-block reason keeps fields disabled even when the disk is over-provisioned', async () => {
    const defaultValues = buildDefaultValues({ provisionedIOPS: 8000, throughput: 500 })
    mockDiskEndpoints({ storageType: DiskType.GP3, provisionedIOPS: 8000, throughput: 500 })

    customRender(
      <TestHarness defaultValues={defaultValues} isComputeSizeGuardrailActive isHardBlocked />
    )

    expect(await screen.findByRole('combobox')).toBeDisabled()
    expect(screen.getByRole('spinbutton', { name: 'IOPS' })).toBeDisabled()
    expect(screen.getByRole('spinbutton', { name: 'Throughput' })).toBeDisabled()
    expect(
      screen.queryByText("Storage type, IOPS, or throughput exceeds what's currently supported")
    ).not.toBeInTheDocument()
  })
})
