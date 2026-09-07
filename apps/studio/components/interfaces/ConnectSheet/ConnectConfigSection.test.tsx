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
  resolvedOptions: [],
}

const frameworkOptions = [
  { value: 'nextjs', label: 'Next.js' },
  { value: 'react', label: 'React' },
  { value: 'react-native', label: 'React Native' },
]

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
})
