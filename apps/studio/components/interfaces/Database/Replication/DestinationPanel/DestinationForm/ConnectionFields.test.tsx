import { fireEvent, screen, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { Button, Form } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { DuckLakeConnectionFields } from './DuckLake/ConnectionFields'
import { SnowflakeConnectionFields } from './Snowflake/ConnectionFields'
import { customRender } from '@/tests/lib/custom-render'

const cases = [
  {
    name: 'DuckLake',
    Component: DuckLakeConnectionFields,
    role: 'spinbutton',
    label: 'Pool size',
    defaultValues: { ducklakePoolSize: 2 },
    value: '4',
    expectedValues: { ducklakePoolSize: 4 },
    emptyValues: { ducklakePoolSize: '' },
    defaultValue: 2,
  },
  {
    name: 'Snowflake',
    Component: SnowflakeConnectionFields,
    role: 'textbox',
    label: 'Role',
    defaultValues: { snowflakeRole: 'PIPELINES_ROLE' },
    value: 'ANALYST',
    expectedValues: { snowflakeRole: 'ANALYST' },
    emptyValues: { snowflakeRole: '' },
    defaultValue: 'PIPELINES_ROLE',
  },
]

const TestForm = ({
  testCase,
  onSubmit,
}: {
  testCase: (typeof cases)[number]
  onSubmit: (data: DestinationPanelSchemaType) => void
}) => {
  const form = useForm<DestinationPanelSchemaType>({ defaultValues: testCase.defaultValues })
  const { Component } = testCase
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Component control={form.control} />
        <Button type="submit">Submit</Button>
        <Button type="button" onClick={() => form.reset()}>
          Reset
        </Button>
      </form>
    </Form>
  )
}

describe('destination connection fields', () => {
  it.each(cases)('$name preserves editing, empty values and reset', async (testCase) => {
    const onSubmit = vi.fn()
    customRender(<TestForm testCase={testCase} onSubmit={onSubmit} />)
    const input = screen.getByRole(testCase.role, { name: testCase.label })
    expect(input).toHaveValue(testCase.defaultValue)
    fireEvent.change(input, { target: { value: testCase.value } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenLastCalledWith(testCase.expectedValues, expect.anything())
    )
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenLastCalledWith(testCase.emptyValues, expect.anything())
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(input).toHaveValue(testCase.defaultValue)
  })
})
