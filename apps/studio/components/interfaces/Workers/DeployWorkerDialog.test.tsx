import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DeployWorkerDialog } from './DeployWorkerDialog'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

type ProjectSettingsResponse = components['schemas']['ProjectSettingsResponse']

// CopyButton writes via copyToClipboard from 'ui'. Stub just that export.
const { mockCopyToClipboard } = vi.hoisted(() => ({ mockCopyToClipboard: vi.fn() }))
vi.mock('ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ui')>()),
  copyToClipboard: mockCopyToClipboard,
}))

const mockProjectSettings = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/settings',
    response: () =>
      HttpResponse.json<ProjectSettingsResponse>({
        app_config: { endpoint: 'abcdefgh.supabase.co' },
        cloud_provider: 'AWS',
        db_dns_name: 'abcdefgh.supabase.co',
        db_host: 'abcdefgh.supabase.co',
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

// The Select trigger isn't associated with its label by `for`/`id` — scope to the
// combobox nearest the FormLayout row instead of getByRole('combobox', { name }).
const getSelectTriggerByLabel = (labelText: string) => {
  const label = screen.getByText(labelText)
  const row = label.closest('[data-formlayout-id="labelContainer"]')?.parentElement
  const trigger = row?.querySelector('[role="combobox"]')
  if (!trigger) throw new Error(`No combobox trigger found near label "${labelText}"`)
  return trigger as HTMLElement
}

describe('DeployWorkerDialog', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl('/project/default/workers')
    mockCopyToClipboard.mockClear()
    mockProjectSettings()
  })

  it('warns that the dashboard is read-only and workers only deploy to one region', () => {
    customRender(<DeployWorkerDialog open onOpenChange={vi.fn()} />)

    expect(
      screen.getByText('The dashboard is read-only during the Private Alpha')
    ).toBeInTheDocument()
    expect(screen.getByText(/only deploy to US West \(Oregon\)/)).toBeInTheDocument()
  })

  it('pre-populates the name field with a suggested worker-<word>-<number> name', () => {
    customRender(<DeployWorkerDialog open onOpenChange={vi.fn()} />)

    const nameInput = screen.getByPlaceholderText('my-worker') as HTMLInputElement
    expect(nameInput.value).toMatch(/^worker-[a-z]+-\d{6}$/)
  })

  it('suggests a new name each time the dialog is reopened', () => {
    const { rerender } = customRender(<DeployWorkerDialog open={false} onOpenChange={vi.fn()} />)

    rerender(<DeployWorkerDialog open onOpenChange={vi.fn()} />)
    const firstName = (screen.getByPlaceholderText('my-worker') as HTMLInputElement).value

    rerender(<DeployWorkerDialog open={false} onOpenChange={vi.fn()} />)
    rerender(<DeployWorkerDialog open onOpenChange={vi.fn()} />)
    const secondName = (screen.getByPlaceholderText('my-worker') as HTMLInputElement).value

    expect(firstName).not.toBe(secondName)
  })

  it('reflects the worker name typed into the form in the CLI and config.toml snippets', async () => {
    const user = userEvent.setup()
    customRender(<DeployWorkerDialog open onOpenChange={vi.fn()} />)

    const nameInput = screen.getByPlaceholderText('my-worker')
    await user.clear(nameInput)
    await user.type(nameInput, 'test-worker')
    await user.click(screen.getByRole('button', { name: 'CLI' }))
    expect(screen.getByText(/test-worker --runtime deno/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'config.toml' }))
    expect(screen.getByText(/\[workers\.test-worker\]/)).toBeInTheDocument()
  })

  it('updates the config.toml snippet when access is switched to public', async () => {
    const user = userEvent.setup()
    customRender(<DeployWorkerDialog open onOpenChange={vi.fn()} />)

    await user.click(getSelectTriggerByLabel('Access'))
    await user.click(await screen.findByRole('option', { name: 'Public' }))

    await user.click(screen.getByRole('button', { name: 'config.toml' }))
    expect(screen.getByText(/access\s+= "public"/)).toBeInTheDocument()
  })

  it('gives the AI prompt scaffolding instructions for the fixed Deno runtime', async () => {
    const user = userEvent.setup()
    customRender(<DeployWorkerDialog open onOpenChange={vi.fn()} />)

    const nameInput = screen.getByPlaceholderText('my-worker')
    await user.clear(nameInput)
    await user.type(nameInput, 'test-worker')

    await user.click(screen.getByRole('button', { name: 'AI Prompt' }))
    expect(screen.getByText(/Deno 2 runtime/)).toBeInTheDocument()
    expect(screen.getByText(/supabase\/workers\/test-worker\//)).toBeInTheDocument()
  })

  it('threads the project ref from the URL into the cURL deploy calls', async () => {
    const user = userEvent.setup()
    customRender(<DeployWorkerDialog open onOpenChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'cURL' }))
    expect(screen.getByText(/\/projects\/default\/workers\//)).toBeInTheDocument()
  })

  it('copies the active snippet to the clipboard', async () => {
    const user = userEvent.setup()
    customRender(<DeployWorkerDialog open onOpenChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'CLI' }))
    await user.click(screen.getByRole('button', { name: 'Copy snippet' }))

    expect(mockCopyToClipboard).toHaveBeenCalledWith(expect.stringContaining('supabase workers'))
  })
})
