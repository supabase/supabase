import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { parseSupportRequestMessage, SupportRequestMessage } from './SupportRequestMessage'

describe('SupportRequestMessage', () => {
  it('parses support-tagged messages', () => {
    expect(
      parseSupportRequestMessage(`
        <support>
          <subject>Database unavailable</subject>
          <message>Connections are timing out</message>
        </support>
      `)
    ).toMatchObject({
      subject: 'Database unavailable',
      message: 'Connections are timing out',
    })
  })

  it('renders a structured support request summary', () => {
    render(
      <SupportRequestMessage
        request={{
          subject: 'Database unavailable',
          message: 'Connections are timing out',
          organization_slug: 'org-1',
          project_ref: 'project-1',
          category: 'Problem',
          severity: 'High',
          support_access: 'Granted',
          library: 'Not provided',
        }}
      />
    )

    expect(screen.getByText('Support request submitted')).toBeInTheDocument()
    expect(screen.getByText('Database unavailable')).toBeInTheDocument()
    expect(screen.getByText('Connections are timing out')).toBeInTheDocument()
    expect(screen.getByText('org-1')).toBeInTheDocument()
    expect(screen.getByText('project-1')).toBeInTheDocument()
    expect(screen.getByText('Granted')).toBeInTheDocument()
    expect(screen.queryByText('Client library')).not.toBeInTheDocument()
  })
})
