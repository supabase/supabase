import { ScaffoldContainer, ScaffoldDivider, ScaffoldSection } from 'components/layouts/Scaffold'
import DPA from './DPA'
import TIA from './TIA'
import SecurityQuestionnaire from './SecurityQuestionnaire'
import SOC2 from './SOC2'
import HIPAA from './HIPAA'
import Link from 'next/link'

const Documents = () => {
  return (
    <>
      <ScaffoldContainer id="dpa">
        <DPA />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer id="tia">
        <TIA />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer id="soc2">
        <SOC2 />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer id="hipaa">
        <HIPAA />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer id="security-questionnaire">
        <SecurityQuestionnaire />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer>
        <ScaffoldSection>
          <p className="sticky space-y-6 top-12 text-sm text-foreground-light m-0 whitespace-nowrap">
            <Link href="/support/new" className="hover:underline">
              Submit a support request
            </Link>{' '}
            if you require additional documents for financial or tax reasons, such as a W-9 form.
          </p>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}

export default Documents
