import { useParams } from 'common'

import { InlineLink } from '@/components/ui/InlineLink'

export const JitDbAccessPreview = () => {
  const { ref = '_' } = useParams()

  return (
    <div>
      <p className="text-sm text-foreground-light mb-4">
        Grant project members temporary database role access through Just-in-Time (JIT) controls in{' '}
        <InlineLink href={`/project/${ref}/database/settings`}>Database Settings</InlineLink>.
      </p>
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Show JIT database access controls in Database Settings</li>
          <li>Allow configuring role grants and member-level JIT rules</li>
        </ul>
      </div>
    </div>
  )
}
