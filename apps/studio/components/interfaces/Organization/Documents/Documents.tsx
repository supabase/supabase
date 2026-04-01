import { Fragment } from 'react'

import { CustomDocument } from './CustomDocument'
import { DPA } from './DPA'
import { HIPAA } from './HIPAA'
import { SecurityQuestionnaire } from './SecurityQuestionnaire'
import { SOC2 } from './SOC2'
import { TIA } from './TIA'
import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldSection,
  ScaffoldSectionDetail,
} from '@/components/layouts/Scaffold'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'

export const Documents = () => {
  const { organizationLegalDocuments } = useCustomContent(['organization:legal_documents'])

  if (Array.isArray(organizationLegalDocuments)) {
    return organizationLegalDocuments.map((doc, idx) => {
      return (
        <Fragment key={doc.id}>
          <CustomDocument doc={doc} />
          {idx !== organizationLegalDocuments.length - 1 && <ScaffoldDivider />}
        </Fragment>
      )
    })
  }

  return (
    <>
      <ScaffoldContainer id="dpa" className="px-6 xl:px-10">
        <DPA />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer id="tia" className="px-6 xl:px-10">
        <TIA />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer id="soc2" className="px-6 xl:px-10">
        <SOC2 />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer id="hipaa" className="px-6 xl:px-10">
        <HIPAA />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer id="security-questionnaire" className="px-6 xl:px-10">
        <SecurityQuestionnaire />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer className="px-6 xl:px-10">
        <ScaffoldSection className="py-12">
          <ScaffoldSectionDetail className="col-span-full">
            <p className="text-sm text-foreground-light m-0">
              <SupportLink className={InlineLinkClassName}>Submit a support request</SupportLink> if
              you require additional documents for financial or tax reasons, such as a W-9 form.
            </p>
          </ScaffoldSectionDetail>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}
