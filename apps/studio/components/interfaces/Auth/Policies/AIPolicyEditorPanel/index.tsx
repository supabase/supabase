import { FileDiff } from 'lucide-react'
import dynamic from 'next/dynamic'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Button, Modal, SidePanel } from 'ui'

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
import { ThreadMessage } from 'openai/resources/beta/threads/messages/messages'
import { AIPolicyChat } from './AIPolicyChat'
import { AIPolicyHeader } from './AIPolicyHeader'
import QueryError from './QueryError'
import RLSCodeEditor from './RLSCodeEditor'

const DiffEditor = dynamic(
  () => import('@monaco-editor/react').then(({ DiffEditor }) => DiffEditor),
  { ssr: false }
)

interface AIPolicyEditorPanelProps {
  visible: boolean
  onSelectCancel: () => void
}

/**
 * Using memo for this component because everything rerenders on window focus because of outside fetches
 */
export const AIPolicyEditorPanel = memo(function ({
  visible,
  onSelectCancel,
}: AIPolicyEditorPanelProps) {
  const { meta } = useStore()
  const selectedProject = useSelectedProject()

  const editorRef = useRef<IStandaloneCodeEditor | null>(null)
  const diffEditorRef = useRef<IStandaloneDiffEditor | null>(null)

  const [error, setError] = useState<QueryResponseError>()
  const [debugThread, setDebugThread] = useState<ThreadMessage[]>([])
  const [assistantVisible, setAssistantPanel] = useState(false)
  const [ids, setIds] = useState<{ threadId: string; runId: string } | undefined>(undefined)
  const [isAssistantChatInputEmpty, setIsAssistantChatInputEmpty] = useState(false)
  const [incomingChange, setIncomingChange] = useState<string | undefined>(undefined)
  // used for confirmation when closing the panel with unsaved changes
  const [isClosingPolicyEditorPanel, setIsClosingPolicyEditorPanel] = useState(false)

  const { data, isSuccess } = useRlsSuggestQuery(
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
    () => [...(isSuccess ? data.messages : []), ...debugThread],
    [data?.messages, debugThread, isSuccess]
  )

  const errorLines =
    error?.formattedError.split('\n').filter((x: string) => x.length > 0).length ?? 0

  const createNewPolicy = useCallback(() => {
    // clean up the sql before sending
    const policy = editorRef.current?.getValue().replaceAll('\n', ' ').replaceAll('  ', ' ')

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

    const assistantMessageBefore: ThreadMessage = {
      id: messageId,
      object: 'thread.message',
      role: 'assistant',
      file_ids: [],
      metadata: { type: 'debug' },
      content: [{ type: 'text', text: { value: 'Thinking...', annotations: [] } }],
      created_at: Math.floor(Number(new Date()) / 1000),
      assistant_id: null,
      thread_id: ids?.threadId ?? '',
      run_id: ids?.runId ?? '',
    }

    setDebugThread([...debugThread, assistantMessageBefore])

    const { solution, sql } = await debugSql({
      sql: policy.trim(),
      errorMessage: error.message,
      entityDefinitions,
    })

    // Temporarily to make sure that debugSQL output matches messages from RLS suggest query
    const assistantMessageAfter: ThreadMessage = {
      id: messageId,
      object: 'thread.message',
      role: 'assistant',
      file_ids: [],
      metadata: { type: 'debug' },
      content: [
        {
          type: 'text',
          text: { value: `${solution}\n\`\`\`sql\n${sql}\n\`\`\``, annotations: [] },
        },
      ],
      created_at: Math.floor(Number(new Date()) / 1000),
      assistant_id: null,
      thread_id: ids?.threadId ?? '',
      run_id: ids?.runId ?? '',
    }

    setDebugThread([...debugThread, assistantMessageAfter])
  }

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
    }
  }, [visible])

  return (
    <SidePanel
      size={assistantVisible ? 'xxxxlarge' : 'large'}
      visible={visible}
      disabled
      hideFooter
      onCancel={onClosingPanel}
    >
      <div className="flex flex-row h-full">
        <div className="flex flex-col w-screen max-w-2xl h-full border max-h-screen">
          <AIPolicyHeader
            assistantVisible={assistantVisible}
            setAssistantVisible={setAssistantPanel}
          />

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

          <div className="grow">
            {incomingChange ? (
              <DiffEditor
                theme="supabase"
                language="pgsql"
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
            {/* this editor has to rendered at all times to not lose its editing history */}
            <div
              // [Joshen] Not the cleanest but its to force the editor to re-render its height
              // for now, till we can find a better solution
              className={`relative ${incomingChange ? 'hidden' : 'block'}`}
              style={{
                height:
                  error === undefined
                    ? 'calc(100vh - 67px - 59px)'
                    : `calc(100vh - 67px - 155px - ${20 * errorLines}px)`,
              }}
            >
              <RLSCodeEditor
                id="rls-sql-policy"
                wrapperClassName={incomingChange ? '!hidden' : ''}
                defaultValue={''}
                editorRef={editorRef}
              />
            </div>
          </div>

          <div className="flex flex-col gap-y-4 p-4 bg-overlay border-t border-overlay w-full">
            {error !== undefined && <QueryError error={error} onSelectDebug={onSelectDebug} />}
            <div className="flex justify-end gap-x-2">
              <Button type="default" disabled={isExecuting} onClick={() => onSelectCancel()}>
                Cancel
              </Button>
              <Button
                loading={isExecuting}
                htmlType="submit"
                disabled={isExecuting || incomingChange !== undefined}
                onClick={() => createNewPolicy()}
              >
                Save policy
              </Button>
            </div>
          </div>
        </div>

        {assistantVisible && (
          <div className="w-full bg-surface-200">
            <AIPolicyChat
              messages={messages}
              onSubmit={(message: string) => addPrompt(message)}
              onDiff={(v) => setIncomingChange(v)}
              onChange={setIsAssistantChatInputEmpty}
              loading={data?.status === 'loading'}
            />
          </div>
        )}
      </div>

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
    </SidePanel>
  )
})

AIPolicyEditorPanel.displayName = 'AIPolicyEditorPanel'
