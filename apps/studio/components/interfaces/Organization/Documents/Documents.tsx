import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import DPA from './DPA'
import SecurityQuestionnaire from './SecurityQuestionnaire'
import SOC2 from './SOC2'
import HIPAA from './HIPAA'

const Documents = () => {
  return (
    <>
      <ScaffoldContainer id="dpa">
        <DPA />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer id="security-questionnaire">
        <SecurityQuestionnaire />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer id="soc2">
        <SOC2 />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer id="hipaa">
        <HIPAA />
      </ScaffoldContainer>
    </>
  )
}

export default Documents
