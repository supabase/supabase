import { fireEvent, screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { EditSecretModal } from '../EditSecretModal'
import { ProjectContextProvider } from '@/components/layouts/ProjectLayout/ProjectContext'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'
import type { VaultSecret } from '@/types'

const secret: VaultSecret = {
  id: '47ca58b4-01c5-4a71-8814-c73856b02e0e',
  name: 'test',
  description: 'new text',
  secret: 'NASR0SoksURJ0OorMJ9FzraTzcqSWk5u1PQa2r4c3w9rUVc=',
  created_at: '2025-07-13 12:57:47.62208+00',
  updated_at: '2025-07-13 14:51:37.818223+00',
}

mockAnimationsApi()

describe(`EditSecretModal`, () => {
  beforeEach(() => {
    // useSelectedProjectQuery -> useParams
    routerMock.setCurrentUrl(`/project/default/integrations/vault/secrets`)
    // useSelectedProjectQuery
    addAPIMock({
      method: `get`,
      path: `/platform/projects/:ref`,
      // @ts-expect-error
      response: {
        cloud_provider: 'localhost',
        id: 1,
        inserted_at: '2021-08-02T06:40:40.646Z',
        name: 'Default Project',
        organization_id: 1,
        ref: 'default',
        region: 'local',
        status: 'ACTIVE_HEALTHY',
      },
    })
    // useVaultSecretsQuery + useVaultSecretDecryptedValueQuery + useVaultSecretUpdateMutation
    // all call the same endpoint but execute different SQL queries
    addAPIMock({
      method: `post`,
      path: `/platform/pg-meta/:ref/query`,
      response: async ({ request }) => {
        const body = (await request.json()) as { query: string }
        const query = body.query

        if (query.includes('decrypted_secrets')) {
          return HttpResponse.json([{ decrypted_secret: 'bar' }])
        } else if (query.includes('update_secret')) {
          return HttpResponse.json([{ update_secret: '' }])
        }
        // vault.secrets list query
        return HttpResponse.json([secret])
      },
    })
  })

  it(`renders a modal pre-filled with the secret's values`, async () => {
    customRender(
      <ProjectContextProvider projectRef="default">
        <EditSecretModal />
      </ProjectContextProvider>,
      {
        nuqs: {
          searchParams: {
            edit: secret.id,
          },
        },
      }
    )

    await screen.findByRole(`dialog`)

    const nameInput = await screen.findByLabelText(`Name`)
    const descriptionInput = screen.getByLabelText(`Description`)
    const valueInput = screen.getByLabelText(`Secret value`)
    const submitButton = screen.getByRole(`button`, { name: `Update secret` })

    expect(nameInput).toHaveValue(secret.name)
    expect(descriptionInput).toHaveValue(secret.description)
    expect(valueInput.tagName).toBe('TEXTAREA')

    await userEvent.type(nameInput, `updated-name`)
    await userEvent.clear(descriptionInput)
    await userEvent.type(valueInput, `qux`)

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByRole(`dialog`)).not.toBeInTheDocument()
    })
  })

  it(`preserves newlines when pasting multiline text into the secret value`, async () => {
    const requests: Array<{ body: unknown }> = []
    addAPIMock({
      method: `post`,
      path: `/platform/pg-meta/:ref/query`,
      response: async ({ request }) => {
        const body = (await request.json()) as { query: string }
        const query = body.query

        if (query.includes('decrypted_secrets')) {
          return HttpResponse.json([{ decrypted_secret: '' }])
        } else if (query.includes('update_secret')) {
          requests.push({ body })
          return HttpResponse.json([{ update_secret: '' }])
        }
        return HttpResponse.json([secret])
      },
    })

    customRender(
      <ProjectContextProvider projectRef="default">
        <EditSecretModal />
      </ProjectContextProvider>,
      {
        nuqs: {
          searchParams: {
            edit: secret.id,
          },
        },
      }
    )

    await screen.findByRole(`dialog`)

    const valueInput = await screen.findByLabelText(`Secret value`)
    const submitButton = screen.getByRole(`button`, { name: `Update secret` })

    const multilineValue = '-----BEGIN CERTIFICATE-----\nline2\nline3\n-----END CERTIFICATE-----'
    await userEvent.type(valueInput, multilineValue)

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByRole(`dialog`)).not.toBeInTheDocument()
    })

    const updateQuery = requests[0]?.body as { query: string } | undefined
    expect(updateQuery?.query).toContain(multilineValue)
  })
})
