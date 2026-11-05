import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DefaultCommandList } from './DefaultCommandList'
import type { MenuItem } from './types'

const renderList = (items: MenuItem[]) =>
  render(<DefaultCommandList items={items} highlightedIndex={0} onSelect={() => {}} />)

const getSeparators = (container: HTMLElement) => container.querySelectorAll('.h-px')

describe('DefaultCommandList', () => {
  it.each([
    { scenario: 'after built-in options', hasNativeOptions: true },
    { scenario: 'when only attributes match', hasNativeOptions: false },
  ])('labels attributes $scenario', ({ hasNativeOptions }) => {
    const { container, getByText, getAllByRole } = renderList([
      ...(hasNativeOptions ? [{ value: 'user', label: 'User' }] : []),
      { value: 'attribute.status', label: 'status', propertyGroupLabel: 'Attributes' },
      { value: 'attribute.request_id', label: 'request_id', propertyGroupLabel: 'Attributes' },
    ])

    const heading = getByText('Attributes')
    expect(heading.nextElementSibling).toBe(getAllByRole('option')[hasNativeOptions ? 1 : 0])
    expect(getSeparators(container)).toHaveLength(hasNativeOptions ? 1 : 0)
    expect(getAllByRole('option').map((option) => option.textContent)).toEqual([
      ...(hasNativeOptions ? ['User'] : []),
      'status',
      'request_id',
    ])
  })

  it('renders a separator before "New filter group" when it follows other items', () => {
    const { container, getByText } = renderList([
      { value: 'project', label: 'Project' },
      { value: 'date', label: 'Date range' },
      { value: '__new_group__', label: 'New filter group' },
    ])

    const separators = getSeparators(container)
    expect(separators).toHaveLength(1)
    expect(separators[0].nextElementSibling).toBe(
      getByText('New filter group').closest('[cmdk-item], div')
    )
  })

  it('does not render a separator when "New filter group" is the only item', () => {
    const { container } = renderList([{ value: '__new_group__', label: 'New filter group' }])
    expect(getSeparators(container)).toHaveLength(0)
  })

  it('does not render a separator when there is no "New filter group" item', () => {
    const { container, queryByText } = renderList([
      { value: 'project', label: 'Project' },
      { value: 'date', label: 'Date range' },
    ])
    expect(getSeparators(container)).toHaveLength(0)
    expect(queryByText('Attributes')).not.toBeInTheDocument()
  })
})
