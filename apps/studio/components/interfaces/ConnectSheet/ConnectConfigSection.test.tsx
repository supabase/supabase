import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { describe, expect, test, vi } from 'vitest'

import type { ResolvedField } from './Connect.types'
import { ConnectConfigSection } from './ConnectConfigSection'
import { customRender } from '@/tests/lib/custom-render'

mockAnimationsApi()

const frameworkField: ResolvedField = {
  id: 'framework',
  type: 'combobox',
  label: 'Framework',
  combobox: {
    placeholder: 'Select framework',
    searchPlaceholder: 'Search frameworks...',
    emptyMessage: 'No frameworks found',
  },
  resolvedOptions: [],
}

const frameworkOptions = [
  { value: 'nextjs', label: 'Next.js' },
  { value: 'react', label: 'React' },
  { value: 'react-native', label: 'React Native' },
]

const manyFrameworkOptions = Array.from({ length: 20 }, (_, index) => ({
  value: `framework-${index}`,
  label: `Framework ${index}`,
}))

describe('ConnectConfigSection', () => {
  test('filters frameworks and selects the matching option', async () => {
    const user = userEvent.setup()
    const onFieldChange = vi.fn()

    customRender(
      <ConnectConfigSection
        activeFields={[frameworkField]}
        state={{ framework: 'nextjs' }}
        onFieldChange={onFieldChange}
        getFieldOptions={() => frameworkOptions}
      />
    )

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByPlaceholderText('Search frameworks...'), 'native')

    expect(screen.getByRole('option', { name: 'React Native' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Next.js' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('option', { name: 'React Native' }))

    expect(onFieldChange).toHaveBeenCalledWith('framework', 'react-native')
  })

  test('matches frameworks by key without announcing the empty state', async () => {
    const user = userEvent.setup()

    customRender(
      <ConnectConfigSection
        activeFields={[frameworkField]}
        state={{ framework: 'nextjs' }}
        onFieldChange={vi.fn()}
        getFieldOptions={() => frameworkOptions}
      />
    )

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByPlaceholderText('Search frameworks...'), 'nextjs')

    expect(screen.getByRole('option', { name: 'Next.js' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  test('announces when no frameworks match the search', async () => {
    const user = userEvent.setup()

    customRender(
      <ConnectConfigSection
        activeFields={[frameworkField]}
        state={{ framework: 'nextjs' }}
        onFieldChange={vi.fn()}
        getFieldOptions={() => frameworkOptions}
      />
    )

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByPlaceholderText('Search frameworks...'), 'missing')

    expect(screen.getByRole('status')).toHaveTextContent('No frameworks found')
  })

  test('clears the search when the combobox closes after selecting an option', async () => {
    const user = userEvent.setup()

    customRender(
      <ConnectConfigSection
        activeFields={[frameworkField]}
        state={{ framework: 'nextjs' }}
        onFieldChange={vi.fn()}
        getFieldOptions={() => frameworkOptions}
      />
    )

    await user.click(screen.getByRole('combobox'))
    const searchInput = screen.getByPlaceholderText('Search frameworks...')
    await user.type(searchInput, 'native')
    await user.click(screen.getByRole('option', { name: 'React Native' }))
    await user.click(screen.getByRole('combobox'))

    expect(screen.getByPlaceholderText('Search frameworks...')).toHaveValue('')
  })

  test('uses a bounded scroll area for long framework lists', async () => {
    const user = userEvent.setup()

    customRender(
      <ConnectConfigSection
        activeFields={[frameworkField]}
        state={{ framework: 'framework-0' }}
        onFieldChange={vi.fn()}
        getFieldOptions={() => manyFrameworkOptions}
      />
    )

    const combobox = document.getElementById('connect-framework')
    expect(combobox).toBeTruthy()

    await user.click(combobox!)

    const listbox = screen.getByRole('listbox')
    expect(combobox!.getAttribute('aria-controls')).toBe(listbox.id)

    expect(listbox).toHaveClass('max-h-72', 'overscroll-contain')
    expect(screen.getAllByRole('option')).toHaveLength(20)
  })
})
