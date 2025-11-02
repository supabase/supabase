import { useEffect, useState } from 'react'

import { cn, SimpleCodeBlock } from 'ui'
import { ConnectionType } from './Connect.constants'
import { projectKeys } from './Connect.types'
import {
  ConnectTabContent,
  ConnectTabs,
  ConnectTabTrigger,
  ConnectTabTriggers,
} from './ConnectTabs'

interface ConnectTabContentCustomProps {
  projectKeys: projectKeys
  framework?: ConnectionType
}

export const ConnectTabContentCustom = ({
  projectKeys,
  framework,
}: ConnectTabContentCustomProps) => {
  const { files = [] } = framework ?? {}

  const [selectedTab, setSelectedTab] = useState<string>()

  useEffect(() => {
    if (framework?.files) setSelectedTab(framework.files[0].name)
  }, [framework])

  return (
    <div className={cn('border rounded-lg rounded-b-none')}>
      <ConnectTabs value={selectedTab} onValueChange={setSelectedTab}>
        <ConnectTabTriggers>
          {files.map((x) => (
            <ConnectTabTrigger key={`${x.name}-tab`} value={x.name} />
          ))}
        </ConnectTabTriggers>

        {files.map((x) => {
          const format = x.name.split('.')[1] ?? 'bash'
          const content = x.content
            .replaceAll('{{apiUrl}}', projectKeys.apiUrl ?? '')
            .replaceAll('{{anonKey}}', projectKeys.anonKey ?? '')
            .replaceAll('{{publishableKey}}', projectKeys.publishableKey ?? '')
          return (
            <ConnectTabContent key={`${x.name}-content`} value={x.name}>
              <SimpleCodeBlock className={format} parentClassName="min-h-72">
                {content}
              </SimpleCodeBlock>
            </ConnectTabContent>
          )
        })}
      </ConnectTabs>
    </div>
  )
}
