import { FC, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'

import { timeout } from 'lib/helpers'
import Connecting from '../Loading'
import { alignEditor } from './CodeEditor.utils'

interface Props {
  id: string
  language: 'pgsql' | 'json'
  defaultValue?: string
  isReadOnly?: boolean
  onInputChange: (value?: string) => void
  onInputRun?: (value: string) => void
  hideLineNumbers?: boolean
}

const CodeEditor: FC<Props> = ({
  id,
  language,
  defaultValue,
  isReadOnly = false,
  hideLineNumbers = false,
  onInputChange = () => {},
  onInputRun = () => {},
}) => {
  const editorRef = useRef()

  useEffect(() => {
    if (editorRef.current) {
      // alignEditor(editorRef.current)
    }
  }, [id])

  const onMount = async (editor: any, monaco: any) => {
    alignEditor(editor)
    editor.addAction({
      id: 'supabase',
      label: 'Run Query',
      keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.Enter],
      contextMenuGroupId: 'operation',
      contextMenuOrder: 0,
      run: async () => {
        const selectedValue = (editorRef?.current as any)
          .getModel()
          .getValueInRange((editorRef?.current as any)?.getSelection())
        onInputRun(selectedValue || (editorRef?.current as any)?.getValue())
      },
    })

    await timeout(500)
    editor?.focus()
    editorRef.current = editor
  }

  return (
    <Editor
      path={id}
      theme="supabase"
      className="monaco-editor"
      defaultLanguage={language}
      defaultValue={defaultValue}
      loading={<Connecting />}
      options={{
        tabSize: 2,
        fontSize: 13,
        readOnly: isReadOnly,
        minimap: { enabled: false },
        wordWrap: 'on',
        fixedOverflowWidgets: true,
        contextmenu: true,
        lineNumbers: hideLineNumbers ? 'off' : undefined,
        glyphMargin: hideLineNumbers ? false : undefined,
        lineNumbersMinChars: hideLineNumbers ? 0 : undefined,
        folding: hideLineNumbers ? false : undefined,
      }}
      onMount={onMount}
      onChange={onInputChange}
    />
  )
}

export default CodeEditor
