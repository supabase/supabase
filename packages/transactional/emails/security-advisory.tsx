import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface SecurityAdvisoryEmailProps {
  userName?: string
  projects?: Array<{
    name: string
    projectId: string
    issues: Array<{
      severity: 'critical' | 'high' | 'medium'
      title: string
      description: string
      fixUrl?: string
    }>
  }>
  dashboardUrl?: string
  unsubscribeUrl?: string
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'https://supabase.com'

export const SecurityAdvisoryEmail = ({
  userName = 'there',
  projects = [
    {
      name: 'My Production App',
      projectId: 'abcdefghijklmnop',
      issues: [
        {
          severity: 'critical',
          title: 'Outdated PostgreSQL version',
          description:
            'Your database is running PostgreSQL 14.5, which has known security vulnerabilities. Please upgrade to 15.3 or later.',
          fixUrl: `${baseUrl}/project/abcdefghijklmnop/settings/database`,
        },
        {
          severity: 'high',
          title: 'API keys exposed in client-side code',
          description:
            'We detected your anon key being used in a public repository. Please rotate your keys immediately.',
          fixUrl: `${baseUrl}/project/abcdefghijklmnop/settings/api`,
        },
      ],
    },
    {
      name: 'Staging Environment',
      projectId: 'qrstuvwxyz123456',
      issues: [
        {
          severity: 'medium',
          title: 'Weak password policy',
          description:
            'Your authentication settings allow passwords shorter than 8 characters. Consider enforcing stronger password requirements.',
          fixUrl: `${baseUrl}/project/qrstuvwxyz123456/auth/policies`,
        },
      ],
    },
  ],
  dashboardUrl = `${baseUrl}/dashboard`,
  unsubscribeUrl = `${baseUrl}/unsubscribe`,
}: SecurityAdvisoryEmailProps) => {
  const totalIssues = projects.reduce(
    (sum, project) => sum + project.issues.length,
    0
  )
  const criticalIssues = projects.reduce(
    (sum, project) =>
      sum + project.issues.filter((i) => i.severity === 'critical').length,
    0
  )

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#ef4444'
      case 'high':
        return '#f59e0b'
      case 'medium':
        return '#3b82f6'
      default:
        return '#64748b'
    }
  }

  const getSeverityLabel = (severity: string) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1)
  }

  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>
          Security Advisory: {totalIssues} security issue
          {totalIssues !== 1 ? 's' : ''} require
          {totalIssues === 1 ? 's' : ''} your attention
        </Preview>
        <Body style={main}>
          <Container style={container}>
            {/* Header */}
            <Section style={header}>
              <Row>
                <Column>
                  <Text style={headerText}>Supabase Security</Text>
                </Column>
              </Row>
            </Section>

            {/* Alert Banner */}
            <Section style={alertBanner}>
              <Text style={alertText}>
                ⚠️ {criticalIssues > 0 && `${criticalIssues} critical `}
                Security Issue{totalIssues !== 1 ? 's' : ''} Detected
              </Text>
            </Section>

            {/* Main Content */}
            <Section style={contentSection}>
              <Heading style={heading}>Security Advisory</Heading>
              <Text style={greeting}>Hi {userName},</Text>
              <Text style={bodyText}>
                We've detected {totalIssues} security issue
                {totalIssues !== 1 ? 's' : ''} across{' '}
                {projects.length} of your project
                {projects.length !== 1 ? 's' : ''} that require
                {totalIssues === 1 ? 's' : ''} your immediate attention.
              </Text>

              {/* Projects List */}
              {projects.map((project, projectIndex) => (
                <Section key={projectIndex} style={projectCard}>
                  <Heading style={projectName}>{project.name}</Heading>
                  <Text style={projectId}>Project ID: {project.projectId}</Text>

                  {project.issues.map((issue, issueIndex) => (
                    <Section key={issueIndex} style={issueCard}>
                      <Row>
                        <Column style={severityBadgeContainer}>
                          <Text
                            style={{
                              ...severityBadge,
                              backgroundColor: getSeverityColor(issue.severity),
                            }}
                          >
                            {getSeverityLabel(issue.severity)}
                          </Text>
                        </Column>
                        <Column style={issueContent}>
                          <Heading style={issueTitle}>{issue.title}</Heading>
                          <Text style={issueDescription}>
                            {issue.description}
                          </Text>
                          {issue.fixUrl && (
                            <Button style={fixButton} href={issue.fixUrl}>
                              Fix Now →
                            </Button>
                          )}
                        </Column>
                      </Row>
                    </Section>
                  ))}
                </Section>
              ))}

              {/* CTA */}
              <Section style={ctaSection}>
                <Button style={ctaButton} href={dashboardUrl}>
                  View All Projects in Dashboard
                </Button>
              </Section>

              <Hr style={divider} />

              {/* Additional Info */}
              <Section style={infoSection}>
                <Text style={infoHeading}>What you should do:</Text>
                <Text style={infoText}>
                  • Review and address all issues listed above
                  <br />
                  • Critical and high severity issues should be resolved
                  immediately
                  <br />
                  • Consider enabling automated security scanning in your
                  project settings
                </Text>
              </Section>
            </Section>

            {/* Footer */}
            <Section style={footer}>
              <Text style={footerText}>
                This is an automated security advisory from Supabase. If you
                have questions, please contact our support team.
              </Text>
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Unsubscribe from security advisories
              </Link>
              <Text style={footerText}>
                Supabase Inc. • San Francisco, CA
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  )
}

