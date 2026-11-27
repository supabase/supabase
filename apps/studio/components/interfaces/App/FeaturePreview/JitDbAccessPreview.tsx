import { useParams } from 'common'

import { InlineLink } from '@/components/ui/InlineLink'

export const JitDbAccessPreview = () => {
  const { ref = '_' } = useParams()

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-light">
        Allow project members to connect to this database using access tokens. Manage their access
        in <InlineLink href={`/project/${ref}/database/settings`}>Database Settings</InlineLink>.
      </p>
      <div className="space-y-2">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Show member access controls under Token access in Database Settings</li>
          <li>Let you choose which database roles members can use and when their access expires</li>
        </ul>
      </div>
      <p className="text-sm text-foreground-light">Requires Postgres 17.6.1.081 or later.</p>
    </div>
  )
}
