import { useState } from 'react'
import { Button } from 'ui'
import { ChevronsUpDownIcon } from 'lucide-react'
import { useParams } from 'common'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import SimpleCodeBlock from 'ui/src/components/SimpleCodeBlock/SimpleCodeBlock'

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
  const { data: projectAPI, isLoading: isProjectApiLoading } = useProjectApiQuery({
    projectRef: projectRef as string,
  })
  const { data: apiKeysData, isLoading: isApiKeysLoading } = useAPIKeysQuery({
    projectRef: projectRef as string,
  })

  const publishableApiKey = apiKeysData?.find(({ type }) => type === 'publishable')?.api_key

  const getEnvContent = () => {
    return `
NEXT_PUBLIC_SUPABASE_URL=${projectAPI?.autoApiService.endpoint || ''}
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_API_KEY=${publishableApiKey || ''}
`
  }

  if (isProjectApiLoading || isApiKeysLoading) {
    return (
      <div className="bg-alternative px-5 py-3 border-t overflow-hidden">
        <div className="h-4 w-3/4 bg-foreground-muted animate-pulse rounded mb-2"></div>
        <div className="h-32 w-full bg-foreground-muted animate-pulse rounded"></div>
      </div>
    )
  }

  if (!projectAPI?.autoApiService.endpoint || !publishableApiKey) {
    return (
      <div className="bg-alternative px-5 py-3 border-t overflow-hidden">
        <p className="text-sm text-foreground-light">
          Unable to load API keys. Please try again later.
        </p>
      </div>
    )
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
