import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { cn } from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  buildDirectPostgresConnectionUri,
  buildLogicalBackupShellScript,
  DB_PASSWORD_PLACEHOLDER,
} from './LogicalBackupCliInstructions.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { InlineLink } from '@/components/ui/InlineLink'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

export type LogicalBackupCliInstructionsProps = {
  enabled?: boolean
  className?: string
  showResetPassword?: boolean
  note?: string
}

export const LogicalBackupCliInstructions = ({
  enabled = true,
  className,
  showResetPassword = true,
  note,
}: LogicalBackupCliInstructionsProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { can: canResetDbPassword } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  const {
    data: settings,
    isSuccess,
    isError,
  } = useProjectSettingsV2Query({ projectRef: ref }, { enabled: enabled && Boolean(ref) })

  const connectionUri =
    isSuccess && settings
      ? buildDirectPostgresConnectionUri({
          db_user: settings.db_user,
          db_host: settings.db_host,
          db_port: settings.db_port,
          db_name: settings.db_name,
        })
      : null

  const shellScript = connectionUri ? buildLogicalBackupShellScript(connectionUri) : ''

  const resetPasswordHref = ref ? `/project/${ref}/database/settings#database-password` : '#'
  const resetDisabled = !canResetDbPassword

  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Back up your database with the Supabase CLI</h4>
        <p className="text-sm text-foreground-light">
          Use your direct connection string — replace {DB_PASSWORD_PLACEHOLDER} with your database
          password.{' '}
          <InlineLink href={`${DOCS_URL}/guides/platform/backups`}>Backup documentation</InlineLink>
          .
        </p>
        <p className="text-sm text-foreground-light">
          Any reserved character in your password must be percent-encoded in the URL (e.g.{' '}
          <code>@</code>&nbsp;→&nbsp;<code>%40</code>, <code>:</code>&nbsp;→&nbsp;<code>%3A</code>,{' '}
          <code>/</code>&nbsp;→&nbsp;<code>%2F</code>, <code>#</code>&nbsp;→&nbsp;<code>%23</code>).
          Encode <code>%</code> as <code>%25</code> first.
        </p>
      </div>

      {showResetPassword && (
        <ButtonTooltip
          type="default"
          disabled={resetDisabled}
          onClick={() => {
            if (!resetDisabled && ref) {
              void router.push(`/project/${ref}/database/settings#database-password`)
            }
          }}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canResetDbPassword
                ? 'You need additional permissions to reset the database password'
                : undefined,
            },
          }}
        >
          Reset database password
        </ButtonTooltip>
      )}

      {note && <p className="text-sm text-foreground-light">{note}</p>}

      {isError && (
        <p className="text-sm text-foreground-light">
          Could not load connection details. Open{' '}
          <InlineLink href={resetPasswordHref}>Database settings</InlineLink> to copy your
          connection string manually.
        </p>
      )}

      {!isError && !connectionUri && <ShimmeringLoader className="py-4" />}

      {connectionUri ? (
        <CodeBlock
          language="bash"
          value={shellScript}
          hideLineNumbers
          className="[&_code]:text-[12px] [&_code]:text-foreground"
          wrapperClassName="[&_pre]:px-4 [&_pre]:py-3"
        />
      ) : null}
    </div>
  )
}
