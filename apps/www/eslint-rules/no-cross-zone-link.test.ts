import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'

import noCrossZoneLink from './no-cross-zone-link.cjs'

RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
})

ruleTester.run('no-cross-zone-link', noCrossZoneLink, {
  valid: [
    'import Link from \'next/link\'; <Link href="/pricing" />',
    'import Link from \'next/link\'; <Link href="/dashboards" />',
    "import Link from 'next/link'; <Link href={href} />",
    '<a href="/dashboard/sign-up" />',
    'import Link from \'somewhere-else\'; <Link href="/dashboard" />',
  ],
  invalid: [
    {
      code: 'import Link from \'next/link\'; <Link href="/dashboard/sign-up" />',
      errors: [{ messageId: 'crossZone' }],
    },
    {
      code: 'import Link from \'next/link\'; <Link href="https://supabase.com/docs/guides/auth" />',
      errors: [{ messageId: 'crossZone' }],
    },
    {
      code: "import Link from 'next/link'; <Link href={`/docs/guides/${slug}`} />",
      errors: [{ messageId: 'crossZone' }],
    },
    {
      code: 'import NextLink from \'next/link\'; <NextLink href="/humans.txt" />',
      errors: [{ messageId: 'crossZone' }],
    },
  ],
})
