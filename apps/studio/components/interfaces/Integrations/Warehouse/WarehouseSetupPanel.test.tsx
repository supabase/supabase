import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, test, vi } from 'vitest'

import { WarehouseSetupPanel } from './WarehouseSetupPanel'
import type { DestinationPanelSchemaType } from '@/components/interfaces/Database/Replication/DestinationPanel/DestinationForm/DestinationForm.schema'
import { DuckLakeFields } from '@/components/interfaces/Database/Replication/DestinationPanel/DestinationForm/DuckLake/Fields'
import type { ProjectDetail } from '@/data/projects/project-detail-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type SetupStatus = components['schemas']['WarehouseSetupStatusResponse_Output']
type Destinations = components['schemas']['DestinationsResponse_Output']

mockAnimationsApi()
vi.mock('./WarehouseSchemaTablePicker', () => ({
  WarehouseSchemaTablePicker: () => <button tabIndex={0}>Enable Warehouse</button>,
}))
vi.mock('./WarehouseConnectSection', () => ({ WarehouseConnectSection: () => null }))
vi.mock('./WarehouseDisableCard', () => ({
  WarehouseDisableCard: () => <button tabIndex={0}>Disable Warehouse</button>,
}))
vi.mock('./WarehouseTableStatusList', () => ({
  WarehouseEnablingProgress: () => <p>Warehouse setup in progress</p>,
  WarehouseReplicatedTablesSection: () => <p>Replicated tables</p>,
}))

const PROJECT: ProjectDetail = {
  cloud_provider: 'AWS',
  connectionString: 'postgresql://postgres@localhost:5432/postgres',
  db_host: 'db.default.supabase.co',
  high_availability: false,
  id: 1,
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch_enabled: false,
  is_hibernating: false,
  is_physical_backups_enabled: false,
  name: 'Test project',
  organization_id: 1,
  ref: 'default',
  region: 'us-east-1',
  restUrl: 'https://default.supabase.co/rest/v1',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01T00:00:00.000Z',
}

function mockProject(isOrioleDb: boolean) {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () =>
      HttpResponse.json<ProjectDetail>({
        ...PROJECT,
        dbVersion: isOrioleDb
          ? 'supabase-postgres-17.11.0.004-orioledb'
          : 'supabase-postgres-17.6.1.001',
      }),
  })
}

function mockWarehouse(
  status: SetupStatus['setup_status'] = 'not_started',
  destinations: Destinations['destinations'] = []
) {
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/setup-status',
    response: () =>
      HttpResponse.json<SetupStatus>({
        setup_status: status,
        steps: [],
        tables: [],
        fdw_status: null,
      }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/destinations',
    response: () => HttpResponse.json<Destinations>({ destinations }),
  })
}

const DuckLakeForm = () => {
  const form = useForm<DestinationPanelSchemaType>({ defaultValues: { ducklakeMode: 'supabase' } })
  return (
    <Form {...form}>
      <DuckLakeFields form={form} editMode={false} />
    </Form>
  )
}

describe('OrioleDB catalog restrictions', () => {
  test.each(['not_started', 'disabled'] as const)(
    'blocks Warehouse setup using the current OrioleDB project when %s',
    async (status) => {
      mockProject(true)
      mockWarehouse(status)
      customRender(<WarehouseSetupPanel />)
      expect(
        await screen.findByText('This project cannot host a Warehouse catalog')
      ).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Enable Warehouse' })).not.toBeInTheDocument()
    }
  )

  test.each(['not_started', 'disabled'] as const)(
    'allows Warehouse setup on standard Postgres when %s',
    async (status) => {
      mockProject(false)
      mockWarehouse(status)
      customRender(<WarehouseSetupPanel />)
      expect(await screen.findByRole('button', { name: 'Enable Warehouse' })).toBeInTheDocument()
    }
  )

  test('preserves existing Warehouse management on an OrioleDB source', async () => {
    mockProject(true)
    mockWarehouse('complete')
    customRender(<WarehouseSetupPanel />)
    expect(await screen.findByRole('button', { name: 'Disable Warehouse' })).toBeInTheDocument()
    expect(
      screen.queryByText('This project cannot host a Warehouse catalog')
    ).not.toBeInTheDocument()
  })

  test.each(['not_started', 'disabled'] as const)(
    'lets the API validate a retained Warehouse destination when %s',
    async (status) => {
      mockProject(true)
      mockWarehouse(status, [
        {
          id: 1,
          tenant_id: 'default',
          name: 'supabase_warehouse',
          config: {
            ducklake: {
              data_path: 's3://warehouse-default/',
              s3_region: 'us-east-1',
              s3_endpoint: 'otherproject.storage.supabase.co/storage/v1/s3',
            },
          },
        },
      ])
      customRender(<WarehouseSetupPanel />)
      expect(await screen.findByRole('button', { name: 'Enable Warehouse' })).toBeInTheDocument()
    }
  )

  test('disables the managed DuckLake option while allowing custom connection details', async () => {
    mockProject(true)
    customRender(<DuckLakeForm />)
    expect(
      await screen.findByText('This project cannot host a DuckLake catalog')
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Use this Supabase project/ })).toBeDisabled()
    const customOption = screen.getByRole('radio', { name: /Enter connection details/ })
    expect(customOption).not.toBeDisabled()
    await userEvent.click(customOption)
    expect(screen.getByLabelText('Catalog URL')).toBeInTheDocument()
  })
})
