import { useState } from 'react'
import { Button, Skeleton, WarningIcon } from 'ui'
import { ChevronsUpDownIcon } from 'lucide-react'
import { useParams } from 'common'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { SimpleCodeBlock } from 'ui/src/components/SimpleCodeBlock'

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
  } = useProjectApiQuery({
    projectRef: projectRef as string,
  })
  const {
    data: apiKeysData,
    isLoading: isApiKeysLoading,
    error: apiKeysError,
  } = useAPIKeysQuery({
    projectRef: projectRef as string,
  })
  const publishableApiKey = apiKeysData?.find(({ type }) => type === 'publishable')?.api_key
  const error = isProjectApiLoading || isApiKeysLoading || projectApiError || apiKeysError

  if (isProjectApiLoading || isApiKeysLoading) {
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

  if (error) {
    return (
      <div className="bg-alternative justify-center px-5 py-3 border-t overflow-hidden flex flex-col gap-1 h-20">
        <div className="flex items-center gap-2">
          <WarningIcon />
          <p className="text-sm text-warning-600">Error loading Secret API Keys</p>
        </div>
        <p className="text-warning/75 text-xs">
          {projectApiError?.message ?? apiKeysError?.message ?? 'Error: Failed to load API keys'}
        </p>
      </div>
    )
  }

  const getEnvContent = () => {
    return `
NEXT_PUBLIC_SUPABASE_URL=${projectAPI?.autoApiService.endpoint || ''}
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_API_KEY=${publishableApiKey || ''}
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
