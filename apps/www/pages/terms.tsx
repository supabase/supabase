import SectionContainer from '~/components/Layouts/SectionContainer'
import LegalDocVersions, { type LegalDocVersion } from '~/components/Legal/LegalDocVersions'
import V1 from '~/data/legal/terms/v1.mdx'
import V2 from '~/data/legal/terms/v2.mdx'
import Layout from '~/layouts/Layout'

const meta = {
  title: 'Terms of Service',
  description: 'Supabase Terms of Service',
}

const versions: LegalDocVersion[] = [
  { id: 'v2', label: 'Version 2', effectiveDate: 'May 1, 2026', Component: V2 },
  { id: 'v1', label: 'Version 1', effectiveDate: 'July 11, 2025', Component: V1 },
]

export default function TermsPage() {
  return (
    <Layout meta={meta}>
      <SectionContainer>
        <h1>Terms of service</h1>
        <LegalDocVersions versions={versions} />
      </SectionContainer>
    </Layout>
  )
}
