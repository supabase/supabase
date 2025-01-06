import { AlertDescription_Shadcn_, Alert_Shadcn_ } from 'ui'
import { WarningIcon } from 'ui'

const BackupsStorageAlert = () => {
  return (
    <Alert_Shadcn_ variant="default">
      <WarningIcon />
      <AlertDescription_Shadcn_>
        Database backups do not include objects stored via the Storage API, as the database only
        includes metadata about these objects. Restoring an old backup does not restore objects that
        have been deleted since then.
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export default BackupsStorageAlert
