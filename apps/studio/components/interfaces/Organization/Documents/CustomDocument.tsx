import { ExternalLinkIcon } from 'lucide-react'
import { Button } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { CustomContentTypes } from '@/hooks/custom-content/CustomContent.types'

interface CustomDocumentProps {
  doc: CustomContentTypes['organizationLegalDocuments'][number]
}

export const CustomDocument = ({ doc }: CustomDocumentProps) => {
  return (
    <PageContainer id={doc.id}>
      <PageSection orientation="horizontal">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>{doc.name}</PageSectionTitle>
            <PageSectionDescription>{doc.description}</PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <div className="@lg:flex items-center justify-center h-full">
            <Button asChild iconRight={<ExternalLinkIcon />}>
              <a download href={doc.action.url} target="_blank" rel="noreferrer noopener">
                {doc.action.text}
              </a>
            </Button>
          </div>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
