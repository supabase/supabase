import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DefaultCommandList } from './DefaultCommandList'
import type { MenuItem } from './types'

const renderList = (items: MenuItem[]) =>
  render(<DefaultCommandList items={items} highlightedIndex={0} onSelect={() => {}} />)

const getSeparators = (container: HTMLElement) => container.querySelectorAll('.h-px')

describe('DefaultCommandList', () => {
  it('renders a separator before "New Group" when it follows other items', () => {
    const { container, getByText } = renderList([
      { value: 'project', label: 'Project' },
      { value: 'date', label: 'Date range' },
      { value: '__new_group__', label: 'New Group' },
    ])

    const separators = getSeparators(container)
    expect(separators).toHaveLength(1)
    expect(separators[0].nextElementSibling).toBe(
      getByText('New Group').closest('[cmdk-item], div')
    )
  })

  it('does not render a separator when "New Group" is the only item', () => {
    const { container } = renderList([{ value: '__new_group__', label: 'New Group' }])
    expect(getSeparators(container)).toHaveLength(0)
  })

  it('does not render a separator when there is no "New Group" item', () => {
    const { container } = renderList([
      { value: 'project', label: 'Project' },
      { value: 'date', label: 'Date range' },
    ])
    expect(getSeparators(container)).toHaveLength(0)
  })
})