export default SecurityAdvisoryEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
}

const header = {
  backgroundColor: '#1e293b',
  padding: '24px 40px',
}

const headerText = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0',
}

const alertBanner = {
  backgroundColor: '#fef2f2',
  borderLeft: '4px solid #ef4444',
  padding: '16px 40px',
}

const alertText = {
  color: '#991b1b',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
}

const contentSection = {
  padding: '40px',
}

const heading = {
  color: '#0f172a',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 16px 0',
}

const greeting = {
  color: '#0f172a',
  fontSize: '16px',
  margin: '0 0 16px 0',
}

const bodyText = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 32px 0',
}

const projectCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '24px',
  border: '1px solid #e2e8f0',
}

const projectName = {
  color: '#0f172a',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 4px 0',
}

const projectId = {
  color: '#64748b',
  fontSize: '14px',
  fontFamily: 'monospace',
  margin: '0 0 16px 0',
}

const issueCard = {
  backgroundColor: '#ffffff',
  borderRadius: '6px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid #e2e8f0',
}

const severityBadgeContainer = {
  width: '80px',
  verticalAlign: 'top' as const,
}

const severityBadge = {
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  padding: '4px 8px',
  borderRadius: '4px',
  display: 'inline-block',
  margin: '0',
}

const issueContent = {
  paddingLeft: '12px',
}

const issueTitle = {
  color: '#0f172a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
}

const issueDescription = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0 0 12px 0',
}

const fixButton = {
  backgroundColor: '#3ecf8e',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '8px 16px',
}

const ctaSection = {
  textAlign: 'center' as const,
  marginTop: '32px',
}

const ctaButton = {
  backgroundColor: '#3ecf8e',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
}

const divider = {
  borderColor: '#e2e8f0',
  margin: '32px 0',
}

const infoSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '6px',
  padding: '20px',
}

const infoHeading = {
  color: '#0f172a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px 0',
}

const infoText = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
}

const footer = {
  padding: '32px 40px',
  textAlign: 'center' as const,
  backgroundColor: '#f8fafc',
}

const footerText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
}

const unsubscribeLink = {
  color: '#64748b',
  fontSize: '14px',
  textDecoration: 'underline',
  margin: '0 0 16px 0',
  display: 'inline-block',
}
