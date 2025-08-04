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

    const nameInput = screen.getByLabelText(`Name`)
    await userEvent.type(nameInput, `test{enter}`)

    await waitFor(() => expect(onCreateToken).toHaveBeenCalledTimes(1))
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

    await waitFor(async () => {
      await expect(
        screen.findByRole(`heading`, { name: `Generate token for experimental API` })
      ).resolves.toBeInTheDocument()
      await expect(screen.findByRole(`alert`)).resolves.toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(`Name`)
    await userEvent.type(nameInput, `test{enter}`)

    await waitFor(() => expect(onCreateToken).toHaveBeenCalledTimes(1))
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

    // pass 3: check that the form has been rest again
    await userEvent.click(dialogTrigger)

    nameInput = screen.getByLabelText(`Name`)
    expect(nameInput).not.toHaveValue(`close modal test`)
  })
})
