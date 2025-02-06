import { useRef } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { useParams } from 'common'
import { IStandaloneCodeEditor } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { useEdgeFunctionDeployMutation } from 'data/edge-functions/edge-functions-deploy-mutation'
import { useEdgeFunctionUpdateMutation } from 'data/edge-functions/edge-functions-update-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { useAppStateSnapshot } from 'state/app-state'

const EdgeFunctionEditor = () => {
  const { ref } = useParams()
  const project = useSelectedProject()
  const { editorPanel, setEditorPanel } = useAppStateSnapshot()

  const editorRef = useRef<IStandaloneCodeEditor>()

  const { mutateAsync: deployFunction, isLoading: isDeploying } = useEdgeFunctionDeployMutation({
    onSuccess: () => {
      toast.success('Successfully deployed edge function')
    },
  })

  const { mutateAsync: updateFunction, isLoading: isUpdating } = useEdgeFunctionUpdateMutation({
    onSuccess: () => {
      toast.success('Successfully updated edge function')
    },
  })

  const onDeployFunction = async () => {
    if (!project?.ref || !editorPanel.functionName) return

    try {
      const code = editorRef.current?.getValue() ?? ''
      if (code.length === 0) return

      if (editorPanel.onSave) {
        editorPanel.onSave(code)
      }

      await deployFunction({
        projectRef: project.ref,
        metadata: {
          name: editorPanel.functionName,
          verify_jwt: false,
        },
        files: [{ name: 'index.ts', content: code }],
      })
    } catch (error) {
      toast.error(
        `Failed to deploy function: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  const onUpdateFunction = async () => {
    if (!project?.ref || !editorPanel.functionName) return

    try {
      const code = editorRef.current?.getValue() ?? ''
      if (code.length === 0) return

      if (editorPanel.onSave) {
        editorPanel.onSave(code)
      }

      await updateFunction({
        projectRef: project.ref,
        slug: editorPanel.functionName,
        payload: {
          name: editorPanel.functionName,
          verify_jwt: false,
        },
      })
    } catch (error) {
      toast.error(
        `Failed to update function: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="relative flex-grow flex flex-col">
        <div className="relative my-5 w-full flex-1">
          <CodeEditor
            id="editor-panel-typescript"
            language="typescript"
            editorRef={editorRef}
            defaultValue={editorPanel.initialValue}
          />
        </div>
      </div>
      <div className="bg-surface-100 flex items-center gap-2 !justify-end px-5 py-4 w-full border-t">
        <Button loading={isDeploying} onClick={onDeployFunction} disabled={isUpdating}>
          Deploy Function
        </Button>
        <Button loading={isUpdating} onClick={onUpdateFunction} disabled={isDeploying}>
          Update Function
        </Button>
      </div>
    </div>
  )
}

export default EdgeFunctionEditor
