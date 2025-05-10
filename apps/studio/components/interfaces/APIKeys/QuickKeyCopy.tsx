import React, { useState } from 'react'
import { Button, Skeleton, WarningIcon } from 'ui'
import { ChevronDownIcon } from 'lucide-react'
import { useParams } from 'common'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { SimpleCodeBlock } from 'ui/src/components/SimpleCodeBlock'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { FRAMEWORKS } from 'components/interfaces/Connect/Connect.constants'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'
import Image from 'next/image'
import { useTheme } from 'next-themes'

const BASE_PATH = '/img'

const QuickKeyCopyWrapper = () => {
  // Use frameKey instead of the full framework object to make selection easier
  const [selectedFrameworkKey, setSelectedFrameworkKey] = useState(FRAMEWORKS[0].key)
  const { resolvedTheme } = useTheme()

  // Get the current framework object by key
  const selectedFramework =
    FRAMEWORKS.find((framework) => framework.key === selectedFrameworkKey) || FRAMEWORKS[0]

  // Create the icon component for the button
  const FrameworkIcon = () => (
    <Image
      src={`${BASE_PATH}/libraries/${selectedFramework.key.toLowerCase()}${
        ['nextjs', 'remix', 'astro'].includes(selectedFramework.key.toLowerCase())
          ? resolvedTheme?.includes('dark')
            ? '-dark'
            : ''
          : ''
      }-icon.svg`}
      width={14}
      height={14}
      alt={`${selectedFramework.label} logo`}
    />
  )

  return (
    <div className="flex flex-col gap-0 bg-alternative/50 border rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 text-xs justify-between px-5 py-4">
        <div className="flex flex-col gap-0">
          <h4 className="text-sm">Quick key copy</h4>
          <p className="text-foreground-lighter">
            Choose your framework and paste the code into your environment file.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="default" iconRight={<ChevronDownIcon />} icon={<FrameworkIcon />}>
              {selectedFramework.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {FRAMEWORKS.map((framework) => (
              <DropdownMenuItem
                key={framework.key}
                onClick={() => setSelectedFrameworkKey(framework.key)}
                className="flex items-center gap-2"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <Image
                    src={`${BASE_PATH}/libraries/${framework.key.toLowerCase()}${
                      ['nextjs', 'remix', 'astro'].includes(framework.key.toLowerCase())
                        ? resolvedTheme?.includes('dark')
                          ? '-dark'
                          : ''
                        : ''
                    }-icon.svg`}
                    width={14}
                    height={14}
                    alt={`${framework.label} logo`}
                  />
                </div>
                {framework.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <QuickKeyCopyContent frameworkKey={selectedFrameworkKey} />
    </div>
  )
}

const QuickKeyCopyContent = ({ frameworkKey }: { frameworkKey: string }) => {
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

  // Set up project keys
  const protocol = projectAPI?.app_config?.protocol ?? 'https'
  const endpoint = projectAPI?.app_config?.endpoint ?? ''
  const apiUrl = canReadAPIKeys ? `${protocol}://${endpoint ?? '-'}` : ''

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

  if (dataErrors) {
    return (
      <EmptyContainer>
        <div className="flex items-center gap-2">
          <WarningIcon />
          <p className="text-sm text-warning-600">Error loading API Keys</p>
        </div>
        <p className="text-warning/75 text-xs">
          {projectApiError?.message ?? apiKeysError?.message ?? 'Error: Failed to load API keys'}
        </p>
      </EmptyContainer>
    )
  }

  // Framework-specific environment variable formats
  const getEnvContent = () => {
    // Next.js and other React-based frameworks use NEXT_PUBLIC_
    if (frameworkKey === 'nextjs' || frameworkKey === 'react') {
      return `NEXT_PUBLIC_SUPABASE_URL=${apiUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${!canReadAPIKeys ? 'You do not have permission to read the API key' : publishableApiKey || ''}`
    }

    // Vue uses VITE_
    if (frameworkKey === 'vuejs') {
      return `VITE_SUPABASE_URL=${apiUrl}
VITE_SUPABASE_ANON_KEY=${!canReadAPIKeys ? 'You do not have permission to read the API key' : publishableApiKey || ''}`
    }

    // SvelteKit also uses VITE_
    if (frameworkKey === 'sveltekit') {
      return `VITE_SUPABASE_URL=${apiUrl}
VITE_SUPABASE_ANON_KEY=${!canReadAPIKeys ? 'You do not have permission to read the API key' : publishableApiKey || ''}`
    }

    // Default format for other frameworks
    return `SUPABASE_URL=${apiUrl}
SUPABASE_ANON_KEY=${!canReadAPIKeys ? 'You do not have permission to read the API key' : publishableApiKey || ''}`
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
