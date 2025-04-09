import { ExternalLink } from 'lucide-react'

import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { Button } from 'ui'

const DPA = () => {
  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail className="sticky space-y-6 top-12">
        <p className="text-base m-0">Data Processing Addendum (DPA)</p>
        <div className="space-y-2 text-sm text-foreground-light m-0">
          <p>
            All organizations can access and use our DPA as part of their GDPR compliance. This is
            only to access the document. Please ignore this if you have sent the signed document to
            us.
          </p>
          <p>
            Please review these details and add data specific to user processing where required.
            Sign and return the signed DPA document to{' '}
            <a
              href="mailto:privacy@supabase.com"
              target="_blank"
              className="text-brand hover:text-brand"
            >
              privacy@supabase.com
            </a>{' '}
            for the document to be considered executed.
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent className="flex items-center justify-center h-full">
        <Button asChild type="default" iconRight={<ExternalLink />}>
          <a
            download={true}
            target="_blank"
            rel="noreferrer noopener"
            href="https://supabase.com/downloads/docs/Supabase+DPA+250314.pdf"
          >
            View DPA
          </a>
        </Button>
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}

export default DPA
