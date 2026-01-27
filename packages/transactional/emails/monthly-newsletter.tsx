import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface MonthlyNewsletterEmailProps {
  month?: string
  year?: string
  featuredArticles?: Array<{
    title: string
    description: string
    url: string
    imageUrl?: string
  }>
  productUpdates?: Array<{
    title: string
    description: string
    url?: string
  }>
  unsubscribeUrl?: string
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'https://supabase.com'

export const MonthlyNewsletterEmail = ({
  month = 'January',
  year = '2026',
  featuredArticles = [
    {
      title: 'New Vector Search Capabilities',
      description:
        'Discover how to build AI-powered applications with our enhanced vector search features.',
      url: `${baseUrl}/blog/vector-search`,
    },
    {
      title: 'Real-time Collaboration Made Easy',
      description:
        'Learn how teams are using Supabase Realtime to build collaborative experiences.',
      url: `${baseUrl}/blog/realtime-collaboration`,
    },
  ],
  productUpdates = [
    {
      title: 'Edge Functions Now Support Deno 2.0',
      description: 'Run your serverless functions with the latest Deno runtime.',
    },
    {
      title: 'New Database Branching UI',
      description: 'Create and manage database branches directly from the dashboard.',
    },
  ],
  unsubscribeUrl = `${baseUrl}/unsubscribe`,
}: MonthlyNewsletterEmailProps) => {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>
          Your monthly Supabase newsletter - {month} {year}
        </Preview>
        <Body style={main}>
          <Container style={container}>
            {/* Header */}
            <Section style={header}>
              <Row>
                <Column>
                  <Text style={headerText}>Supabase</Text>
                </Column>
              </Row>
            </Section>

            {/* Hero Section */}
            <Section style={heroSection}>
              <Heading style={heroHeading}>
                Your Monthly Supabase Update
              </Heading>
              <Text style={heroSubheading}>
                {month} {year} • What's new in the Supabase ecosystem
              </Text>
            </Section>

            <Hr style={divider} />

            {/* Featured Articles */}
            <Section style={section}>
              <Heading style={sectionHeading}>Featured Articles</Heading>
              {featuredArticles.map((article, index) => (
                <Section key={index} style={articleCard}>
                  {article.imageUrl && (
                    <Img
                      src={article.imageUrl}
                      alt={article.title}
                      width="100%"
                      height="200"
                      style={articleImage}
                    />
                  )}
                  <Heading style={articleTitle}>{article.title}</Heading>
                  <Text style={articleDescription}>{article.description}</Text>
                  <Button style={button} href={article.url}>
                    Read More →
                  </Button>
                </Section>
              ))}
            </Section>

            <Hr style={divider} />

            {/* Product Updates */}
            <Section style={section}>
              <Heading style={sectionHeading}>Product Updates</Heading>
              {productUpdates.map((update, index) => (
                <Section key={index} style={updateCard}>
                  <Heading style={updateTitle}>{update.title}</Heading>
                  <Text style={updateDescription}>{update.description}</Text>
                  {update.url && (
                    <Link href={update.url} style={link}>
                      Learn more →
                    </Link>
                  )}
                </Section>
              ))}
            </Section>

            <Hr style={divider} />

            {/* CTA Section */}
            <Section style={ctaSection}>
              <Text style={ctaText}>
                Ready to build something amazing?
              </Text>
              <Button style={ctaButton} href={`${baseUrl}/dashboard`}>
                Get Started
              </Button>
            </Section>

            {/* Footer */}
            <Section style={footer}>
              <Text style={footerText}>
                You're receiving this because you're subscribed to Supabase
                updates.
              </Text>
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Unsubscribe
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

export default MonthlyNewsletterEmail

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
  padding: '32px 40px',
}

const headerText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0',
}

const heroSection = {
  padding: '48px 40px',
  textAlign: 'center' as const,
}

const heroHeading = {
  color: '#0f172a',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0 0 8px 0',
  lineHeight: '1.2',
}

const heroSubheading = {
  color: '#64748b',
  fontSize: '16px',
  margin: '0',
}

const divider = {
  borderColor: '#e2e8f0',
  margin: '0',
}

const section = {
  padding: '40px',
}

const sectionHeading = {
  color: '#0f172a',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 24px 0',
}

const articleCard = {
  marginBottom: '32px',
  paddingBottom: '32px',
  borderBottom: '1px solid #e2e8f0',
}

const articleImage = {
  borderRadius: '8px',
  marginBottom: '16px',
  objectFit: 'cover' as const,
}

const articleTitle = {
  color: '#0f172a',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 8px 0',
}

const articleDescription = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0 0 16px 0',
}

const button = {
  backgroundColor: '#3ecf8e',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const updateCard = {
  marginBottom: '24px',
  paddingBottom: '24px',
  borderBottom: '1px solid #e2e8f0',
}

const updateTitle = {
  color: '#0f172a',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px 0',
}

const updateDescription = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
}

const link = {
  color: '#3ecf8e',
  fontSize: '15px',
  textDecoration: 'none',
}

const ctaSection = {
  backgroundColor: '#f8fafc',
  padding: '40px',
  textAlign: 'center' as const,
}

const ctaText = {
  color: '#0f172a',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 24px 0',
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

const footer = {
  padding: '32px 40px',
  textAlign: 'center' as const,
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
