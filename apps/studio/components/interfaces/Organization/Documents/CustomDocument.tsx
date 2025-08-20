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
      <ScaffoldSection>
        <ScaffoldSectionDetail className="sticky top-12 flex flex-col gap-y-8">
          <p className="text-base m-0">{doc.name}</p>
          <p className="text-sm text-foreground-light m-0">{doc.description}</p>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent className="flex items-center justify-center h-full">
          <Button asChild type="default" iconRight={<ExternalLink />}>
            <a download href={doc.action.url} target="_blank" rel="noreferrer noopener">
              {doc.action.text}
            </a>
          </Button>
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
