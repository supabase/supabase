import { TroubleshootingAccordion } from './TroubleshootingAccordion'
import { RestartDatabaseTroubleshootingSection } from './TroubleshootingSections'

const ERROR_TYPE = 'unknown'

export function RestartTroubleshootingFallback() {
  return (
    <TroubleshootingAccordion
      errorType={ERROR_TYPE}
      stepTitles={{ 1: 'Try restarting your project' }}
    >
      <RestartDatabaseTroubleshootingSection number={1} errorType={ERROR_TYPE} />
    </TroubleshootingAccordion>
  )
}
