import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { cn } from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
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
        <p className="text-sm text-foreground-light">
          Use your direct connection string to backup your database, replacing{' '}
          <code className="text-code-inline !break-keep">{DB_PASSWORD_PLACEHOLDER}</code> with your
          database password. Percent-encode any reserved character in your password before using it
          in the URL
          <span className="inline-flex align-text-bottom ml-2">
            <InfoTooltip side="bottom" className="max-w-64">
              <p>Examples:</p>
              <ul className="list-disc pl-6">
                <li>
                  <span className="flex items-center gap-x-1">
                    <code className="text-code-inline">%</code>
                    <span>&nbsp;→&nbsp;</span>
                    <code className="text-code-inline">%25</code>
                  </span>
                </li>
                <li>
                  <span className="flex items-center gap-x-1">
                    <code className="text-code-inline">@</code>
                    <span>&nbsp;→&nbsp;</span>
                    <code className="text-code-inline">%40</code>
                  </span>
                </li>
                <li>
                  <span className="flex items-center gap-x-1">
                    <code className="text-code-inline">:</code>
                    <span>&nbsp;→&nbsp;</span>
                    <code className="text-code-inline">%3A</code>
                  </span>
                </li>
                <li>
                  <span className="flex items-center gap-x-1">
                    <code className="text-code-inline">/</code>
                    <span>&nbsp;→&nbsp;</span>
                    <code className="text-code-inline">%2F</code>
                  </span>
                </li>
                <li>
                  <span className="flex items-center gap-x-1">
                    <code className="text-code-inline">#</code>
                    <span>&nbsp;→&nbsp;</span>
                    <code className="text-code-inline">%23</code>
                  </span>
                </li>
              </ul>
            </InfoTooltip>
          </span>
        </p>
        <p className="text-sm text-foreground-light">
          See the{' '}
          <InlineLink href={`${DOCS_URL}/guides/platform/backups`}>Backup documentation</InlineLink>{' '}
          for details.
        </p>
      </div>

      {showResetPassword && (
        <ButtonTooltip
          variant="default"
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
