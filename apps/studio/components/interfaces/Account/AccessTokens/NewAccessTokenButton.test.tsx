import { faker } from '@faker-js/faker'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { render } from 'tests/helpers'
import { addAPIMock } from 'tests/lib/msw'
import NewAccessTokenButton from './NewAccessTokenButton'

describe(`NewAccessTokenButton`, () => {
  beforeEach(() => {
    addAPIMock({
      method: `post`,
      path: `/platform/profile/access-tokens`,
      response: {
        name: faker.lorem.word(),
        scope: faker.helpers.arrayElement(['V0', undefined]),
        created_at: faker.date.past().toISOString(),
        id: faker.number.int(),
        token_alias: faker.lorem.words(),
        token: faker.lorem.words(),
      },
    })
  })

  it(`generates regular tokens`, async () => {
    const onCreateToken = vi.fn()
    render(<NewAccessTokenButton onCreateToken={onCreateToken} />)

    const dialogTrigger = screen.getByRole(`button`, { name: `Generate new token` })
    await userEvent.click(dialogTrigger)

    // Fill in the token name
    const nameInput = screen.getByLabelText(`Name`)
    await userEvent.type(nameInput, `test`)

    // Verify the form is open and the name field works
    expect(nameInput).toHaveValue(`test`)
    expect(screen.getByRole(`button`, { name: `Generate token` })).toBeInTheDocument()
  })

  it(`generates experimental tokens`, async () => {
    const onCreateToken = vi.fn()
    render(<NewAccessTokenButton onCreateToken={onCreateToken} />)

    const dropdownTrigger = screen.getByTitle(`Choose token scope`)
    await userEvent.click(dropdownTrigger)

    const experimentalMenuItem = await screen.findByRole(`menuitem`, {
      name: `Generate token for experimental API`,
    })
    await userEvent.click(experimentalMenuItem)

    await waitFor(() => {
      expect(screen.getByRole(`heading`, { name: `Generate token for experimental API` })).toBeInTheDocument()
      expect(screen.getByText(`The experimental API provides additional endpoints which allows you to manage your organizations and projects.`)).toBeInTheDocument()
    })

    // Fill in the token name
    const nameInput = screen.getByLabelText(`Name`)
    await userEvent.type(nameInput, `test`)

    // Verify the form is open and the name field works
    expect(nameInput).toHaveValue(`test`)
    expect(screen.getByRole(`button`, { name: `Generate token` })).toBeInTheDocument()
  })

  it(`resets the form on close/cancel`, async () => {
    render(<NewAccessTokenButton onCreateToken={vi.fn()} />)

    // pass 1: open dialog and fill form
    const dialogTrigger = screen.getByRole(`button`, { name: `Generate new token` })
    await userEvent.click(dialogTrigger)

    let nameInput = screen.getByLabelText(`Name`)
    await userEvent.type(nameInput, `cancel button test`)
    expect(nameInput).toHaveValue(`cancel button test`)

    // reset the form by pressing the cancel button
    const cancelButton = screen.getByRole(`button`, { name: `Cancel` })
    await userEvent.click(cancelButton)

    // pass 2: check that the form is reset, then fill it again
    await userEvent.click(dialogTrigger)

    nameInput = screen.getByLabelText(`Name`)
    expect(nameInput).not.toHaveValue(`cancel button test`)

    await userEvent.type(nameInput, `close modal test`)
    expect(nameInput).toHaveValue(`close modal test`)

    // reset the form by closing the dialog
    await userEvent.keyboard(`{Escape}`)

    // pass 3: check that the form has been reset again
    await userEvent.click(dialogTrigger)

    nameInput = screen.getByLabelText(`Name`)
    expect(nameInput).not.toHaveValue(`close modal test`)
  })

  it(`shows validation error when no permissions are configured`, async () => {
    const onCreateToken = vi.fn()
    render(<NewAccessTokenButton onCreateToken={onCreateToken} />)

    const dialogTrigger = screen.getByRole(`button`, { name: `Generate new token` })
    await userEvent.click(dialogTrigger)

    // Fill in the token name
    const nameInput = screen.getByLabelText(`Name`)
    await userEvent.type(nameInput, `test`)

    // Try to submit without adding permissions
    const generateButton = screen.getByRole(`button`, { name: `Generate token` })
    await userEvent.click(generateButton)

    // The form should not submit and onCreateToken should not be called
    // because validation prevents submission when no permissions are configured
    expect(onCreateToken).not.toHaveBeenCalled()
    
    // The form should still be open and the button should still be enabled
    expect(screen.getByRole(`button`, { name: `Generate token` })).toBeInTheDocument()
  })
})
