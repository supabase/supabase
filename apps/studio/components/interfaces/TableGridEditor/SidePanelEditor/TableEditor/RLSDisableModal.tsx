import { AlertOctagon, Lock, ShieldOff } from 'lucide-react'

import { DocsButton } from 'components/ui/DocsButton'
import { Alert } from 'ui'

export default function RLSDisableModalContent() {
  return (
    <div className="text-sm text-foreground-light grid gap-4">
      <div className="grid gap-1">
        <Alert
          variant="warning"
          className="!px-4 !py-3"
          title="This table will be publicly readable and writable"
          withIcon
        >
          <p>Anyone can edit or delete data in this table.</p>
        </Alert>
        <ul className="mt-4 space-y-5">
          <li className="flex gap-3">
            <AlertOctagon />
            <span>All requests to this table will be accepted.</span>
          </li>

          <li className="flex gap-3">
            <ShieldOff />
            <span>Auth policies will not be enforced.</span>
          </li>

          <li className="flex gap-3">
            <Lock size={14} className="flex-shrink-0" />
            <div>
              <strong>Before you turn off Row Level Security, consider:</strong>
              <ul className="space-y-2 mt-2">
                <li className="list-disc ml-4">
                  Any personal information in this table will be publicly accessible.
                </li>
                <li className="list-disc ml-4">
                  Anyone will be able to modify, add or delete any row in this table.
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>

      <DocsButton
        abbrev={false}
        className="w-min mt-3"
        href="https://supabase.com/docs/guides/auth/row-level-security"
      />
    </div>
  )
}
