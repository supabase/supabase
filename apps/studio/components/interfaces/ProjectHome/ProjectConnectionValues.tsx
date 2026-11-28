import { useQuery } from '@tanstack/react-query'
import { CheckIcon, ChevronDownIcon, CopyIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Button,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { getConnectionOptions, type ConnectionOption } from './ProjectConnectionValues.utils'
import { useConnectionStringDatabases } from '@/components/interfaces/ConnectSheet/useConnectionStringDatabases'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { apiKeysQueryOptions, getKeys } from '@/data/api-keys/api-keys-query'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useDeploymentMode } from '@/hooks/misc/useDeploymentMode'
import { IS_PLATFORM } from '@/lib/constants'
import { useGrant } from '@/lib/grants'
import { useTrack } from '@/lib/telemetry/track'

type ValueType = 'project_url' | 'publishable_key' | ConnectionOption['valueType']

const COPY_BUTTON_CLASS = 'px-1.5 text-foreground-light hover:text-foreground'

const getPublishableKeyDescription = ({
  grantStatus,
  isLoadingKeys,
  publishableKey,
}: {
  grantStatus: 'loading' | 'granted' | 'denied' | 'error'
  isLoadingKeys: boolean
  publishableKey?: string
}) => {
  if (grantStatus === 'loading' || isLoadingKeys) return 'Loading publishable key...'
  if (grantStatus === 'denied') return "You don't have permission to view API keys."
  if (grantStatus === 'error') return 'Failed to check API key permissions'
  return publishableKey ?? 'Publishable key unavailable'
}

function useCopiedState() {
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!isCopied) return
    const timer = setTimeout(() => setIsCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [isCopied])

  return { isCopied, markCopied: () => setIsCopied(true) }
}

interface CopyValueButtonProps {
  label: string
  value: string
  /** The value when available, otherwise why it can't be copied */
  description: string
  isDisabled?: boolean
  onCopied: () => void
}

function CopyValueButton({
  label,
  value,
  description,
  isDisabled,
  onCopied,
}: CopyValueButtonProps) {
  const { isCopied, markCopied } = useCopiedState()

  return (
    <ButtonTooltip
      size="small"
      variant="text"
      className={COPY_BUTTON_CLASS}
      disabled={isDisabled}
      icon={isCopied ? <CheckIcon className="text-brand" /> : <CopyIcon />}
      onClick={() =>
        copyToClipboard(value, () => {
          markCopied()
          onCopied()
        })
      }
      tooltip={{ content: { side: 'bottom', className: 'max-w-96 break-all', text: description } }}
    >
      {label}
      <span className="sr-only" role="status" aria-live="polite">
        {isCopied ? ' copied' : ''}
      </span>
    </ButtonTooltip>
  )
}

/** Opens a menu of the project's connection strings, session pooler first. */
function ConnectionStringMenu({
  options,
  onCopied,
}: {
  options: ConnectionOption[]
  onCopied: (option: ConnectionOption) => void
}) {
  const { isCopied, markCopied } = useCopiedState()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="small"
          variant="text"
          className={COPY_BUTTON_CLASS}
          icon={isCopied ? <CheckIcon className="text-brand" /> : <CopyIcon />}
          iconRight={<ChevronDownIcon />}
        >
          Connection string
          <span className="sr-only" role="status" aria-live="polite">
            {isCopied ? ' copied' : ''}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.valueType}
            className="flex-col items-start gap-0"
            onSelect={() =>
              copyToClipboard(option.uri, () => {
                markCopied()
                onCopied(option)
              })
            }
          >
            <span className="text-foreground">{option.label}</span>
            <span className="text-foreground-lighter">{option.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface ProjectConnectionValuesProps {
  projectRef?: string
}

/** The values people copy most when connecting, in one row under the project title. */
export const ProjectConnectionValues = ({ projectRef }: ProjectConnectionValuesProps) => {
  const track = useTrack()
  const deploymentMode = useDeploymentMode()

  const apiKeysGrant = useGrant('GET /v1/projects/{ref}/api-keys', { projectRef })
  const { data: projectUrl, isPending: isLoadingApiUrl } = useProjectApiUrl({ projectRef })
  const { data: apiKeys, isLoading: isLoadingKeys } = useQuery(
    apiKeysQueryOptions({ projectRef, grant: apiKeysGrant.grant }, { select: getKeys })
  )
  const publishableKey = apiKeys?.publishableKey?.api_key

  const connectionStringsByDatabase = useConnectionStringDatabases(deploymentMode)
  const connectionOptions = IS_PLATFORM
    ? getConnectionOptions(projectRef ? connectionStringsByDatabase[projectRef] : undefined)
    : []

  // Self-hosted projects may not have a publishable key configured, so hide it there when missing
  const showPublishableKey = IS_PLATFORM || !!publishableKey

  const trackCopy = (valueType: ValueType) => track('home_connection_value_copied', { valueType })

  if (isLoadingApiUrl) return <ShimmeringLoader className="mt-3 w-80" />

  return (
    <div className="-ml-1.5 mt-3 flex flex-wrap items-center gap-1">
      <CopyValueButton
        label="Project URL"
        value={projectUrl ?? ''}
        description={projectUrl ?? 'Project URL unavailable'}
        isDisabled={!projectUrl}
        onCopied={() => trackCopy('project_url')}
      />
      {showPublishableKey && (
        <CopyValueButton
          label="Publishable key"
          value={publishableKey ?? ''}
          description={getPublishableKeyDescription({
            grantStatus: apiKeysGrant.status,
            isLoadingKeys,
            publishableKey,
          })}
          isDisabled={isLoadingKeys || apiKeysGrant.status !== 'granted' || !publishableKey}
          onCopied={() => trackCopy('publishable_key')}
        />
      )}
      {connectionOptions.length > 0 && (
        <ConnectionStringMenu
          options={connectionOptions}
          onCopied={(option) => trackCopy(option.valueType)}
        />
      )}
    </div>
  )
}
