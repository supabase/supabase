import { AssistantChatForm } from '@/components/AssistantChatForm'
import SaveSchemaDropdown from '@/components/Header/SaveSchemaDropdown'
import ToggleCodeEditorButton from '@/components/Header/ToggleCodeEditorButton'
import GraphLoader from '@/components/Loaders/GraphLoader'
import SchemaLoader from '@/components/Loaders/SchemaLoader'
import { cn } from '@ui/lib/utils/cn'
import { Suspense } from 'react'
import { CodeEditor } from './CodeEditor'
import { Messages } from './Messages'
import { SchemaFlow } from './SchemaFlow'
import { getAssistantResponse } from './getAssistantMessage'

export interface ThreadPageProps {
  params: {
    thread_id: string
    message_id: string
  }
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const promise = getAssistantResponse(params.thread_id, params.message_id)

  return (
    <div className="flex flex-col-reverse items-between xl:flex-row xl:items-center xl:justify-between bg-alternative h-full">
      <div
        className={cn(
          'bg',
          'h-full',
          'border-t xl:border-t-0 xl:border-r relative',
          'flex flex-col h-full border-r',
          'w-full xl:w-[400px] 2xl:w-[500px]'
        )}
      >
        <div className="flex flex-col grow items-between">
          <Messages threadId={params.thread_id} />
          <div className="px-4 pb-4">
            <AssistantChatForm chatContext={'edit'} placeholder={'Any changes to make?'} />
          </div>
        </div>
      </div>
      <div className="xl:hidden flex items-center gap-x-2 justify-end border-t py-2 px-2 bg-background">
        <ToggleCodeEditorButton />
        <SaveSchemaDropdown />
      </div>

      <div className="grow max-h-screen flex flex-row items-center justify-between bg-alternative h-full">
        <Suspense fallback={<SchemaLoader />}>
          <SchemaFlow promisedMessage={promise} />
        </Suspense>
        <Suspense fallback={<GraphLoader />}>
          <CodeEditor promisedMessage={promise} />
        </Suspense>
      </div>
    </div>
  )
}
