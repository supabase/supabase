import dynamic from 'next/dynamic'
import { memo, useCallback, useRef, useState } from 'react'
import { Button, SidePanel } from 'ui'

import {
  IStandaloneCodeEditor,
  IStandaloneDiffEditor,
} from 'components/interfaces/SQLEditor/SQLEditor.types'
import { useRlsSuggestMutation } from 'data/ai/rls-suggest-mutation'
import { useRlsSuggestQuery } from 'data/ai/rls-suggest-query'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { useSelectedProject } from 'hooks'
import { FileDiff } from 'lucide-react'
import { Chat } from './chat'
import RLSCodeEditor from './editor'
import { Footer } from './footer'
import { Header } from './header'

const DiffEditor = dynamic(
  () => import('@monaco-editor/react').then(({ DiffEditor }) => DiffEditor),
  { ssr: false }
)

interface AIPolicyEditorModalProps {
  visible: boolean
}

/**
 * Using memo for this component because everything rerenders on window focus because of outside fetches
 */
export const AIPolicyEditorPanel = memo(function ({ visible = false }: AIPolicyEditorModalProps) {
  const selectedProject = useSelectedProject()
  const [modified, setModified] = useState<string | undefined>(undefined)
  const editorRef = useRef<IStandaloneCodeEditor | null>(null)
  const diffEditorRef = useRef<IStandaloneDiffEditor | null>(null)

  const [assistantVisible, setAssistantPanel] = useState(true)
  const [ids, setIds] = useState<{ threadId: string; runId: string } | undefined>({
    threadId: 'thread_wSMPbbyJMYh6eYuWh7FQHBlr',
    runId: 'run_ImpGgV56MTnYvxeBr6cNBJ6f',
  })

  const { data: entities } = useEntityDefinitionsQuery(
    {
      projectRef: selectedProject?.ref,
      connectionString: selectedProject?.connectionString,
    },
    { enabled: true, refetchOnWindowFocus: false }
  )

  const entityDefinitions = entities?.map((def) => def.sql.trim())

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
  const { mutate: addPrompt } = useRlsSuggestMutation({
    onSuccess: (data) => {
      setIds({ threadId: data.threadId, runId: data.runId })
    },
  })

  const acceptChange = useCallback(async () => {
    if (!modified) {
      return
    }

    // TODO: show error if undefined
    if (!editorRef.current || !diffEditorRef.current) {
      return
    }

    const editorModel = editorRef.current.getModel()
    const diffModel = diffEditorRef.current.getModel()

    if (!editorModel || !diffModel) {
      return
    }

    const sql = diffModel.modified.getValue()

    editorRef.current.executeEdits('apply-ai-edit', [
      {
        text: sql,
        range: editorModel.getFullModelRange(),
      },
    ])

    // setPolicy(sql)
    setModified(undefined)
  }, [modified])

  const policy = editorRef.current?.getValue()

  return (
    <SidePanel
      size={assistantVisible ? 'xxxxlarge' : 'large'}
      visible={visible}
      disabled
      hideFooter
    >
      <div className="flex flex-row h-full">
        <div className="flex flex-col w-screen max-w-2xl h-full border">
          <Header assistantVisible={assistantVisible} setAssistantVisible={setAssistantPanel} />
          {modified ? (
            <div className="px-5 py-3 flex justify-between gap-3 bg-muted">
              <div className="flex gap-2 items-center text-foreground-light">
                <FileDiff className="h-4 w-4 " />
                <span className="text-sm">Replace code</span>
              </div>
              <div className="flex gap-3">
                <Button type="default" onClick={() => setModified(undefined)}>
                  Discard
                </Button>
                <Button type="primary" onClick={() => acceptChange()}>
                  Apply
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex-1">
            {modified ? (
              <DiffEditor
                theme="supabase"
                language="pgsql"
                original={policy}
                modified={modified}
                onMount={(editor) => {
                  diffEditorRef.current = editor
                }}
                options={{
                  renderSideBySide: false,
                  scrollBeyondLastLine: false,
                }}
              />
            ) : null}

            <RLSCodeEditor
              id="rls-sql-policy"
              className={modified ? 'hidden' : ''}
              language="pgsql"
              defaultValue={''}
              options={{ scrollBeyondLastLine: false }}
              editorRef={editorRef}
            />
          </div>
          <Footer />
        </div>
        {assistantVisible && (
          <div className="w-full bg-surface-200">
            <Chat
              messages={isSuccess ? data.messages : []}
              onSubmit={(message: string) => {
                addPrompt(
                  ids?.threadId
                    ? {
                        thread_id: ids?.threadId,
                        prompt: message,
                      }
                    : {
                        thread_id: ids?.threadId,
                        entityDefinitions,
                        prompt: message,
                      }
                )
              }}
              onDiff={(v) => {
                setModified(v)
              }}
              loading={data?.status === 'loading'}
            />
          </div>
        )}
      </div>
    </SidePanel>
  )
})

AIPolicyEditorPanel.displayName = 'AIPolicyEditorPanel'
