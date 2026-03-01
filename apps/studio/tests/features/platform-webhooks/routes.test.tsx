import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/router', () => ({
  useRouter: () => ({ query: { endpointId: 'test-endpoint-1' } }),
}))

vi.mock('components/interfaces/Platform/Webhooks', () => ({
  PlatformWebhooksPage: ({ scope, endpointId }: { scope: string; endpointId?: string }) => (
    <div>{`scope:${scope};endpoint:${endpointId ?? ''}`}</div>
  ),
}))

import OrgWebhookEndpointSettings from 'pages/org/[slug]/webhooks/[endpointId]'
import OrgWebhooksSettings from 'pages/org/[slug]/webhooks'
import ProjectWebhookEndpointSettings from 'pages/project/[ref]/settings/webhooks/[endpointId]'
import ProjectWebhooksSettings from 'pages/project/[ref]/settings/webhooks'

describe('Platform webhooks routes', () => {
  it('renders organization list page', () => {
    render(<OrgWebhooksSettings />)
    expect(screen.getByText('scope:organization;endpoint:')).toBeInTheDocument()
  })

  it('renders organization endpoint page', () => {
    render(<OrgWebhookEndpointSettings />)
    expect(screen.getByText('scope:organization;endpoint:test-endpoint-1')).toBeInTheDocument()
  })

  it('renders project list page', () => {
    render(<ProjectWebhooksSettings />)
    expect(screen.getByText('scope:project;endpoint:')).toBeInTheDocument()
  })

  it('renders project endpoint page', () => {
    render(<ProjectWebhookEndpointSettings />)
    expect(screen.getByText('scope:project;endpoint:test-endpoint-1')).toBeInTheDocument()
  })
})
