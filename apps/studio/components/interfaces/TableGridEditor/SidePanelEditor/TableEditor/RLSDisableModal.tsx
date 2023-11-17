import Link from 'next/link'
import { Alert, Button, IconAlertOctagon, IconBookOpen, IconLock, IconShieldOff } from 'ui'

export default function RLSDisableModalContent() {
  return (
    <div className="my-6">
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
              <IconAlertOctagon />
              <span>All requests to this table will be accepted.</span>
            </li>

            <li className="flex gap-3">
              <IconShieldOff />
              <span>Auth policies will not be enforced.</span>
            </li>

            <li className="flex gap-3">
              <IconLock w={14} className="flex-shrink-0" />
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

        <div className="mt-3">
          <p className="mt-2">
            <Button asChild type="default" icon={<IconBookOpen strokeWidth={1.5} />}>
              <Link
                href="https://supabase.com/docs/guides/auth/row-level-security"
                target="_blank"
                rel="noreferrer"
              >
                RLS Documentation
              </Link>
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
