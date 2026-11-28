import { TroubleshootingAccordion } from '../TroubleshootingAccordion'
import { TroubleshootingGuideSection } from '../TroubleshootingSections'
import { DOCS_URL } from '@/lib/constants'

const ERROR_TYPE = 'supavisor-session-pool'

export function SupavisorSessionPoolTroubleshooting() {
  return (
    <TroubleshootingAccordion
      errorType={ERROR_TYPE}
      stepTitles={{ 1: 'Increase the Supavisor pool size' }}
    >
      <TroubleshootingGuideSection
        number={1}
        errorType={ERROR_TYPE}
        title="Increase the Supavisor pool size"
        description="In session mode, each client holds a database connection, so the maximum number of clients is limited by pool_size. Increase the pool size in Database Settings."
        href={`${DOCS_URL}/guides/database/connection-management#configuring-supavisors-pool-size`}
      />
    </TroubleshootingAccordion>
  )
}
