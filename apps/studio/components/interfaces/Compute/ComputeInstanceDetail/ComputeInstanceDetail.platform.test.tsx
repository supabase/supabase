import { screen } from '@testing-library/react'
import { apiV2Components, components, platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { ComputeInstanceDetail } from './ComputeInstanceDetail'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ComputeInstanceResponse = apiV2Components['schemas']['V2ComputeInstanceResponse_Output']
type ProjectSettingsResponse = components['schemas']['ProjectSettingsResponse_Output']
type ProjectDetailResponse = platformComponents['schemas']['ProjectDetailResponse_Output']

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'default', name: 'embed' }),
}))

const INSTANCE: ComputeInstanceResponse = {
  data: {
    id: 'embed',
    type: 'project_compute_instance',
    attributes: {
      build_state: 'active',
      image_version: '7',
      instances: { declared: 3, live: 3, ready: 2, stale: 0 },
      secret_generation: '1',
      spec: { exposure: 'public', instances: 3, runtime: 'node', size: '2gb-1vcpu' },
    },
  },
}

function mockProject() {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () =>
      HttpResponse.json<ProjectDetailResponse>({
        cloud_provider: 'AWS',
        db_host: 'db.default.supabase.co',
        high_availability: false,
        id: 1,
        inserted_at: '2025-01-01T00:00:00Z',
        integration_source: null,
        is_branch_enabled: false,
        is_physical_backups_enabled: false,
        name: 'Test project',
        organization_id: 1,
        ref: 'default',
        region: 'us-east-1',
        restUrl: 'https://default.supabase.co',
        status: 'ACTIVE_HEALTHY',
        subscription_id: 'subscription-1',
        updated_at: '2025-01-01T00:00:00Z',
        connectionString: '',
      }),
  })
}

function mockProjectSettings() {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/settings',
    response: () =>
      HttpResponse.json<ProjectSettingsResponse>({
        app_config: {
          db_schema: 'public',
          endpoint: 'default.supabase.co',
          storage_endpoint: 'storage.default.supabase.co',
        },
        cloud_provider: 'AWS',
        db_dns_name: 'default.supabase.co',
        db_host: 'default.supabase.co',
        db_ip_addr_config: 'ipv4',
        db_name: 'postgres',
        db_port: 5432,
        db_user: 'postgres',
        inserted_at: '2025-02-16T22:24:42.115195',
        name: 'default',
        ref: 'default',
        region: 'us-east-1',
        ssl_enforced: true,
        status: 'ACTIVE_HEALTHY',
      }),
  })
}

describe('ComputeInstanceDetail', () => {
  it('shows a layout-shaped placeholder until the instance loads', async () => {
    mockProject()
    mockProjectSettings()
    let respond: () => void = () => {}
    const responded = new Promise<void>((resolve) => (respond = resolve))
    addAPIMock({
      method: 'get',
      path: '/v2/projects/:ref/compute/:name',
      response: async () => {
        await responded
        return HttpResponse.json<ComputeInstanceResponse>(INSTANCE)
      },
    })

    customRender(<ComputeInstanceDetail />)

    expect(await screen.findByText('Loading instance')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Compute' })).toHaveAttribute(
      'href',
      '/project/default/compute'
    )
    expect(screen.getByRole('heading', { name: 'Instances' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Container' })).toBeVisible()
    expect(screen.queryByText('embed')).not.toBeInTheDocument()
    expect(screen.queryByText('Base image')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Overview' })).not.toBeInTheDocument()

    respond()

    expect(await screen.findByRole('heading', { name: 'embed', level: 1 })).toBeVisible()
    expect(screen.queryByText('Loading instance')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Overview' })).toBeVisible()
    expect(screen.getByText('Stale')).toBeVisible()
    expect(screen.getByText('Base image')).toBeVisible()
  })
})
