interface TemplateDefault {
  subject: string
  heading: string
  body: string
}

const TEMPLATE_DEFAULTS: Record<string, TemplateDefault> = {
  confirmation: {
    subject: 'Confirm Your Signup',
    heading: 'Confirm your signup',
    body: `      <Text style={text}>Follow this link to confirm your user:</Text>
      <Text style={text}>
        <Link href={props.confirmationURL} style={link}>
          Confirm your mail
        </Link>
      </Text>`,
  },
  invite: {
    subject: 'You have been invited',
    heading: 'You have been invited',
    body: `      <Text style={text}>
        You have been invited to create a user on {props.siteURL}. Follow this link to accept the
        invite:
      </Text>
      <Text style={text}>
        <Link href={props.confirmationURL} style={link}>
          Accept the invite
        </Link>
      </Text>`,
  },
  magic_link: {
    subject: 'Your Magic Link',
    heading: 'Magic Link',
    body: `      <Text style={text}>Follow this link to login:</Text>
      <Text style={text}>
        <Link href={props.confirmationURL} style={link}>
          Log In
        </Link>
      </Text>`,
  },
  email_change: {
    subject: 'Confirm Email Change',
    heading: 'Confirm Change of Email',
    body: `      <Text style={text}>
        Follow this link to confirm the update of your email from {props.email} to {props.newEmail}:
      </Text>
      <Text style={text}>
        <Link href={props.confirmationURL} style={link}>
          Change Email
        </Link>
      </Text>`,
  },
  recovery: {
    subject: 'Reset Your Password',
    heading: 'Reset Password',
    body: `      <Text style={text}>Follow this link to reset the password for your user:</Text>
      <Text style={text}>
        <Link href={props.confirmationURL} style={link}>
          Reset Password
        </Link>
      </Text>`,
  },
  reauthentication: {
    subject: 'Confirm Reauthentication',
    heading: 'Confirm reauthentication',
    body: `      <Text style={text}>Enter the code: {props.token}</Text>`,
  },
  password_changed_notification: {
    subject: 'Your password has been changed',
    heading: 'Your password has been changed',
    body: `      <Text style={text}>
        This is a confirmation that the password for your account {props.email} has just been
        changed.
      </Text>
      <Text style={text}>If you did not make this change, please contact support.</Text>`,
  },
  email_changed_notification: {
    subject: 'Your email address has been changed',
    heading: 'Your email address has been changed',
    body: `      <Text style={text}>
        The email address for your account has been changed from {props.oldEmail} to {props.email}.
      </Text>
      <Text style={text}>If you did not make this change, please contact support.</Text>`,
  },
  phone_changed_notification: {
    subject: 'Your phone number has been changed',
    heading: 'Your phone number has been changed',
    body: `      <Text style={text}>
        The phone number for your account {props.email} has been changed from {props.oldPhone} to{' '}
        {props.phone}.
      </Text>
      <Text style={text}>If you did not make this change, please contact support immediately.</Text>`,
  },
  identity_linked_notification: {
    subject: 'A new identity has been linked',
    heading: 'A new identity has been linked',
    body: `      <Text style={text}>
        A new identity ({props.provider}) has been linked to your account {props.email}.
      </Text>
      <Text style={text}>If you did not make this change, please contact support immediately.</Text>`,
  },
  identity_unlinked_notification: {
    subject: 'An identity has been unlinked',
    heading: 'An identity has been unlinked',
    body: `      <Text style={text}>
        An identity ({props.provider}) has been unlinked from your account {props.email}.
      </Text>
      <Text style={text}>If you did not make this change, please contact support immediately.</Text>`,
  },
  mfa_factor_enrolled_notification: {
    subject: 'A new MFA factor has been enrolled',
    heading: 'A new MFA factor has been enrolled',
    body: `      <Text style={text}>
        A new factor ({props.factorType}) has been enrolled for your account {props.email}.
      </Text>
      <Text style={text}>If you did not make this change, please contact support immediately.</Text>`,
  },
  mfa_factor_unenrolled_notification: {
    subject: 'An MFA factor has been unenrolled',
    heading: 'An MFA factor has been unenrolled',
    body: `      <Text style={text}>
        A factor ({props.factorType}) has been unenrolled for your account {props.email}.
      </Text>
      <Text style={text}>If you did not make this change, please contact support immediately.</Text>`,
  },
}

function buildSource({ heading, body }: TemplateDefault): string {
  return `import { Body, Container, Head, Heading, Html, Link, Text } from '@react-email/components'

interface TemplateProps {
  confirmationURL: string
  token: string
  tokenHash: string
  siteURL: string
  email: string
  newEmail: string
  redirectTo: string
  data: string
  oldEmail: string
  phone: string
  oldPhone: string
  provider: string
  factorType: string
}

export default function Email(props: TemplateProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h2}>${heading}</Heading>
${body}
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '24px', margin: '0 auto' }
const h2 = { color: '#1d1c1d', fontSize: '20px', fontWeight: 700, margin: '16px 0' }
const text = { color: '#1d1c1d', fontSize: '14px', lineHeight: '22px' }
const link = { color: '#3ecf8e', textDecoration: 'underline' }
`
}

export function defaultReactEmailSource(templateType: string): string | null {
  const template = TEMPLATE_DEFAULTS[templateType]
  return template ? buildSource(template) : null
}

export function defaultEmailSubject(templateType: string): string | null {
  return TEMPLATE_DEFAULTS[templateType]?.subject ?? null
}
