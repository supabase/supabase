import { Fragment } from 'react'
import { Separator } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { CustomDocument } from './CustomDocument'
import { DPA } from './DPA'
import { HIPAA } from './HIPAA'
import { ISO27001 } from './ISO27001'
import { SecurityQuestionnaire } from './SecurityQuestionnaire'
import { SOC2 } from './SOC2'
import { TIA } from './TIA'
import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'

export const Documents = () => {
  const { organizationLegalDocuments } = useCustomContent(['organization:legal_documents'])

  if (Array.isArray(organizationLegalDocuments)) {
    return organizationLegalDocuments.map((doc, idx) => {
      return (
        <Fragment key={doc.id}>
          <CustomDocument doc={doc} />
          {idx !== organizationLegalDocuments.length - 1 && <Separator />}
        </Fragment>
      )
    })
  }

  return (
    <>
      <PageContainer id="dpa">
        <DPA />
      </PageContainer>

      <Separator />

      <PageContainer id="tia">
        <TIA />
      </PageContainer>

      <Separator />

      <PageContainer id="soc2">
        <SOC2 />
      </PageContainer>

      <Separator />

      <PageContainer id="iso27001">
        <ISO27001 />
      </PageContainer>

      <Separator />

      <PageContainer id="hipaa">
        <HIPAA />
      </PageContainer>

      <Separator />

      <PageContainer id="security-questionnaire">
        <SecurityQuestionnaire />
      </PageContainer>

      <Separator />

      <PageContainer>
        <PageSection>
          <PageSectionContent>
            <p className="text-sm text-foreground-light m-0">
              <SupportLink className={InlineLinkClassName}>Submit a support request</SupportLink> if
              you require additional documents for financial or tax reasons, such as a W-9 form.
            </p>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}
