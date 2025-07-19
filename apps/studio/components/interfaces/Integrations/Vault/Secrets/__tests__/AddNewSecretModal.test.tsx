import { describe, expect, it, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { render } from 'tests/helpers'
import { addAPIMock } from 'tests/lib/msw'
import { ProjectContextProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import AddNewSecretModal from '../AddNewSecretModal'

describe(`AddNewSecretModal`, () => {
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
      response: [{ create_secret: '80c7f1f7-d681-49e1-8ee0-a44a176558c8' }],
    })
  })

  it(`creates a new secret`, async () => {
    render(
      <ProjectContextProvider projectRef="default">
        <AddNewSecretModal canManageSecrets />
      </ProjectContextProvider>
    )

    const dialogTrigger = screen.getByRole(`button`, { name: `Add new secret` })
    await userEvent.click(dialogTrigger)

    await waitFor(() => {
      expect(screen.getByRole(`dialog`)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(`Name`)
    await userEvent.type(nameInput, `new secret`)

    const descriptionInput = screen.getByLabelText(`Description`)
    await userEvent.type(descriptionInput, `new secret description`)

    const valueInput = screen.getByLabelText(`Secret value`)
    expect(valueInput).toHaveAttribute(`type`, `password`)
    const togglePasswordButton = screen.getByRole(`button`, { name: `Show value` })
    await userEvent.click(togglePasswordButton)
    expect(valueInput).toHaveAttribute(`type`, `text`)
    await userEvent.type(valueInput, `new secret value`)

    const submitButton = screen.getByRole(`button`, { name: `Add secret` })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByRole(`dialog`)).not.toBeInTheDocument()
    })
  })

  it(`resets the form on cancel`, async () => {
    render(
      <ProjectContextProvider projectRef="default">
        <AddNewSecretModal canManageSecrets />
      </ProjectContextProvider>
    )

    const dialogTrigger = screen.getByRole(`button`, { name: `Add new secret` })
    await userEvent.click(dialogTrigger)

    await waitFor(() => {
      expect(screen.getByRole(`dialog`)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(`Name`)
    await userEvent.type(nameInput, `new secret`)

    const descriptionInput = screen.getByLabelText(`Description`)
    await userEvent.type(descriptionInput, `new secret description`)

    const valueInput = screen.getByLabelText(`Secret value`)
    expect(valueInput).toHaveAttribute(`type`, `password`)
    const togglePasswordButton = screen.getByRole(`button`, { name: `Show value` })
    await userEvent.click(togglePasswordButton)
    expect(valueInput).toHaveAttribute(`type`, `text`)
    await userEvent.type(valueInput, `new secret value`)

    const cancelButton = screen.getByRole(`button`, { name: `Cancel` })
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByRole(`dialog`)).not.toBeInTheDocument()
    })

    await userEvent.click(dialogTrigger)

    await waitFor(() => {
      expect(screen.getByRole(`dialog`)).toBeInTheDocument()
    })

    expect(nameInput).toHaveValue(``)
    expect(descriptionInput).toHaveValue(``)
    expect(valueInput).toHaveValue(``)
  })

  it(`resets the form on close`, async () => {
    render(
      <ProjectContextProvider projectRef="default">
        <AddNewSecretModal canManageSecrets />
      </ProjectContextProvider>
    )

    const dialogTrigger = screen.getByRole(`button`, { name: `Add new secret` })
    await userEvent.click(dialogTrigger)

    await waitFor(() => {
      expect(screen.getByRole(`dialog`)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(`Name`)
    await userEvent.type(nameInput, `new secret`)

    const descriptionInput = screen.getByLabelText(`Description`)
    await userEvent.type(descriptionInput, `new secret description`)

    const valueInput = screen.getByLabelText(`Secret value`)
    expect(valueInput).toHaveAttribute(`type`, `password`)
    const togglePasswordButton = screen.getByRole(`button`, { name: `Show value` })
    await userEvent.click(togglePasswordButton)
    expect(valueInput).toHaveAttribute(`type`, `text`)
    await userEvent.type(valueInput, `new secret value`)

    const closeButton = screen.getByRole(`button`, { name: `Close` })
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByRole(`dialog`)).not.toBeInTheDocument()
    })

    await userEvent.click(dialogTrigger)

    await waitFor(() => {
      expect(screen.getByRole(`dialog`)).toBeInTheDocument()
    })

    expect(nameInput).toHaveValue(``)
    expect(descriptionInput).toHaveValue(``)
    expect(valueInput).toHaveValue(``)
  })

  it(`cannot be opened without permission`, async () => {
    render(
      <ProjectContextProvider projectRef="default">
        <AddNewSecretModal canManageSecrets={false} />
      </ProjectContextProvider>
    )

    const dialogTrigger = screen.getByRole(`button`, { name: `Add new secret` })
    expect(dialogTrigger).toBeDisabled()
    await userEvent.click(dialogTrigger)

    await waitFor(() => {
      expect(screen.queryByRole(`dialog`)).not.toBeInTheDocument()
    })
  })
})
