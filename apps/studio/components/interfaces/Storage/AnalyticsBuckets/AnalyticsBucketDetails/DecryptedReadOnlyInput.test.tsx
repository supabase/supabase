import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { DecryptedReadOnlyInput } from './DecryptedReadOnlyInput'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual, useParams: () => ({ ref: 'default' }) }
})

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({
    data: { ref: 'default', connectionString: 'placeholder-connection' },
  }),
}))

describe('DecryptedReadOnlyInput', () => {
  it('names the reveal toggle and the Vault link after the secret they belong to', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => HttpResponse.json([{ decrypted_secret: 'secret-value' }]),
    })
    customRender(
      <DecryptedReadOnlyInput
        secureEntry
        value="secret-id"
        label="Catalog token"
        descriptionText="Stored in Vault"
      />
    )

    expect(screen.getByRole('link', { name: 'Open Catalog token in Vault' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Show Catalog token' }))

    expect(await screen.findByRole('button', { name: 'Hide Catalog token' })).toBeInTheDocument()
  })
})
