import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState, type ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AnnouncerProvider } from '../common'
import { ConnectionDetails, pickPublishableKey, type ConnectionState } from './connection-details'

afterEach(cleanup)

const urls = {
  projectUrl: 'https://supabase.com/dashboard/project/ref',
  connectUrl: 'https://supabase.com/dashboard/project/ref?showConnect=true',
}
const details: ConnectionState = {
  status: 'details',
  url: 'https://ref.supabase.co',
  key: 'sb_publishable_key',
}

const renderOpen = (element: ReactElement) => {
  render(element, { wrapper: AnnouncerProvider })
  fireEvent.click(screen.getByRole('button', { name: 'Connection details' }))
}

describe('pickPublishableKey', () => {
  const key = (type: string, name: string, disabled = false) => ({
    api_key: `${type}-${name}`,
    type,
    name,
    disabled,
  })

  it('prefers an enabled publishable key, then the legacy anon key', () => {
    expect(pickPublishableKey([key('legacy', 'anon'), key('publishable', 'default')])).toBe(
      'publishable-default'
    )
    expect(pickPublishableKey([key('publishable', 'default', true), key('legacy', 'anon')])).toBe(
      'legacy-anon'
    )
  })

  it('has nothing to offer when every key is disabled', () => {
    expect(pickPublishableKey([key('publishable', 'default', true)])).toBeUndefined()
  })
})

describe('ConnectionDetails', () => {
  it('asks the host for the details when it opens', () => {
    const onOpen = vi.fn()
    renderOpen(<ConnectionDetails connection={{ status: 'idle' }} onOpen={onOpen} {...urls} />)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('shows the project URL and key to copy once the host has them', () => {
    function Host() {
      const [connection, setConnection] = useState<ConnectionState>({ status: 'idle' })
      return (
        <ConnectionDetails
          connection={connection}
          onOpen={() => setConnection(details)}
          onOpenLink={() => {}}
          {...urls}
        />
      )
    }
    renderOpen(<Host />)
    expect(screen.getByLabelText('Project URL')).toHaveProperty('value', 'https://ref.supabase.co')
    expect(screen.getByLabelText('Publishable key')).toHaveProperty('value', 'sb_publishable_key')
    // The host can open links, so there is no link to copy.
    expect(screen.queryByLabelText('Studio link')).toBeNull()
  })

  it('says it is loading while the host reads them', () => {
    renderOpen(<ConnectionDetails connection={{ status: 'loading' }} onOpen={() => {}} {...urls} />)
    expect(screen.getByText('Loading connection details…')).toBeTruthy()
  })

  it('links to the dashboard when the details cannot be read', () => {
    const onOpenLink = vi.fn()
    renderOpen(
      <ConnectionDetails
        connection={{ status: 'dashboard' }}
        onOpen={() => {}}
        onOpenLink={onOpenLink}
        {...urls}
      />
    )
    const link = screen.getByRole('link', { name: 'Open in Studio' })
    // A real link, opened through the host: a sandboxed view cannot navigate.
    expect(link.getAttribute('href')).toBe(urls.connectUrl)
    fireEvent.click(link)
    expect(onOpenLink).toHaveBeenCalledWith(urls.connectUrl)
  })

  it('offers links to copy when the host cannot open them', () => {
    renderOpen(
      <ConnectionDetails connection={{ status: 'dashboard' }} onOpen={() => {}} {...urls} />
    )
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByLabelText('Studio link')).toHaveProperty('value', urls.connectUrl)
  })

  it('copies a value and tells screen readers', async () => {
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    renderOpen(<ConnectionDetails connection={details} onOpen={() => {}} {...urls} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy Project URL' }))
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Copied Project URL'))
    expect(writeText).toHaveBeenCalledWith('https://ref.supabase.co')
  })

  it('says when a host blocks the clipboard', async () => {
    const writeText = vi.fn(async () => {
      throw new Error('NotAllowedError')
    })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    renderOpen(<ConnectionDetails connection={details} onOpen={() => {}} {...urls} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy Publishable key' }))
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe("Couldn't copy Publishable key")
    )
  })
})
