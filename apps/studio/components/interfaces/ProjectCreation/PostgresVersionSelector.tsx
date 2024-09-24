import { ControllerRenderProps, UseFormReturn } from 'react-hook-form'

import { useProjectCreationPostgresVersionsQuery } from 'data/config/project-creation-postgres-versions-query'
import type { CloudProvider } from 'shared-data'
import {
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

interface PostgresVersionSelectorProps {
  cloudProvider: CloudProvider
  dbRegion: string
  organizationSlug: string | undefined
  field: ControllerRenderProps<any, 'dbRegion'>
  form: UseFormReturn<any>
}

export const PostgresVersionSelector = ({ cloudProvider, dbRegion, organizationSlug, field }: PostgresVersionSelectorProps) => {
  const {
    data,
    error,
    isLoading: isLoadingProjectVersions,
    isError: isErrorProjectVersions,
    isSuccess: isSuccessProjectVersions,
  } = useProjectCreationPostgresVersionsQuery({
    cloudProvider,
    dbRegion,
    organizationSlug,
  })

  const defaultValue = data?.available_versions?.[0]

  return (
    <FormItemLayout
      layout="horizontal"
      label="Postgres Version"
      description={
        <>
          <p>Select Postgres version for your project.</p>
        </>
      }
    >
      <Select_Shadcn_
        value={defaultValue}
        onValueChange={field.onChange}
        disabled={isLoadingProjectVersions}
      >
        <SelectTrigger_Shadcn_>
          <SelectValue_Shadcn_ placeholder="Select a Postgres version for your project" />
        </SelectTrigger_Shadcn_>
        <SelectContent_Shadcn_>
          <SelectGroup_Shadcn_>
            {(data?.available_versions || [])?.map((value) => {
              const label = value.version as string
              return (
                <SelectItem_Shadcn_ key={value.version} value={value}>
                  <div className="flex items-center gap-3">
                    <span className="text-foreground">{label}</span>
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
