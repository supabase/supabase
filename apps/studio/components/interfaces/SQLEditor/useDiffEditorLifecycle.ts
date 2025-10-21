import { MutableRefObject, useCallback, useEffect } from 'react'

import { IStandaloneCodeEditor, IStandaloneDiffEditor } from './SQLEditor.types'

interface UseDiffEditorLifecycleParams {
  editorRef: MutableRefObject<IStandaloneCodeEditor | null>
  diffEditorRef: MutableRefObject<IStandaloneDiffEditor | null>
  isDiffOpen: boolean
  closeDiffState: () => void
  onDiffCleared?: () => void
}

// This one's meant to solve a UI issue that seems to only be happening locally
// Happens when you use the inline assistant in the SQL Editor and accept the suggestion
// Error: TextModel got disposed before DiffEditorWidget model got reset
export const useDiffEditorLifecycle = ({
  editorRef,
  diffEditorRef,
  isDiffOpen,
  closeDiffState,
  onDiffCleared,
}: UseDiffEditorLifecycleParams) => {
  const disposeDiffEditorModel = useCallback(() => {
    const diffEditor = diffEditorRef.current
    if (!diffEditor) return

    const model = diffEditor.getModel()
    if (model) {
      diffEditor.setModel(null)

      const primaryModel = editorRef.current?.getModel()
      if (model.original && model.original !== primaryModel) {
        model.original.dispose()
      }
      if (model.modified && model.modified !== primaryModel) {
        model.modified.dispose()
      }
    }

    diffEditorRef.current = null
    onDiffCleared?.()
  }, [diffEditorRef, editorRef, onDiffCleared])

  const closeDiff = useCallback(() => {
    disposeDiffEditorModel()
    closeDiffState()
  }, [disposeDiffEditorModel, closeDiffState])

  useEffect(() => {
    if (!isDiffOpen) {
      disposeDiffEditorModel()
    }

    return disposeDiffEditorModel
  }, [isDiffOpen, disposeDiffEditorModel])

  return { closeDiff }
}

export default useDiffEditorLifecycle
