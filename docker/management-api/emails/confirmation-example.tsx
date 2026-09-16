import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

type GoTrueTemplateProps = {
  confirmationURL: string
  token: string
  tokenHash: string
  siteURL: string
  email: string
  newEmail: string
  redirectTo: string
  data: string
}

export default function ConfirmationEmail({ confirmationURL, siteURL }: GoTrueTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your email address</Preview>
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '8px' }}>
          <Heading as="h2">Confirm your signup</Heading>
          <Text>Follow this link to confirm your account on {siteURL}:</Text>
          <Section>
            <Button
              href={confirmationURL}
              style={{
                backgroundColor: '#3ecf8e',
                color: '#ffffff',
                padding: '12px 20px',
                borderRadius: '6px',
              }}
            >
              Confirm your email
            </Button>
          </Section>
          <Text style={{ color: '#6b7280', fontSize: '12px' }}>
            If you didn't request this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
