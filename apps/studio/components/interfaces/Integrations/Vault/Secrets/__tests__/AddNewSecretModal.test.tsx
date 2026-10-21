import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { beforeEach, describe, expect, it } from 'vitest'

import { AddNewSecretModal } from '../AddNewSecretModal'
import { ProjectContextProvider } from '@/components/layouts/ProjectLayout/ProjectContext'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

mockAnimationsApi()

describe('AddNewSecretModal', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl('/project/default/integrations/vault/secrets')
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
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
  })

  it('renders modal with expanding textarea and toggles visibility', async () => {
    customRender(
      <ProjectContextProvider projectRef="default">
        <AddNewSecretModal />
      </ProjectContextProvider>,
      {
        nuqs: {
          searchParams: {
            new: 'true',
          },
        },
      }
    )

    await screen.findByRole('dialog')

    const nameInput = screen.getByLabelText('Name')
    const valueInput = screen.getByLabelText('Secret value')
    const toggleButton = screen.getByRole('button', { name: 'Show secret value' })
    const submitButton = screen.getByRole('button', { name: 'Add secret' })

    expect(valueInput.tagName).toBe('TEXTAREA')
    expect((valueInput as any).style.WebkitTextSecurity).toBe('disc')

    await userEvent.click(toggleButton)
    expect((valueInput as any).style.WebkitTextSecurity).toBe('')

    expect(submitButton).toBeDisabled()
    await userEvent.type(nameInput, 'MY_SECRET')
    await userEvent.type(valueInput, 'my-secret-val')
    await waitFor(() => expect(submitButton).toBeEnabled())
  })

  it('enables Add secret for a long multi-line value', async () => {
    customRender(
      <ProjectContextProvider projectRef="default">
        <AddNewSecretModal />
      </ProjectContextProvider>,
      {
        nuqs: {
          searchParams: {
            new: 'true',
          },
        },
      }
    )

    await screen.findByRole('dialog')

    const nameInput = screen.getByLabelText('Name')
    const valueInput = screen.getByLabelText('Secret value')
    const submitButton = screen.getByRole('button', { name: 'Add secret' })
    const longValue = Array.from({ length: 200 }, (_, i) => `line-${i}-${'x'.repeat(60)}`).join(
      '\n'
    )

    await userEvent.type(nameInput, 'LONG_CERT')
    await userEvent.click(valueInput)
    await userEvent.paste(longValue)

    expect(valueInput).toHaveValue(longValue)
    expect(valueInput).toHaveClass('max-h-[320px]', 'overflow-y-auto')
    await waitFor(() => expect(submitButton).toBeEnabled())
  })
})
