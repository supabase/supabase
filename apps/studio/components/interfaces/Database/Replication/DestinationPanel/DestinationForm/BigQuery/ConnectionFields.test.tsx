import { fireEvent, screen, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import type { DestinationPanelSchemaType } from '../DestinationForm.schema'
import { BigQueryConnectionFields } from './ConnectionFields'
import { customRender } from '@/tests/lib/custom-render'

const TestForm = ({ onSubmit }: { onSubmit: (data: DestinationPanelSchemaType) => void }) => {
  const form = useForm<DestinationPanelSchemaType>({
    defaultValues: { connectionPoolSize: 5, maxStalenessMins: 0 },
  })
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <BigQueryConnectionFields control={form.control} />
        <button type="submit">Submit</button>
        <button type="button" onClick={() => form.reset()}>
          Reset
        </button>
      </form>
    </Form>
  )
}

describe('BigQueryConnectionFields', () => {
  it('keeps both connection settings editable and submits their numeric values', async () => {
    const onSubmit = vi.fn()
    customRender(<TestForm onSubmit={onSubmit} />)
    const pool = screen.getByRole('spinbutton', { name: 'Connection pool size' })
    const staleness = screen.getByRole('spinbutton', { name: 'Maximum staleness' })
    expect(pool).toHaveValue(5)
    expect(staleness).toHaveValue(0)
    fireEvent.change(pool, { target: { value: '8' } })
    fireEvent.change(staleness, { target: { value: '30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { connectionPoolSize: 8, maxStalenessMins: 30 },
        expect.anything()
      )
    )
  })

  it('preserves empty values and restores defaults on reset', async () => {
    const onSubmit = vi.fn()
    customRender(<TestForm onSubmit={onSubmit} />)
    const pool = screen.getByRole('spinbutton', { name: 'Connection pool size' })
    const staleness = screen.getByRole('spinbutton', { name: 'Maximum staleness' })
    fireEvent.change(pool, { target: { value: '' } })
    fireEvent.change(staleness, { target: { value: '' } })
    expect(pool).toHaveValue(null)
    expect(staleness).toHaveValue(null)
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { connectionPoolSize: '', maxStalenessMins: '' },
        expect.anything()
      )
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(pool).toHaveValue(5)
    expect(staleness).toHaveValue(0)
  })
})
