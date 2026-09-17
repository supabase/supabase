import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MarketingForm from './MarketingForm'
import type { MarketingFormField } from './MarketingForm'

vi.mock('../go/actions/submitForm', () => ({
  submitFormAction: async () => ({ success: true }),
}))

describe('MarketingForm Grouped Checkbox Validation', () => {
  it('enforces required: true over group check (individual requirement)', async () => {
    const fields: MarketingFormField[] = [
      {
        name: 'opt_in_terms',
        type: 'checkbox',
        label: 'I accept terms',
        required: true,
        group: 'consents',
      },
      {
        name: 'opt_in_marketing',
        type: 'checkbox',
        label: 'Marketing emails',
        group: 'consents',
        groupRequired: true,
      },
    ]

    render(
      <MarketingForm fields={fields} submitLabel="Submit" formRef={{ slug: 'test', formId: '1' }} />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])
    await waitFor(() => {
      expect(checkboxes[1]).toHaveAttribute('aria-checked', 'true')
    })

    fireEvent.click(screen.getByText('Submit'))

    // The individual requirement error should be shown, not the group error
    expect(await screen.findByText('Please confirm: I accept terms')).toBeInTheDocument()
  })

  it('validates mixed-flag groups correctly (groupRequired is evaluated if any member has it)', async () => {
    const fields: MarketingFormField[] = [
      {
        name: 'newsletter',
        type: 'checkbox',
        label: 'Newsletter',
        group: 'subscriptions',
        groupRequired: true,
      },
      {
        name: 'updates',
        type: 'checkbox',
        label: 'Updates',
        group: 'subscriptions',
        // Notice this doesn't have groupRequired: true
      },
    ]

    render(
      <MarketingForm fields={fields} submitLabel="Submit" formRef={{ slug: 'test', formId: '1' }} />
    )
    fireEvent.click(screen.getByText('Submit'))

    // It should demand at least one of the grouped fields since one member set groupRequired: true
    expect(
      await screen.findByText('Please select at least one option: Newsletter, Updates')
    ).toBeInTheDocument()

    // Check the member without groupRequired
    // Radix UI checkboxes are buttons with role="checkbox"
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // 'Updates' is the second one

    await waitFor(() => {
      expect(checkboxes[1]).toHaveAttribute('aria-checked', 'true')
    })

    fireEvent.click(screen.getByText('Submit'))

    // It should now be satisfied since 'Updates' is checked
    await waitFor(() => {
      expect(screen.queryByText(/Please select at least one option/)).not.toBeInTheDocument()
    })
  })

  it('allows groups to be completely optional if no member sets groupRequired', async () => {
    const fields: MarketingFormField[] = [
      {
        name: 'sms',
        type: 'checkbox',
        label: 'SMS',
        group: 'optional_comms',
      },
      {
        name: 'post',
        type: 'checkbox',
        label: 'Post',
        group: 'optional_comms',
      },
    ]

    const { container } = render(
      <MarketingForm fields={fields} submitLabel="Submit" formRef={{ slug: 'test', formId: '1' }} />
    )

    // Stub out fetch if MarketingForm calls it internally, but here we aren't providing a formRef
    // so it just logs in dev and returns
    fireEvent.click(screen.getByText('Submit'))

    // Should NOT show any errors about this group
    expect(screen.queryByText(/Please select at least one option/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Please confirm/)).not.toBeInTheDocument()
  })
})
