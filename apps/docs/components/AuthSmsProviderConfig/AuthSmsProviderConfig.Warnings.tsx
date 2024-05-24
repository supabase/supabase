import Link from 'next/link'
import { Admonition } from 'ui-patterns/admonition'

const CostWarning = () => (
  <Admonition type="warning">
    <p>
      To keep SMS sending costs under control, make sure you adjust your project&apos;s rate limits
      and <Link href="/guides/auth/auth-captcha">configure CAPTCHA</Link>. See the{' '}
      <Link href="/guides/platform/going-into-prod">Production Checklist</Link> to learn more.
    </p>
    <p>
      Some countries have special regulations for services that send SMS messages to users, for
      example, India&apos;s TRAI DLT regulations. Remember to look up and follow the regulations of
      countries where you operate.
    </p>
  </Admonition>
)

export { CostWarning }
