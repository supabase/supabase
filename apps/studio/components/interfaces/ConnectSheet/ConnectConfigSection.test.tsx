import { fireEvent, screen } from '@testing-library/react'
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

    const listbox = document.getElementById(combobox!.getAttribute('aria-controls')!)
    expect(listbox).toBeTruthy()

    const scrollArea = listbox!.querySelector('.h-72')
    expect(scrollArea).toBeTruthy()
    expect(screen.getAllByRole('option')).toHaveLength(20)
  })

  test('stops wheel events from bubbling out of the framework dropdown', async () => {
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

    const listbox = document.getElementById(combobox!.getAttribute('aria-controls')!)
    const scrollArea = listbox!.querySelector('.h-72') as HTMLElement
    expect(scrollArea).toBeTruthy()

    const stopPropagation = vi.spyOn(WheelEvent.prototype, 'stopPropagation')

    fireEvent.wheel(scrollArea, { deltaY: 120 })

    expect(stopPropagation).toHaveBeenCalled()
    stopPropagation.mockRestore()
  })
})
