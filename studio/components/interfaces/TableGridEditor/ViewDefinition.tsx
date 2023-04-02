import { useRef } from 'react'
import Editor from '@monaco-editor/react'
import { timeout } from 'lib/helpers'
import { useStore } from 'hooks'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useViewDefinitionQuery } from 'data/database/view-definition-query'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'

export interface ViewDefinitionProps {
  name: string
}

const ViewDefinition = ({ name }: ViewDefinitionProps) => {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)

  const { ui } = useStore()
  const { isDarkTheme } = ui

  const { project } = useProjectContext()
  const { data: definition, isLoading } = useViewDefinitionQuery({
    name,
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const handleEditorOnMount = async (editor: any, monaco: any) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // add margin above first line
    editor.changeViewZones((accessor: any) => {
      accessor.addZone({
        afterLineNumber: 0,
        heightInPx: 4,
        domNode: document.createElement('div'),
      })
    })

    // when editor did mount, it will need a delay before focus() works properly
    await timeout(500)
    editor?.focus()
  }

  if (isLoading) {
    return (
      <div className="py-4 space-y-2">
        <ShimmeringLoader />
        <ShimmeringLoader className="w-3/4" />
        <ShimmeringLoader className="w-1/2" />
      </div>
    )
  }

  return (
    <div className="flex-grow overflow-y-auto border-t border-scale-400">
      <Editor
        className="monaco-editor"
        theme={isDarkTheme ? 'vs-dark' : 'vs'}
        onMount={handleEditorOnMount}
        defaultLanguage="pgsql"
        defaultValue={definition}
        path={''}
        options={{
          domReadOnly: true,
          readOnly: true,
          tabSize: 2,
          fontSize: 13,
          minimap: { enabled: false },
          wordWrap: 'on',
          fixedOverflowWidgets: true,
        }}
      />
    </div>
  )
}

export default ViewDefinition
