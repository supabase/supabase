import type { ReactNode } from 'react'

import { theme } from '../theme'
import { Body, Container, Head, Html, Preview, Section } from './Primitives'

interface EmailLayoutProps {
  /** The line clients show after the subject. Never a repeat of the subject. */
  preview: string
  /** Organization the notification is about. Compute quota is org-wide, so this is required. */
  organizationName: string
  children: ReactNode
  footerNote?: string
}

export const EmailLayout = ({
  preview,
  organizationName,
  children,
  footerNote,
}: EmailLayoutProps) => (
  <Html>
    <Head />
    <Body>
      <Preview>{preview}</Preview>
      <Container>
        <Section style={{ padding: '24px 32px 0' }}>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            <tbody>
              <tr>
                <td style={{ fontSize: '15px', fontWeight: 600, color: theme.foreground }}>
                  Supabase
                </td>
                <td align="right" style={{ fontSize: '13px', color: theme.foregroundLighter }}>
                  {organizationName}
                </td>
              </tr>
            </tbody>
          </table>
          <hr
            style={{
              margin: '20px 0 24px',
              border: 'none',
              borderTop: `1px solid ${theme.border}`,
            }}
          />
        </Section>

        {children}

        <Section style={{ padding: '8px 32px 28px' }}>
          <hr
            style={{ margin: '0 0 16px', border: 'none', borderTop: `1px solid ${theme.border}` }}
          />
          {footerNote && (
            <p
              style={{
                margin: '0 0 8px',
                fontSize: '12px',
                lineHeight: '18px',
                color: theme.foregroundLighter,
              }}
            >
              {footerNote}
            </p>
          )}
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              lineHeight: '18px',
              color: theme.foregroundLighter,
            }}
          >
            You receive usage and billing notices because you administer {organizationName}.{' '}
            <a
              href="https://supabase.com/dashboard/account/notifications"
              style={{ color: theme.foregroundLight }}
            >
              Manage notifications
            </a>
          </p>
        </Section>
      </Container>
    </Body>
  </Html>
)
