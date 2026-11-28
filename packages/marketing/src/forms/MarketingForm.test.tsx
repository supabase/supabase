import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import MarketingForm from './MarketingForm'

describe('MarketingForm grouped checkbox validation', () => {
  it('passes validation when only a groupRequired: false checkbox in a required group is checked (#48071)', async () => {
    render(
      <MarketingForm
        submitLabel="Submit"
        fields={[
          {
            type: 'checkbox',
            name: 'dest_clickhouse',
            label: 'ClickHouse',
            group: 'destinations',
            groupRequired: true,
          },
          {
            type: 'checkbox',
            name: 'dest_snowflake',
            label: 'Snowflake',
            group: 'destinations',
            groupRequired: true,
          },
          {
            type: 'checkbox',
            name: 'dest_ducklake',
            label: 'DuckLake',
            group: 'destinations',
            groupRequired: false,
          },
        ]}
      />
    )

    // Check only DuckLake (groupRequired: false)
    const ducklakeCheckbox = screen.getByLabelText('DuckLake')
    fireEvent.click(ducklakeCheckbox)

    // Submit form
    const submitBtn = screen.getByRole('button', { name: 'Submit' })
    fireEvent.click(submitBtn)

    // Error message should NOT appear
    expect(screen.queryByText(/Please select at least one option/i)).toBeNull()
  })

  it('fails validation when no checkboxes in a group with groupRequired: true are checked', async () => {
    render(
      <MarketingForm
        submitLabel="Submit"
        fields={[
          {
            type: 'checkbox',
            name: 'dest_clickhouse',
            label: 'ClickHouse',
            group: 'destinations',
            groupRequired: true,
          },
          {
            type: 'checkbox',
            name: 'dest_snowflake',
            label: 'Snowflake',
            group: 'destinations',
            groupRequired: true,
          },
        ]}
      />
    )

    const submitBtn = screen.getByRole('button', { name: 'Submit' })
    fireEvent.click(submitBtn)

    expect(screen.getByText(/Please select at least one option: ClickHouse, Snowflake/i)).toBeInTheDocument()
  })

  it('fails validation when an individual required checkbox is unchecked', async () => {
    render(
      <MarketingForm
        submitLabel="Submit"
        fields={[
          {
            type: 'checkbox',
            name: 'terms',
            label: 'Accept Terms',
            required: true,
          },
        ]}
      />
    )

    const submitBtn = screen.getByRole('button', { name: 'Submit' })
    fireEvent.click(submitBtn)

    expect(screen.getByText(/Please confirm: Accept Terms/i)).toBeInTheDocument()
  })
})
