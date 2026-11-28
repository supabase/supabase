import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'

import type { FieldOption, ResolvedField } from './Connect.types'
import { ConnectRadioListField } from './ConnectRadioListField'
import { customRender } from '@/tests/lib/custom-render'

const options: FieldOption[] = [
  { value: 'direct', label: 'Direct connection', description: 'Best for persistent servers' },
  { value: 'transaction', label: 'Transaction pooler', description: 'Best for serverless' },
  { value: 'session', label: 'Session pooler', description: 'Best for IPv4 networks' },
]

const connectionMethod: ResolvedField = {
  id: 'connectionMethod',
  type: 'radio-list',
  label: 'Method',
  resolvedOptions: options,
}

const useSharedPooler: ResolvedField = {
  id: 'useSharedPooler',
  type: 'switch',
  label: 'Use IPv4 connection (shared pooler)',
  resolvedOptions: [],
  inlineWithOption: { fieldId: 'connectionMethod', value: 'transaction' },
}

const renderField = ({
  state,
  activeFields,
  onFieldChange = vi.fn(),
}: {
  state: Record<string, string | boolean | string[]>
  activeFields: ResolvedField[]
  onFieldChange?: (fieldId: string, value: string | boolean | string[]) => void
}) =>
  customRender(
    <ConnectRadioListField
      field={connectionMethod}
      options={options}
      state={state}
      activeFields={activeFields}
      onFieldChange={onFieldChange}
    />
  )

describe('ConnectRadioListField', () => {
  test('renders every option as a radio', () => {
    renderField({
      state: { mode: 'direct', connectionMethod: 'direct' },
      activeFields: [connectionMethod],
    })

    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  test('renders the inline switch when its field is active', () => {
    renderField({
      state: { mode: 'direct', connectionMethod: 'transaction', useSharedPooler: false },
      activeFields: [connectionMethod, useSharedPooler],
    })

    expect(screen.getByRole('switch', { name: /Use IPv4 connection/ })).not.toBeChecked()
  })

  test('omits the inline switch when its field is not active', () => {
    renderField({
      state: { mode: 'direct', connectionMethod: 'direct' },
      activeFields: [connectionMethod],
    })

    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })

  test('toggling the inline switch updates its own field, not the selected option', async () => {
    const onFieldChange = vi.fn()
    renderField({
      state: { mode: 'direct', connectionMethod: 'transaction', useSharedPooler: false },
      activeFields: [connectionMethod, useSharedPooler],
      onFieldChange,
    })

    await userEvent.click(screen.getByRole('switch', { name: /Use IPv4 connection/ }))

    expect(onFieldChange).toHaveBeenCalledTimes(1)
    expect(onFieldChange).toHaveBeenCalledWith('useSharedPooler', true)
  })

  test('selecting another option reports the method change', async () => {
    const onFieldChange = vi.fn()
    renderField({
      state: { mode: 'direct', connectionMethod: 'transaction' },
      activeFields: [connectionMethod, useSharedPooler],
      onFieldChange,
    })

    await userEvent.click(screen.getByRole('radio', { name: /Session pooler/ }))

    expect(onFieldChange).toHaveBeenCalledWith('connectionMethod', 'session')
  })

  describe('keyboard navigation', () => {
    test('keeps the same radio element when the inline switch appears', () => {
      const props = { field: connectionMethod, options, onFieldChange: vi.fn() }
      const { rerender } = customRender(
        <ConnectRadioListField
          {...props}
          state={{ mode: 'direct', connectionMethod: 'transaction' }}
          activeFields={[connectionMethod]}
        />
      )
      const radio = screen.getByRole('radio', { name: /Transaction pooler/ })

      rerender(
        <ConnectRadioListField
          {...props}
          state={{ mode: 'direct', connectionMethod: 'transaction' }}
          activeFields={[connectionMethod, useSharedPooler]}
        />
      )

      expect(screen.getByRole('switch')).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /Transaction pooler/ })).toBe(radio)
    })

    test('focus stays on the radio, so arrow keys keep working, once the inline switch appears', async () => {
      function StatefulList() {
        const [state, setState] = useState<Record<string, string | boolean | string[]>>({
          mode: 'direct',
          connectionMethod: 'direct',
        })
        // The IPv4 field only exists while Transaction pooler is selected, like in the real schema
        const activeFields =
          state.connectionMethod === 'transaction'
            ? [connectionMethod, useSharedPooler]
            : [connectionMethod]

        return (
          <ConnectRadioListField
            field={connectionMethod}
            options={options}
            state={state}
            activeFields={activeFields}
            onFieldChange={(fieldId, value) => setState((prev) => ({ ...prev, [fieldId]: value }))}
          />
        )
      }
      customRender(<StatefulList />)

      // Selecting Transaction pooler adds its inline switch. The radio must keep focus through it.
      await userEvent.click(screen.getByRole('radio', { name: /Transaction pooler/ }))

      const transaction = screen.getByRole('radio', { name: /Transaction pooler/ })
      expect(screen.getByRole('switch')).toBeInTheDocument()
      expect(transaction).toBeChecked()
      expect(transaction).toHaveFocus()

      await userEvent.keyboard('{ArrowDown}')

      expect(screen.getByRole('radio', { name: /Session pooler/ })).toHaveFocus()
    })
  })
})
