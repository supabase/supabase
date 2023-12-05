import { PostgresPolicy } from '@supabase/postgres-meta'
import { FileDiff } from 'lucide-react'
import dynamic from 'next/dynamic'
import { ThreadMessage } from 'openai/resources/beta/threads/messages/messages'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Button, Modal, SheetContent_Shadcn_, SheetFooter_Shadcn_, Sheet_Shadcn_, cn } from 'ui'

import {
  IStandaloneCodeEditor,
  IStandaloneDiffEditor,
} from 'components/interfaces/SQLEditor/SQLEditor.types'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useRlsSuggestMutation } from 'data/ai/rls-suggest-mutation'
import { useRlsSuggestQuery } from 'data/ai/rls-suggest-query'
import { useSqlDebugMutation } from 'data/ai/sql-debug-mutation'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { QueryResponseError, useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useSelectedProject, useStore } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import { AIPolicyChat } from './AIPolicyChat'
import { generatePlaceholder, generateThreadMessage } from './AIPolicyEditorPanel.utils'
import { AIPolicyHeader } from './AIPolicyHeader'
import QueryError from './QueryError'
import RLSCodeEditor from './RLSCodeEditor'

const DiffEditor = dynamic(
  () => import('@monaco-editor/react').then(({ DiffEditor }) => DiffEditor),
  { ssr: false }
)

interface AIPolicyEditorPanelProps {
  visible: boolean
  selectedPolicy?: PostgresPolicy
  onSelectCancel: () => void
}

/**
 * Using memo for this component because everything rerenders on window focus because of outside fetches
 */
