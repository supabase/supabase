import { fireEvent, screen, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { Button, Form } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { ReplicationFields } from './ReplicationFields'
import { customRender } from '@/tests/lib/custom-render'

const defaults = {
  maxFillMs: 500,
  maxTableSyncWorkers: 4,
  maxCopyConnectionsPerTable: 1,
  invalidatedSlotBehavior: 'error',
} satisfies Partial<DestinationPanelSchemaType>
const TestForm = ({ onSubmit }: { onSubmit: (data: DestinationPanelSchemaType) => void }) => {
  const form = useForm<DestinationPanelSchemaType>({ defaultValues: defaults })
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <ReplicationFields control={form.control} />
        <Button type="submit">Submit</Button>
        <Button type="button" onClick={() => form.reset()}>
          Reset
        </Button>
      </form>
    </Form>
  )
}

describe('ReplicationFields', () => {
  it.each([
    { label: 'Batch wait time', name: 'maxFillMs', value: 0 },
    { label: 'Table sync workers', name: 'maxTableSyncWorkers', value: 8 },
    { label: 'Initial sync connections per table', name: 'maxCopyConnectionsPerTable', value: 3 },
  ])('preserves editing, clearing and reset for $label', async ({ label, name, value }) => {
    const onSubmit = vi.fn()
    customRender(<TestForm onSubmit={onSubmit} />)
    const input = screen.getByRole('spinbutton', { name: label })
    fireEvent.change(input, { target: { value: String(value) } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenLastCalledWith({ ...defaults, [name]: value }, expect.anything())
    )
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenLastCalledWith({ ...defaults, [name]: '' }, expect.anything())
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(input).toHaveValue(Reflect.get(defaults, name))
  })

  it('preserves the invalidated-slot choices and submits the selected behaviour', async () => {
    const onSubmit = vi.fn()
    customRender(<TestForm onSubmit={onSubmit} />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('Block startup')
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.click(await screen.findByRole('option', { name: /Recreate slot/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenLastCalledWith(
        { ...defaults, invalidatedSlotBehavior: 'recreate' },
        expect.anything()
      )
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(trigger).toHaveTextContent('Block startup')
  })
})
