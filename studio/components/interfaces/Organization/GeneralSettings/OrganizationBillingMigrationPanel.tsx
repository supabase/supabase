import { observer } from 'mobx-react-lite'
import { Alert, Button, IconExternalLink } from 'ui'

import Panel from 'components/ui/Panel'
import MigrateOrganizationBillingButton from './MigrateOrganizationBillingButton'
import Link from 'next/link'

const OrganizationBillingMigrationPanel = observer(() => {
  return (
    <Panel
      title={
        <p key="panel-title" className="uppercase">
          Migrate to organization billing
        </p>
      }
    >
      <Panel.Content>
        <Alert
          withIcon
          variant="neutral"
          title={<span>Use the new organization-level billing</span>}
        >
          <p>Migrating to the new organization-level billing is irreversible.</p>

          <div className="flex mt-3 items-center space-x-4">
            <Link href="https://www.notion.so/supabase/Organization-Level-Billing-9c159d69375b4af095f0b67881276582?pvs=4">
              <a target="_blank" rel="noreferrer">
                <Button type="default" icon={<IconExternalLink strokeWidth={1.5}  />}>
                  Documentation
                </Button>
              </a>
            </Link>

            <MigrateOrganizationBillingButton />
          </div>
        </Alert>
      </Panel.Content>
    </Panel>
  )
})

export default OrganizationBillingMigrationPanel
