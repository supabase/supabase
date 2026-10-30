import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { TocMenu } from './toc-menu'
import { ActiveAnchorContext } from './toc-primitive'

const heading = (title: string, depth: number) => ({ title, url: `#${title}`, depth })

describe('TocMenu', () => {
  it('shows the first heading before any heading is in view', () => {
    render(<TocMenu items={[heading('setup', 2), heading('notes', 2)]} />)

    expect(screen.getByRole('button')).toHaveTextContent('setup')
    expect(screen.getByRole('button')).not.toHaveTextContent('notes')
  })

  it('opens the heading list and closes it once a heading is picked', async () => {
    const user = userEvent.setup()
    render(<TocMenu items={[heading('setup', 2), heading('notes', 2)]} />)

    const trigger = screen.getByRole('button')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByRole('link', { name: 'notes' }))
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('returns focus to the trigger when escape closes the list', async () => {
    const user = userEvent.setup()
    render(<TocMenu items={[heading('setup', 2), heading('notes', 2)]} />)

    const trigger = screen.getByRole('button')
    await user.click(trigger)
    screen.getByRole('link', { name: 'notes' }).focus()
    await user.keyboard('{Escape}')

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
  })

  it('names the list instead of repeating a heading while it is open', async () => {
    const user = userEvent.setup()
    render(
      <ActiveAnchorContext value={['notes']}>
        <TocMenu items={[heading('setup', 2), heading('notes', 2)]} />
      </ActiveAnchorContext>
    )
    const currentHeading = () =>
      screen.getByRole('button').querySelector('[data-roll-role="current"]')

    expect(currentHeading()).toHaveTextContent('notes')
    await user.click(screen.getByRole('button'))
    expect(currentHeading()).toHaveTextContent('On this page')
    expect(screen.getByRole('link', { name: 'notes' })).toHaveAttribute('aria-current', 'location')
  })

  it('renders nothing without headings', () => {
    const { container } = render(<TocMenu items={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
