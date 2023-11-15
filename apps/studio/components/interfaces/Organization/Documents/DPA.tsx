import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { Button, IconExternalLink } from 'ui'

const DPA = () => {
  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail className="sticky space-y-6 top-12">
        <p className="text-base m-0">Data Processing Addendum (DPA)</p>
        <div className="space-y-2 text-sm text-foreground-light m-0">
          <p>
            All organizations can access and use our DPA as part of their GDPR compliance. Sign and
            return the signed DPA document to{' '}
            <a
              href="mailto:privacy@supabase.com"
              target="_blank"
              className="text-brand hover:text-brand"
            >
              privacy@supabase.com
            </a>{' '}
            for the document to be considered executed.
          </p>
          <p>
            This is only to access the document. Please ignore this if you have sent the signed
            document to us.
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent className="flex items-center justify-center h-full">
        <a
          href="https://supabase.com/downloads/docs/Supabase+DPA+230907.pdf"
          target="_blank"
          rel="noreferrer noopener"
          download={true}
        >
          <Button type="default" iconRight={<IconExternalLink />}>
            View DPA
          </Button>
        </a>
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}

export default DPA
