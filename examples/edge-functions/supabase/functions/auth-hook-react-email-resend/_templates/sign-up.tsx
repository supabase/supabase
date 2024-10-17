import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface SignUpEmailProps {
  username: string
  lang: string
  token: string
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
}

/** Translations of the text for English */
const translationsEn = {
  confirm_email_address: 'Confirm your email address',
  h1: (username: string) => `Hi ${username}! Confirm your email address`,
  your_confirmation_code:
    'Thank you for signing up for Story. Please complete the email confirmation for full access.',
  click_here: 'Click here to confirm your email address',
  copy_and_paste: 'Or, copy and paste this temporary login code:',
  if_you_did_not_request:
    'If you did not request this email, there is nothing to worry about, you can safely ignore it.',
  blog: 'Our blog',
  policies: 'Policies',
  help_center: 'Help center',
  community: 'Community',
}

/** Translations of the text for Japanese */
const translationsJa = {
  confirm_email_address: 'メールアドレスの確認',
  h1: (username: string) => `${username}様ようこそ！メールアドレスの確認をお願いします`,
  your_confirmation_code:
    'Storyへの登録ありがとうございます。メールアドレスの確認を完了してください。',
  click_here: 'こちらをクリックしてメールアドレスの確認を完了させてください',
  copy_and_paste: 'それかこちらのログインコードを使ってWebサイトで認証を完了させてください。',
  if_you_did_not_request:
    'もしメールのリクエストをしていない場合は、無視していただいて構いません。',
  blog: 'ブログ',
  policies: 'ポリシー',
  help_center: 'ヘルプセンター',
  community: 'コミュニティ',
}

export const SignUpEmail = ({
  username,
  lang,
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: SignUpEmailProps) => {
  const translations = lang.includes('ja') ? translationsJa : translationsEn

  return (
    <Html>
      <Head />
      <Preview>{translations.confirm_email_address}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img src="https://welcome-five-ebon.vercel.app/logo.png" width="120" alt="Story" />
          </Section>
          <Heading style={h1}>{translations.h1(username)}</Heading>
          <Text style={heroText}>{translations.your_confirmation_code}</Text>

          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            target="_blank"
            style={{
              ...link,
              display: 'block',
              marginBottom: '16px',
            }}
          >
            {translations.click_here}
          </Link>
          <Text style={{ ...text, marginBottom: '14px' }}>{translations.copy_and_paste}</Text>

          <Section style={codeBox}>
            <Text style={confirmationCodeText}>{token}</Text>
          </Section>

          <Text style={text}>{translations.if_you_did_not_request}</Text>

          <Section>
            <Row style={footerLogos}>
              <Column style={{ width: '66%' }}>
                <Img src="https://welcome-five-ebon.vercel.app/logo.png" width="120" alt="Story" />
              </Column>
            </Row>
          </Section>

          <Section>
            <Link
              style={footerLink}
              href="https://dshukertjr.dev"
              target="_blank"
              rel="noopener noreferrer"
            >
              {translations.blog}
            </Link>
            &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
            <Link
              style={footerLink}
              href="https://dshukertjr.dev/legal"
              target="_blank"
              rel="noopener noreferrer"
            >
              {translations.policies}
            </Link>
            &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
            <Link
              style={footerLink}
              href="https://dshukertjr.dev/help"
              target="_blank"
              rel="noopener noreferrer"
            >
              {translations.help_center}
            </Link>
            &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
            <Link
              style={footerLink}
              href="https://dshukertjr.dev/community"
              target="_blank"
              rel="noopener noreferrer"
              data-auth="NotApplicable"
              data-linkindex="6"
            >
              {translations.community}
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

SignUpEmail.PreviewProps = {
  username: 'dshukertjr',
  token: '123456',
  supabase_url: 'https://123.supabase.co',
  email_action_type: 'confirm',
  redirect_to: 'https://dshukertjr.dev',
  token_hash: '123456',
} as SignUpEmailProps

export default SignUpEmail

const link = {
  color: '#2754C5',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  textDecoration: 'underline',
}

const footerLink = {
  color: '#ffffff',
  textDecoration: 'underline',
}

const footerLogos = {
  marginBottom: '32px',
  paddingLeft: '8px',
  paddingRight: '8px',
  width: '100%',
}

const main = {
  backgroundColor: '#fce7f3',
  margin: '0 auto',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
}

const container = {
  margin: '0 auto',
  padding: '0px 20px',
}

const logoContainer = {
  marginTop: '32px',
}

const h1 = {
  color: '#9333ea',
  fontSize: '36px',
  fontWeight: '700',
  margin: '30px 0',
  padding: '0',
  lineHeight: '42px',
}

const heroText = {
  fontSize: '20px',
  lineHeight: '28px',
  marginBottom: '30px',
}

const codeBox = {
  background: 'rgb(245, 244, 245)',
  borderRadius: '4px',
  marginBottom: '30px',
  padding: '40px 10px',
}

const confirmationCodeText = {
  fontSize: '30px',
  textAlign: 'center' as const,
  verticalAlign: 'middle',
}

const text = {
  color: '#000',
  fontSize: '14px',
  lineHeight: '24px',
}
