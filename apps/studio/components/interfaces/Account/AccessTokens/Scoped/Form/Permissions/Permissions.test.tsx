import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import { TokenFormValues } from '../../../AccessToken.schemas'
import { Permissions } from './Permissions'
import { ACCESS_TOKEN_RESOURCES } from '@/components/interfaces/Account/AccessTokens/AccessToken.constants'
import { render } from '@/tests/helpers'

/**
 * Renders the real Permissions form with the resource picker already open, and
 * exposes the current `permissionRows` value so tests can assert on the seeded
 * actions rather than on button label formatting.
 */
function Harness() {
  const form = useForm<TokenFormValues>({
    defaultValues: { permissionRows: [] },
    mode: 'onChange',
  })
  const rows = form.watch('permissionRows') || []
  return (
    <FormProvider {...form}>
      <div data-testid="permission-rows">{JSON.stringify(rows)}</div>
      <Permissions control={form.control} resourceSearchOpen setResourceSearchOpen={() => {}} />
    </FormProvider>
  )
}

const readRows = () =>
  JSON.parse(
    screen.getByTestId('permission-rows').textContent || '[]'
  ) as TokenFormValues['permissionRows']

describe('Permissions — default actions when adding a resource', () => {
  it('seeds a newly added resource with a single least-privilege action, not its full action set', async () => {
    // Use a real resource that (a) exposes more than one action, so the
    // all-vs-one difference is observable, and (b) has a unique title, so the
    // picker row can be located unambiguously.
    const titleCounts = ACCESS_TOKEN_RESOURCES.reduce<Record<string, number>>((acc, r) => {
      acc[r.title] = (acc[r.title] ?? 0) + 1
      return acc
    }, {})
    const resource = ACCESS_TOKEN_RESOURCES.find(
      (r) => r.actions.length > 1 && titleCounts[r.title] === 1
    )
    expect(resource, 'expected a resource with >1 action and a unique title').toBeTruthy()

    render(<Harness />)

    // The picker is open; toggle the resource on via its row checkbox.
    const row = screen.getByText(resource!.title).closest('[cmdk-item]') as HTMLElement
    fireEvent.click(within(row).getByRole('checkbox'))

    await waitFor(() => expect(readRows()).toHaveLength(1))

    const added = readRows()![0]
    expect(added.resource).toBe(resource!.resource)
    // A newly added resource is least-privilege by default: exactly one action
    // (read when available, otherwise the first action) — never its full set.
    expect(added.actions).toHaveLength(1)
    expect(added.actions).toEqual(
      resource!.actions.includes('read') ? ['read'] : [resource!.actions[0]]
    )
  })
})
