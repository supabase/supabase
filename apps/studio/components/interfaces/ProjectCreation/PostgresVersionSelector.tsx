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
  const { data, isLoading: isLoadingProjectVersions } = useProjectCreationPostgresVersionsQuery({
    cloudProvider,
    dbRegion,
    organizationSlug,
  })

  useEffect(() => {
    const defaultValue = data?.available_versions?.[0]
      ? formatValue(data.available_versions[0])
      : undefined
    form.setValue('postgresVersionSelection', defaultValue)
  }, [data, form])

  return (
    <FormItemLayout layout="horizontal" label="Postgres Version">
      <Select_Shadcn_
        value={field.value}
        onValueChange={field.onChange}
        disabled={isLoadingProjectVersions}
      >
        <SelectTrigger_Shadcn_>
          <SelectValue_Shadcn_ placeholder="Select a Postgres version for your project" />
        </SelectTrigger_Shadcn_>
        <SelectContent_Shadcn_>
          <SelectGroup_Shadcn_>
            {(data?.available_versions || [])?.map((value) => {
              const postgresVersion = value.version.split('supabase-postgres-')[1]
              return (
                <SelectItem_Shadcn_ key={formatValue(value)} value={formatValue(value)}>
                  <div className="flex items-center gap-3">
                    <span className="text-foreground">{postgresVersion}</span>
                    {value.release_channel !== 'ga' && (
                      <Badge variant="warning" className="mr-1 capitalize">
                        {value.release_channel}
                      </Badge>
                    )}
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
