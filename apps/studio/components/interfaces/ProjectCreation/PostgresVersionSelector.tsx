import { useEffect } from 'react'
import { ControllerRenderProps, UseFormReturn } from 'react-hook-form'

import { components } from 'api-types'
import {
  ProjectCreationPostgresVersion,
  useProjectCreationPostgresVersionsQuery,
} from 'data/config/project-creation-postgres-versions-query'
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

type ReleaseChannel = components['schemas']['ReleaseChannel']
type PostgresEngine = components['schemas']['PostgresEngine']

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
}

const formatValue = ({ postgres_engine, release_channel }: ProjectCreationPostgresVersion) => {
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
}: PostgresVersionSelectorProps) => {
  const {
    data,
    isLoading: isLoadingProjectVersions,
    isSuccess,
  } = useProjectCreationPostgresVersionsQuery({
    cloudProvider,
    dbRegion,
    organizationSlug,
  })
  const availableVersions = (data?.available_versions ?? []).sort((a, b) =>
    a.version.localeCompare(b.version)
  )

  useEffect(() => {
    const defaultValue = availableVersions[0] ? formatValue(availableVersions[0]) : undefined
    form.setValue('postgresVersionSelection', defaultValue)
  }, [isSuccess, form])

  return (
    <FormItemLayout layout="horizontal" label="Postgres Version">
      <Select_Shadcn_
        value={field.value}
        onValueChange={field.onChange}
        disabled={availableVersions.length <= 1 || isLoadingProjectVersions}
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
