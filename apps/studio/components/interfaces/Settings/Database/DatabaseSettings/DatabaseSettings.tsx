import {
  ScaffoldSection,
  ScaffoldSectionTitle,
  ScaffoldSectionDescription,
} from 'components/layouts/Scaffold'
import { DatabaseReadOnlyAlert } from './DatabaseReadOnlyAlert'
import { ResetDbPassword } from './ResetDbPassword'

export const DatabaseSettings = () => {
  return (
    <ScaffoldSection id="database-settings" className="gap-6">
      <DatabaseReadOnlyAlert />
      <ResetDbPassword />
    </ScaffoldSection>
  )
}
