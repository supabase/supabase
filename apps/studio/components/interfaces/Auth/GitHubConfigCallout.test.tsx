import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GitHubConfigCallout } from './GitHubConfigCallout'
import { customRender } from '@/tests/lib/custom-render'

describe('GitHubConfigCallout', () => {
  it('explains managed config values', () => {
    customRender(
      <GitHubConfigCallout
        state={{
          status: 'managed',
          configPath: 'auth.site_url',
          githubValue: 'https://app.example.com',
        }}
      />
    )

    expect(screen.getByText('Managed by config.toml')).toBeInTheDocument()
    expect(screen.getByText('Managed by config.toml').parentElement).toHaveTextContent(
      'current environment matches auth.site_url.'
    )
  })

  it('explains that drifted dashboard values remain active', () => {
    customRender(
      <GitHubConfigCallout
        state={{
          status: 'drifted',
          configPath: 'auth.additional_redirect_urls',
          githubValue: ['https://app.example.com/auth/callback'],
        }}
      />
    )

    expect(screen.getByText('Drift from config.toml')).toBeInTheDocument()
    expect(screen.getByText('Drift from config.toml').parentElement).toHaveTextContent(
      'current environment differs from auth.additional_redirect_urls and is currently active.'
    )
  })

  it('does not reserve space for unmanaged config', () => {
    const { container } = customRender(
      <GitHubConfigCallout state={{ status: 'unmanaged' }} className="mb-4" />
    )

    expect(screen.queryByText('Managed by config.toml')).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })

  it('removes the callout after its config becomes unmanaged', async () => {
    const { rerender } = customRender(
      <GitHubConfigCallout
        state={{
          status: 'managed',
          configPath: 'auth.site_url',
          githubValue: 'https://app.example.com',
        }}
      />
    )

    expect(screen.getByText('Managed by config.toml')).toBeInTheDocument()

    rerender(<GitHubConfigCallout state={{ status: 'unmanaged' }} />)

    await waitFor(() => {
      expect(screen.queryByText('Managed by config.toml')).not.toBeInTheDocument()
    })
  })
})
