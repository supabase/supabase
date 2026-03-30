import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { CustomContentTypes } from 'hooks/custom-content/CustomContent.types'
import { ExternalLink } from 'lucide-react'
import { Button } from 'ui'

interface CustomDocumentProps {
  doc: CustomContentTypes['organizationLegalDocuments'][number]
}

export const CustomDocument = ({ doc }: CustomDocumentProps) => {
  return (
    <ScaffoldContainer id={doc.id}>
      <ScaffoldSection className="py-12">
        <ScaffoldSectionDetail>
          <p className="text-base m-0">{doc.name}</p>
          <div className="space-y-2 text-sm text-foreground-light [&_p]:m-0">
            <p>{doc.description}</p>
          </div>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          <div className="@lg:flex items-center justify-center h-full">
            <Button asChild type="default" iconRight={<ExternalLink />}>
              <a download href={doc.action.url} target="_blank" rel="noreferrer noopener">
                {doc.action.text}
              </a>
            </Button>
          </div>
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
