import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TocDisclosure } from './toc'

const heading = (title: string, depth: number) => ({ title, url: `#${title}`, depth })

describe('TocDisclosure', () => {
  it('nests level 3 headings under the level 2 heading before them', () => {
    render(
      <TocDisclosure
        items={[
          heading('setup', 2),
          heading('install', 3),
          heading('configure', 3),
          heading('notes', 2),
        ]}
      />
    )

    const setup = screen.getByRole('link', { name: 'setup' }).closest('li')!
    const nested = within(setup).getByRole('list')
    expect(
      within(nested)
        .getAllByRole('link')
        .map((link) => link.textContent)
    ).toEqual(['install', 'configure'])
    expect(
      screen.getByRole('link', { name: 'notes' }).closest('li')!.querySelector('ul')
    ).toBeNull()
  })

  it('keeps level 3 headings with no level 2 before them at the top level', () => {
    render(
      <TocDisclosure items={[heading('intro', 3), heading('overview', 3), heading('setup', 2)]} />
    )

    const topLevel = screen.getByRole('link', { name: 'setup' }).closest('li')!.parentElement
    expect(screen.getByRole('link', { name: 'intro' }).closest('li')!.parentElement).toBe(topLevel)
    expect(screen.getByRole('link', { name: 'overview' }).closest('li')!.parentElement).toBe(
      topLevel
    )
  })

  it('links to each heading anchor', () => {
    render(<TocDisclosure items={[heading('setup', 2)]} />)

    expect(screen.getByRole('link', { name: 'setup' })).toHaveAttribute('href', '#setup')
  })

  it('renders nothing without headings', () => {
    const { container } = render(<TocDisclosure items={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