export const AIPolicyEditorPanel = memo(function ({
  visible,
  selectedPolicy,
  onSelectCancel,
}: AIPolicyEditorPanelProps) {
  const { meta } = useStore()
  const selectedProject = useSelectedProject()

  const editorRef = useRef<IStandaloneCodeEditor | null>(null)
  const diffEditorRef = useRef<IStandaloneDiffEditor | null>(null)
  const placeholder = generatePlaceholder(selectedPolicy)

  const [error, setError] = useState<QueryResponseError>()
  // [Joshen] Separate state here as there's a delay between submitting and the API updating the loading status
  const [loading, setLoading] = useState(false)
  const [keepPreviousData, setKeepPreviousData] = useState(false)
  const [debugThread, setDebugThread] = useState<ThreadMessage[]>([])
  const [assistantVisible, setAssistantPanel] = useState(false)
  const [ids, setIds] = useState<{ threadId: string; runId: string } | undefined>(undefined)
  const [isAssistantChatInputEmpty, setIsAssistantChatInputEmpty] = useState(true)
  const [incomingChange, setIncomingChange] = useState<string | undefined>(undefined)
  // used for confirmation when closing the panel with unsaved changes
  const [isClosingPolicyEditorPanel, setIsClosingPolicyEditorPanel] = useState(false)

  const { data } = useRlsSuggestQuery(
    { thread_id: ids?.threadId!, run_id: ids?.runId! },
    {
      enabled: !!(ids?.runId && ids.threadId),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: (data) => {
        if (data && data.status === 'completed') {
          return Infinity
        }
        return 5000
      },
      keepPreviousData,
    }
  )

  const { data: entities } = useEntityDefinitionsQuery(
    {
      projectRef: selectedProject?.ref,
      connectionString: selectedProject?.connectionString,
    },
    { enabled: true, refetchOnWindowFocus: false }
  )

  const entityDefinitions = entities?.map((def) => def.sql.trim())

  const { mutate: addPromptMutation } = useRlsSuggestMutation({
    onSuccess: (data) => {
      setIds({ threadId: data.threadId, runId: data.runId })
    },
    onError: (error) => {
      const threadMessage = generateThreadMessage({
        threadId: ids?.threadId,
        runId: ids?.runId,
        content: error.message.includes('No OPENAI_KEY set')
          ? `Seems like you haven't set an OPENAI_KEY in your environment variables of the dashboard. Update your .env file with that environment variable to use all the AI features of the dashboard!`
          : error.message,
      })
      setDebugThread([...debugThread, threadMessage])
      setLoading(false)
    },
  })

  const { mutate: executeMutation, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: () => {
      // refresh all policies
      meta.policies.load()
      toast.success('Successfully created new policy')
      onSelectCancel()
    },
    onError: (error) => {
      setError(error)
    },
  })

  const { mutateAsync: debugSql, isLoading: isDebugSqlLoading } = useSqlDebugMutation()

  const addPrompt = useCallback(
    (message: string) => {
      setLoading(true)
      if (ids?.threadId) {
        addPromptMutation({
          thread_id: ids?.threadId,
          prompt: message,
        })
      } else {
        addPromptMutation({
          thread_id: ids?.threadId,
          entityDefinitions,
          prompt: message,
        })
      }
    },
    [addPromptMutation, entityDefinitions, ids?.threadId]
  )

  const messages = useMemo(
    () => [...(data?.messages ?? []), ...debugThread],
    [data?.messages, debugThread]
  )

  const errorLines =
    error?.formattedError.split('\n').filter((x: string) => x.length > 0).length ?? 0

  const onExecuteSQL = useCallback(() => {
    // clean up the sql before sending
    const policy = editorRef.current?.getValue().replaceAll('  ', ' ')

    if (policy) {
      setError(undefined)
      executeMutation({
        sql: policy,
        projectRef: selectedProject?.ref,
        connectionString: selectedProject?.connectionString,
      })
    }
  }, [executeMutation, selectedProject?.connectionString, selectedProject?.ref])

  const acceptChange = useCallback(async () => {
    if (!incomingChange) {
      return
    }

    if (!editorRef.current || !diffEditorRef.current) {
      return
    }

    const editorModel = editorRef.current.getModel()
    const diffModel = diffEditorRef.current.getModel()

    if (!editorModel || !diffModel) {
      return
    }

    const sql = diffModel.modified.getValue()

    // apply the incoming change in the editor directly so that Undo/Redo work properly
    editorRef.current.executeEdits('apply-ai-edit', [
      {
        text: sql,
        range: editorModel.getFullModelRange(),
      },
    ])

    // remove the incoming change to revert to the original editor
    setIncomingChange(undefined)
  }, [incomingChange])

  const onClosingPanel = useCallback(() => {
    const policy = editorRef.current?.getValue()
    if (policy || messages.length > 0 || !isAssistantChatInputEmpty) {
      setIsClosingPolicyEditorPanel(true)
    } else {
      onSelectCancel()
    }
  }, [onSelectCancel, messages, isAssistantChatInputEmpty])

  const onSelectDebug = async () => {
    const policy = editorRef.current?.getValue().replaceAll('\n', ' ').replaceAll('  ', ' ')
    if (error === undefined || policy === undefined) return

    setAssistantPanel(true)
    const messageId = uuidv4()

    const assistantMessageBefore = generateThreadMessage({
      id: messageId,
      threadId: ids?.threadId,
      runId: ids?.runId,
      content: 'Thinking...',
      metadata: { type: 'debug' },
    })
    setDebugThread([...debugThread, assistantMessageBefore])

    const { solution, sql } = await debugSql({
      sql: policy.trim(),
      errorMessage: error.message,
      entityDefinitions,
    })

    const assistantMessageAfter = generateThreadMessage({
      id: messageId,
      threadId: ids?.threadId,
      runId: ids?.runId,
      content: `${solution}\n\`\`\`sql\n${sql}\n\`\`\``,
      metadata: { type: 'debug' },
    })
    setDebugThread([...debugThread, assistantMessageAfter])
  }

  const onDiff = useCallback((v: string) => setIncomingChange(v), [])

  // when the panel is closed, reset all values
  useEffect(() => {
    if (!visible) {
      const policy = editorRef.current?.getValue()
      if (policy) editorRef.current?.setValue('')
      if (incomingChange) setIncomingChange(undefined)
      if (assistantVisible) setAssistantPanel(false)
      setIsClosingPolicyEditorPanel(false)
      setIds(undefined)
      setError(undefined)
      setDebugThread([])
      setKeepPreviousData(false)
    } else {
      setKeepPreviousData(true)
    }
  }, [visible])

  useEffect(() => {
    if (data?.status === 'completed') setLoading(false)
  }, [data?.status])

  return (
    <>
      <Sheet_Shadcn_ open={visible} onOpenChange={() => onClosingPanel()}>
        <SheetContent_Shadcn_
          size={assistantVisible ? 'lg' : 'default'}
          className={cn(
            'p-0 flex flex-row gap-0',
            assistantVisible ? '!min-w-[1024px]' : '!min-w-[600px]'
          )}
        >
          <div className={cn('flex flex-col grow w-full', assistantVisible && 'w-[60%]')}>
            <AIPolicyHeader
              selectedPolicy={selectedPolicy}
              assistantVisible={assistantVisible}
              setAssistantVisible={setAssistantPanel}
            />
            <div className="flex flex-col h-full w-full justify-between">
              {incomingChange ? (
                <div className="px-5 py-3 flex justify-between gap-3 bg-muted">
                  <div className="flex gap-2 items-center text-foreground-light">
                    <FileDiff className="h-4 w-4" />
                    <span className="text-sm">Apply changes from assistant</span>
                  </div>
                  <div className="flex gap-3">
                    <Button type="default" onClick={() => setIncomingChange(undefined)}>
                      Discard
                    </Button>
                    <Button type="primary" onClick={() => acceptChange()}>
                      Apply
                    </Button>
                  </div>
                </div>
              ) : null}

              {incomingChange ? (
                <DiffEditor
                  theme="supabase"
                  language="pgsql"
                  className="flex grow"
                  original={editorRef.current?.getValue()}
                  modified={incomingChange}
                  onMount={(editor) => (diffEditorRef.current = editor)}
                  options={{
                    renderSideBySide: false,
                    scrollBeyondLastLine: false,
                    renderOverviewRuler: false,
                  }}
                />
              ) : null}
              <div
                // [Joshen] Not the cleanest but its to force the editor to re-render its height
                // for now, till we can find a better solution
                className={`relative ${incomingChange ? 'hidden' : 'block'}`}
                style={{
                  height:
                    error === undefined
                      ? 'calc(100vh - 58px - 54px)'
                      : `calc(100vh - 58px - 151px - ${20 * errorLines}px)`,
                }}
              >
                <RLSCodeEditor
                  id="rls-sql-policy"
                  wrapperClassName={incomingChange ? '!hidden' : ''}
                  defaultValue={''}
                  editorRef={editorRef}
                  placeholder={placeholder}
                />
              </div>

              <div className="flex flex-col">
                {error !== undefined && <QueryError error={error} onSelectDebug={onSelectDebug} />}
                <SheetFooter_Shadcn_ className="flex flex-col gap-12 px-5 py-4 w-full">
                  <div className="flex justify-end gap-x-2">
                    <Button type="default" disabled={isExecuting} onClick={() => onSelectCancel()}>
                      Cancel
                    </Button>
                    <Button
                      loading={isExecuting}
                      htmlType="submit"
                      disabled={isExecuting || incomingChange !== undefined}
                      onClick={() => onExecuteSQL()}
                    >
                      Save policy
                    </Button>
                  </div>
                </SheetFooter_Shadcn_>
              </div>
            </div>
          </div>
          {assistantVisible && (
            <div className={cn('flex border-l grow w-full', assistantVisible && 'w-[40%]')}>
              <AIPolicyChat
                messages={messages}
                onSubmit={(message: string) => addPrompt(message)}
                onDiff={onDiff}
                onChange={setIsAssistantChatInputEmpty}
                loading={loading || data?.status === 'loading'}
              />
            </div>
          )}

          <ConfirmationModal
            visible={isClosingPolicyEditorPanel}
            header="Discard changes"
            buttonLabel="Discard"
            onSelectCancel={() => setIsClosingPolicyEditorPanel(false)}
            onSelectConfirm={() => {
              onSelectCancel()
              setIsClosingPolicyEditorPanel(false)
            }}
          >
            <Modal.Content>
              <p className="py-4 text-sm text-foreground-light">
                Are you sure you want to close the editor? Any unsaved changes on your policy and
                conversations with the Assistant will be lost.
              </p>
            </Modal.Content>
          </ConfirmationModal>
        </SheetContent_Shadcn_>
      </Sheet_Shadcn_>
    </>
  )
})

AIPolicyEditorPanel.displayName = 'AIPolicyEditorPanel'
