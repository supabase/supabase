import { useMemo } from 'react'
import { SimpleCodeBlock } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  MultipleCodeBlock,
  MultipleCodeBlockContent,
  MultipleCodeBlockTrigger,
  MultipleCodeBlockTriggers,
} from 'ui-patterns/multiple-code-block'
import { type ConnectionStringMethod } from '../../../Connect.constants'
import type { StepContentProps } from '../../../Connect.types'
import examples from '../../../DirectConnectionExamples'

function getLanguageFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'js':
      return 'js'
    case 'jsx':
      return 'jsx'
    case 'ts':
      return 'ts'
    case 'tsx':
      return 'tsx'
    case 'go':
      return 'go'
    case 'py':
      return 'python'
    case 'kt':
      return 'kotlin'
    case 'cs':
      return 'csharp'
    default:
      return 'bash'
  }
}

/**
 * Step component for direct database connections.
 * Uses state to determine which connection string to show.
 */
function DirectConnectionContent({ state, connectionStringPooler }: StepContentProps) {
  const connectionMethod = (state.connectionMethod as ConnectionStringMethod) ?? 'direct'
  const connectionType = (state.connectionType as string) ?? 'uri'
  const useSharedPooler = Boolean(state.useSharedPooler)

  // Determine which connection string to use
  const getConnectionString = useMemo(() => {
    if (connectionMethod === 'direct') {
      return connectionStringPooler.direct ?? ''
    }

    if (connectionMethod === 'session') {
      return connectionStringPooler.sessionShared
    }

    // Transaction pooler
    if (useSharedPooler || !connectionStringPooler.transactionDedicated) {
      return connectionStringPooler.transactionShared
    }

    return connectionStringPooler.transactionDedicated
  }, [connectionMethod, useSharedPooler, connectionStringPooler])

  const example = examples[connectionType as keyof typeof examples]
  const exampleFiles = example?.files

  if (!getConnectionString) {
    return (
      <div className="p-4">
        <GenericSkeletonLoader />
      </div>
    )
  }

  const envContent = `DATABASE_URL="${getConnectionString}"`
  const files = [
    {
      name: '.env',
      content: envContent,
      language: 'bash',
    },
    ...(exampleFiles ?? []).map((file) => ({
      name: file.name,
      content: file.content,
      language: getLanguageFromFileName(file.name),
    })),
  ]

  return (
    <div className="flex flex-col gap-6">
      {files.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <MultipleCodeBlock>
            <MultipleCodeBlockTriggers>
              {files.map((file) => (
                <MultipleCodeBlockTrigger key={`direct-file-${file.name}`} value={file.name} />
              ))}
            </MultipleCodeBlockTriggers>

            {files.map((file) => (
              <MultipleCodeBlockContent key={`direct-file-content-${file.name}`} value={file.name}>
                <SimpleCodeBlock
                  className={file.language}
                  parentClassName="min-h-72"
                  showCopy={true}
                >
                  {file.content}
                </SimpleCodeBlock>
              </MultipleCodeBlockContent>
            ))}
          </MultipleCodeBlock>
        </div>
      )}
    </div>
  )
}

export default DirectConnectionContent
