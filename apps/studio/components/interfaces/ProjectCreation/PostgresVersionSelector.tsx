import { useEffect } from 'react'
import { ControllerRenderProps, UseFormReturn } from 'react-hook-form'

import { useProjectCreationPostgresVersionsQuery } from 'data/config/project-creation-postgres-versions-query'
import { useProjectUnpausePostgresVersionsQuery } from 'data/config/project-unpause-postgres-versions-query'
import { PostgresEngine, ReleaseChannel } from 'data/projects/new-project.constants'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { CloudProvider } from 'shared-data'
import {
  Badge,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { smartRegionToExactRegion } from './ProjectCreation.utils'

interface PostgresVersionDetails {
  postgresEngine: PostgresEngine | undefined
  releaseChannel: ReleaseChannel | undefined
}

interface PostgresVersionSelectorProps {
  cloudProvider: CloudProvider
  dbRegion: string
  organizationSlug: string | undefined
  field: ControllerRenderProps<any, 'postgresVersionSelection'>
  form: UseFormReturn<any>
  type?: 'create' | 'unpause'
  layout?: 'vertical' | 'horizontal'
  label?: string
}

const formatValue = ({
  postgres_engine,
  release_channel,
}: {
  postgres_engine: string
  release_channel: string
}) => {
  return `${postgres_engine}|${release_channel}`
}

export const extractPostgresVersionDetails = (value: string): PostgresVersionDetails => {
  if (!value) {
    return { postgresEngine: undefined, releaseChannel: undefined }
  }

  const [postgresEngine, releaseChannel] = value.split('|')
  return { postgresEngine, releaseChannel } as PostgresVersionDetails
}

export const PostgresVersionSelector = ({
  cloudProvider,
  dbRegion,
  organizationSlug,
  field,
  form,
  type = 'create',
  layout = 'horizontal',
  label = 'Postgres version',
}: PostgresVersionSelectorProps) => {
  const { data: project } = useSelectedProjectQuery()

  const dbRegionExact = smartRegionToExactRegion(dbRegion)

  const {
    data: createVersions,
    isLoading: isLoadingProjectCreateVersions,
    isSuccess,
  } = useProjectCreationPostgresVersionsQuery(
    {
      cloudProvider,
      dbRegion: dbRegionExact,
      organizationSlug,
    },
    { enabled: type === 'create' }
  )

  const { data: unpauseVersions, isLoading: isLoadingProjectUnpauseVersions } =
    useProjectUnpausePostgresVersionsQuery(
      { projectRef: project?.ref },
      { enabled: type === 'unpause' }
    )

  const versions =
    type === 'create'
      ? createVersions?.available_versions ?? []
      : unpauseVersions?.available_versions ?? []
  const availableVersions = versions.sort((a, b) => a.version.localeCompare(b.version)).reverse()
  const { postgresVersionSelection } = form.watch()

  useEffect(() => {
    if (availableVersions.length > 0) {
      const gaVersion = availableVersions.find((x) => x.release_channel === 'ga')
      const defaultValue = gaVersion ? formatValue(gaVersion) : formatValue(availableVersions[0])
      form.setValue('postgresVersionSelection', defaultValue)
    }
  }, [isSuccess, availableVersions, form])

  return (
    <FormItemLayout label={label} layout={layout}>
      <Select_Shadcn_
        value={postgresVersionSelection}
        onValueChange={field.onChange}
        disabled={
          availableVersions.length === 0 ||
          (type === 'create' && isLoadingProjectCreateVersions) ||
          (type === 'unpause' && isLoadingProjectUnpauseVersions)
        }
      >
        <SelectTrigger_Shadcn_ className="[&>:nth-child(1)]:w-full [&>:nth-child(1)]:flex [&>:nth-child(1)]:items-start">
          <SelectValue_Shadcn_ placeholder="Select a Postgres version for your project" />
        </SelectTrigger_Shadcn_>
        <SelectContent_Shadcn_>
          <SelectGroup_Shadcn_>
            {availableVersions.map((value) => {
              const postgresVersion = value.version
                .split('supabase-postgres-')[1]
                .replace('-orioledb', '')
              return (
                <SelectItem_Shadcn_
                  key={formatValue(value)}
                  value={formatValue(value)}
                  className="w-full [&>:nth-child(2)]:w-full"
                >
                  <div className="flex flex-row items-center justify-between w-full">
                    <span className="text-foreground">{postgresVersion}</span>
                    <div>
                      {value.release_channel !== 'ga' && (
                        <Badge variant="warning" className="mr-1 capitalize">
                          {value.release_channel}
                        </Badge>
                      )}
                      {value.postgres_engine.includes('oriole') && (
                        <Badge variant="default" className="mr-1">
                          OrioleDB
                        </Badge>
                      )}
                    </div>
                  </div>
                </SelectItem_Shadcn_>
              )
            })}
          </SelectGroup_Shadcn_>
        </SelectContent_Shadcn_>
      </Select_Shadcn_>
    </FormItemLayout>
  )
}
