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
          assistant_context:
            'A support request has already been submitted and a human member of the Supabase Support team is already looking at it.',
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
    expect(screen.queryByText('org-1')).not.toBeInTheDocument()
    expect(screen.queryByText('project-1')).not.toBeInTheDocument()
    expect(screen.queryByText('Granted')).not.toBeInTheDocument()
    expect(screen.queryByText('Client library')).not.toBeInTheDocument()
    expect(screen.queryByText(/human member of the supabase support team/i)).not.toBeInTheDocument()
  })
})
