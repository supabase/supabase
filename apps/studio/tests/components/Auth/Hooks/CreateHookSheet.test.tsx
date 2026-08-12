import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { CreateHookSheet } from '@/components/interfaces/Auth/Hooks/CreateHookSheet'
import type { AuthConfigResponse } from '@/data/auth/auth-config-query'
import { projectKeys } from '@/data/projects/keys'
import { API_URL } from '@/lib/constants'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'

const PROJECT_REF = 'default'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('common')
  return { ...actual, useParams: () => ({ ref: PROJECT_REF }) }
})

// Monaco doesn't run under jsdom, and the sheet renders it to preview the permission
// statements. What matters here is the SQL that reaches the API, not the preview.
vi.mock('@/components/ui/CodeEditor/CodeEditor', () => ({
  CodeEditor: ({ value }: { value: string }) => <textarea readOnly value={value} />,
}))

const { toast } = await import('sonner')

// A hook already pointed at a Postgres function, so the sheet opens in "update" mode with the
// permission statements derived from the config and no user interaction needed to reach them.
const AUTH_CONFIG = {
  HOOK_SEND_SMS_ENABLED: true,
  HOOK_SEND_SMS_URI: 'pg-functions://postgres/public/send_sms',
  HOOK_SEND_SMS_SECRETS: '',
} as unknown as AuthConfigResponse

let executedPermissionSql: string[] = []

/**
 * Mocks the SQL endpoint so the permission statements can succeed, fail, or be held open
 * independently of the schema and function lookups the sheet makes while rendering.
 */
const mockSqlEndpoint = ({
  doPermissionsFail = false,
  holdPermissionsUntil,
}: { doPermissionsFail?: boolean; holdPermissionsUntil?: Promise<void> } = {}) => {
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: async ({ request }) => {
      const body = await request.json()
      const query =
        typeof body === 'object' && body !== null ? String(Reflect.get(body, 'query')) : ''

      if (query.includes('grant execute on function')) {
        executedPermissionSql.push(query)
        if (holdPermissionsUntil !== undefined) await holdPermissionsUntil
        if (doPermissionsFail) {
          return HttpResponse.json(
            { message: 'permission denied for schema public' },
            { status: 400 }
          )
        }
      }

      return HttpResponse.json([])
    },
  })
}

const renderSheet = () => {
  const onClose = vi.fn()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  customRender(
    <CreateHookSheet
      visible
      title="Send SMS hook"
      authConfig={AUTH_CONFIG}
      onClose={onClose}
      onDelete={vi.fn()}
    />,
    { queryClient }
  )
  return { onClose, queryClient }
}

const saveHook = async (queryClient: QueryClient) => {
  // The sheet refuses to submit until it has the selected project, which arrives asynchronously
  const projectKey = projectKeys.detail(PROJECT_REF)
  await waitFor(() => expect(queryClient.getQueryData(projectKey)).toBeDefined())

  const saveButton = await screen.findByRole<HTMLButtonElement>('button', { name: 'Update hook' })

  // The save button sits in the sheet footer and is tied to the form by the `form` attribute.
  // jsdom doesn't implement implicit submission for that association, so submit the form the
  // button owns rather than clicking it.
  const form = saveButton.form
  if (form === null) throw new Error('Save button is not associated with a form')
  fireEvent.submit(form)
}

describe('CreateHookSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    executedPermissionSql = []

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: {
        id: 1,
        ref: PROJECT_REF,
        organization_id: 1,
        name: 'Test Project',
        status: 'ACTIVE_HEALTHY',
        cloud_provider: 'AWS',
        region: 'us-east-1',
        db_host: `db.${PROJECT_REF}.supabase.co`,
        restUrl: `https://${PROJECT_REF}.supabase.co/rest/v1/`,
        connectionString: 'postgresql://postgres@localhost:5432/postgres',
        subscription_id: 'sub_123',
        inserted_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        integration_source: null,
        is_branch_enabled: false,
        is_physical_backups_enabled: false,
        high_availability: false,
      },
    })

    // Registered directly rather than through `addAPIMock`: the sheet ignores the updated config
    // in the response, and satisfying the typed helper would mean building an entire GoTrue config.
    mswServer.use(
      http.patch(`${API_URL}/platform/auth/:ref/config/hooks`, () => HttpResponse.json({}))
    )
  })

  test('applies the permission statements after saving the hook', async () => {
    mockSqlEndpoint()
    const { onClose, queryClient } = renderSheet()

    await saveHook(queryClient)

    await waitFor(() => expect(toast.success).toHaveBeenCalled())
    expect(onClose).toHaveBeenCalled()

    // All the statements are joined into a single query, so one round trip carries the whole
    // permission change and none of it can be applied by halves
    expect(executedPermissionSql).toHaveLength(1)

    // supabase_auth_admin needs execute on the function, and everyone else must lose it
    const [sql] = executedPermissionSql
    expect(sql).toContain('grant execute on function public.send_sms to supabase_auth_admin')
    expect(sql).toContain('grant usage on schema public to supabase_auth_admin')
    expect(sql).toContain(
      'revoke execute on function public.send_sms from authenticated, anon, public'
    )
  })

  // Previously the sheet reported success and closed while these statements were still in
  // flight, so a failed revoke left the function callable by anon and authenticated with
  // nothing to indicate it.
  test('surfaces a failure to apply the permission statements', async () => {
    mockSqlEndpoint({ doPermissionsFail: true })
    const { onClose, queryClient } = renderSheet()

    await saveHook(queryClient)

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('permissions failed to apply'))
    expect(toast.success).not.toHaveBeenCalled()
    // The sheet stays open so the statements stay visible and the save can be retried
    expect(onClose).not.toHaveBeenCalled()
  })

  // The sheet now stays open while the statements run, so the destructive action in the footer
  // has to stay out of reach until they settle.
  test('keeps the footer actions disabled while the permission statements are in flight', async () => {
    let releasePermissions = () => {}
    const permissionsHeld = new Promise<void>((resolve) => {
      releasePermissions = resolve
    })
    mockSqlEndpoint({ holdPermissionsUntil: permissionsHeld })

    const { onClose, queryClient } = renderSheet()

    await saveHook(queryClient)

    const deleteButton = await screen.findByRole('button', { name: 'Delete hook' })
    await waitFor(() => expect(deleteButton).toBeDisabled())
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(onClose).not.toHaveBeenCalled()

    releasePermissions()

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(deleteButton).toBeEnabled()
  })
})
