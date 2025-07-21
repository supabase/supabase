import { describe, expect, it, beforeEach, vi } from 'vitest'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { screen, waitFor, fireEvent } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { render } from 'tests/helpers'
import EditSecretModal from '../EditSecretModal'
import { addAPIMock } from 'tests/lib/msw'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { Edit3, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { ProjectContextProvider } from 'components/layouts/ProjectLayout/ProjectContext'

const secret = {
  id: '47ca58b4-01c5-4a71-8814-c73856b02e0e',
  name: 'test',
  description: 'new text',
  secret: 'NASR0SoksURJ0OorMJ9FzraTzcqSWk5u1PQa2r4c3w9rUVc=',
  created_at: '2025-07-13 12:57:47.62208+00',
  updated_at: '2025-07-13 14:51:37.818223+00',
}

const Page = ({ onClose }: { onClose: () => void }) => {
  const [modal, setModal] = useState<string | null>(null)
  const renderModal = () => {
    switch (modal) {
      case `edit`:
        return (
          <EditSecretModal
            secret={secret}
            onClose={() => {
              setModal(null)
              onClose()
            }}
          />
        )
      default:
        return null
    }
  }
  return (
    <ProjectContextProvider projectRef="default">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button title="Manage Secret" type="text" className="px-1" icon={<MoreVertical />} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" className="w-32">
          <DropdownMenuItem className="space-x-2" onClick={() => setModal(`edit`)}>
            <Edit3 size="14" />
            <p>Edit</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {renderModal()}
    </ProjectContextProvider>
  )
}

mockAnimationsApi()

describe(`EditSecretModal`, () => {
  beforeEach(() => {
    // 'http://localhost:3000/api/platform/projects/default'
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
    // 'http://localhost:3000/api/platform/pg-meta/default/query?key=projects-default-secrets-47ca58b4-01c5-4a71-8814-c73856b02e0e'
    // 'http://localhost:3000/api/platform/pg-meta/default/query?key='
    // useVaultSecretDecryptedValueQuery + useVaultSecretUpdateMutation
    // both call the same endpoint but execute different SQL queries
    addAPIMock({
      method: `post`,
      path: `/platform/pg-meta/:ref/query`,
      // @ts-expect-error this path erroneously has a `never` return type when it should be `unknown` since it executes a SQL query
      response: [{ decrypted_secret: 'bar', update_secret: '' }],
    })
  })

  it(`renders a modal pre-filled with the secret's values`, async () => {
    const onClose = vi.fn()
    render(<Page onClose={onClose} />)

    const menuTrigger = screen.getByRole(`button`, { name: `Manage Secret` })
    await userEvent.click(menuTrigger)
    const editOption = await screen.findByRole(`menuitem`, { name: `Edit` })
    await userEvent.click(editOption)

    await waitFor(() => {
      expect(screen.getByRole(`dialog`)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(`Name`)
    const descriptionInput = screen.getByLabelText(`Description`)
    const valueInput = screen.getByLabelText(`Secret value`)
    const togglePasswordButton = screen.getByRole(`button`, { name: `Show secret value` })
    const submitButton = screen.getByRole(`button`, { name: `Update secret` })

    expect(nameInput).toHaveValue(secret.name)
    expect(descriptionInput).toHaveValue(secret.description)
    expect(valueInput).toHaveAttribute(`type`, `password`)
    await userEvent.click(togglePasswordButton)
    expect(valueInput).toHaveAttribute(`type`, `text`)

    await userEvent.type(nameInput, `updated-name`)
    await userEvent.clear(descriptionInput)
    await userEvent.type(valueInput, `qux`)

    fireEvent.click(submitButton)

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })
})
