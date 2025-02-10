import React, { useState } from 'react'
import { Button, EyeIcon, EyeOffIcon, Skeleton, WarningIcon } from 'ui'
import { ChevronsUpDownIcon } from 'lucide-react'
import { useParams } from 'common'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { SimpleCodeBlock } from 'ui/src/components/SimpleCodeBlock'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'

const frameworkOptions = ['React', 'Vue', 'Angular', 'Svelte'] // Add more as needed

const QuickKeyCopyWrapper = () => {
  const [selectedFramework, setSelectedFramework] = useState('React')

  return (
    <div className="flex flex-col gap-0 bg-alternative/50 border rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 text-xs justify-between px-5 py-4">
        <div className="flex flex-col gap-0">
          <h4 className="text-sm">Quick key copy</h4>
          <p className="text-foreground-lighter">
            Choose your framework and paste the code into your environment file.
          </p>
        </div>
        <Button
          type="default"
          iconRight={<ChevronsUpDownIcon />}
          onClick={() => {
            const currentIndex = frameworkOptions.indexOf(selectedFramework)
            const nextIndex = (currentIndex + 1) % frameworkOptions.length
            setSelectedFramework(frameworkOptions[nextIndex])
          }}
        >
          {selectedFramework}
        </Button>
      </div>
      <QuickKeyCopyContent selectedFramework={selectedFramework} />
    </div>
  )
}

const QuickKeyCopyContent = ({ selectedFramework }: { selectedFramework: string }) => {
  const { ref: projectRef } = useParams()
  const {
    data: projectAPI,
    isLoading: isProjectApiLoading,
    error: projectApiError,
  } = useProjectSettingsV2Query({
    projectRef: projectRef as string,
  })
  const {
    data: apiKeysData,
    isLoading: isApiKeysLoading,
    error: apiKeysError,
  } = useAPIKeysQuery({
    projectRef: projectRef as string,
    reveal: false,
  })
  const isPermissionsLoading = !usePermissionsLoaded()
  const canReadAPIKeys = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, '*')

  const publishableApiKey = apiKeysData?.find(({ type }) => type === 'publishable')?.api_key
  const dataErrors = projectApiError || apiKeysError
  const permissionErrors = !canReadAPIKeys && !isPermissionsLoading

  if (isProjectApiLoading || isApiKeysLoading || isPermissionsLoading) {
    return (
      <div className="bg-alternative px-5 py-3 border-t overflow-hidden flex flex-col gap-0 h-20">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-[48px] rounded" />
        </div>
        <Skeleton className="h-[40px] w-3/4 rounded" />
      </div>
    )
  }

  const EmptyContainer = ({ children }: { children: React.ReactNode }) => {
    return (
      <div className="bg-alternative justify-center px-5 py-3 border-t overflow-hidden flex flex-col gap-1 h-20">
        {children}
      </div>
    )
  }

  // if (!canReadAPIKeys) {
  //   return (
  //     <EmptyContainer>
  //       <div className="flex items-center gap-2">
  //         <EyeOffIcon />
  //         <p className="text-sm text-foreground">You do not have permission to read API Keys</p>
  //       </div>
  //       <p className="text-foreground-light text-xs">
  //         Please contact your project admin/owner to request access.
  //       </p>
  //     </EmptyContainer>
  //   )
  // }

  // TO DO : this needs to be changed to just if(error)
  // currently it's not working as API returns an error.
  if (dataErrors) {
    return (
      <EmptyContainer>
        <div className="flex items-center gap-2">
          <WarningIcon />
          <p className="text-sm text-warning-600">Error loading Secret API Keys</p>
        </div>
        <p className="text-warning/75 text-xs">
          {projectApiError?.message ?? apiKeysError?.message ?? 'Error: Failed to load API keys'}
        </p>
      </EmptyContainer>
    )
  }

  const getEnvContent = () => {
    return `
NEXT_PUBLIC_SUPABASE_URL=${projectAPI?.app_config?.endpoint || ''}
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_API_KEY=${!canReadAPIKeys ? 'You do not have permission to read the Publishable API key' : publishableApiKey || ''}
`
  }

  return (
    <div className="bg-alternative px-5 py-3 border-t overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-foreground w-4 h-4 flex items-end justify-center rounded-sm">
          <span className="font-mono text-[8px] text-background font-bold">env</span>
        </div>
        <span className="font-mono text-xs">.env.local</span>
      </div>
      <SimpleCodeBlock parentClassName="!p-0">{getEnvContent()}</SimpleCodeBlock>
    </div>
  )
}

export default QuickKeyCopyWrapper
