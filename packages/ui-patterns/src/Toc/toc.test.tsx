import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TocTree } from './toc'

const heading = (title: string, depth: number) => ({ title, url: `#${title}`, depth })

describe('TocTree', () => {
  it('nests level 3 headings under the level 2 heading before them', () => {
    render(
      <TocTree
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
    render(<TocTree items={[heading('intro', 3), heading('overview', 3), heading('setup', 2)]} />)

    const topLevel = screen.getByRole('link', { name: 'setup' }).closest('li')!.parentElement
    expect(screen.getByRole('link', { name: 'intro' }).closest('li')!.parentElement).toBe(topLevel)
    expect(screen.getByRole('link', { name: 'overview' }).closest('li')!.parentElement).toBe(
      topLevel
    )
  })

  it('marks the active heading as the current location', () => {
    render(<TocTree items={[heading('setup', 2), heading('install', 3)]} activeUrl="#install" />)

    expect(screen.getByRole('link', { name: 'install' })).toHaveAttribute(
      'aria-current',
      'location'
    )
    expect(screen.getByRole('link', { name: 'setup' })).not.toHaveAttribute('aria-current')
  })

  it('links to each heading anchor', () => {
    render(<TocTree items={[heading('setup', 2)]} />)

    expect(screen.getByRole('link', { name: 'setup' })).toHaveAttribute('href', '#setup')
  })
})
