import Editor, { Monaco, OnChange, OnMount, useMonaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { MutableRefObject, useEffect, useRef } from 'react'
import { cn } from 'ui'

import { Markdown } from 'components/interfaces/Markdown'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { formatQuery } from 'data/sql/format-sql-query'
import { noop } from 'lodash'

// [Joshen] Is there a way we can just have one single MonacoEditor component that's shared across the dashboard?
// Feels like we're creating multiple copies of Editor. I'm keen to make this one the defacto as well so lets make sure
// this component does not have RLS specific logic

interface RLSCodeEditorProps {
  id: string
  defaultValue?: string
  onInputChange?: (value?: string) => void
  wrapperClassName?: string
  className?: string
  value?: string
  placeholder?: string
  readOnly?: boolean

  disableTabToUsePlaceholder?: boolean
  lineNumberStart?: number
  onChange?: () => void
  onMount?: () => void

  editorRef: MutableRefObject<editor.IStandaloneCodeEditor | null>
  monacoRef?: MutableRefObject<Monaco>
  editView: 'templates' | 'conversation' // someone help
}

const RLSCodeEditor = ({
  id,
  defaultValue,
  wrapperClassName,
  className,
  value,
  placeholder,
  readOnly = false,

  disableTabToUsePlaceholder = false,
  lineNumberStart,
  onChange = noop,
  onMount: _onMount = noop,

  editorRef,
  monacoRef,
  editView,
}: RLSCodeEditorProps) => {
  const hasValue = useRef<any>()
  const monaco = useMonaco()
  const { project } = useProjectContext()

  const placeholderId = `monaco-placeholder-${id}`
  const options: editor.IStandaloneEditorConstructionOptions = {
    tabSize: 2,
    fontSize: 13,
    readOnly,
    minimap: { enabled: false },
    wordWrap: 'on' as const,
    contextmenu: true,
    lineNumbers:
      lineNumberStart !== undefined ? (num) => (num + lineNumberStart).toString() : undefined,
    glyphMargin: undefined,
    lineNumbersMinChars: 4,
    folding: undefined,
    scrollBeyondLastLine: false,
  }

  const onMount: OnMount = async (editor, monaco) => {
    editorRef.current = editor
    if (monacoRef !== undefined) monacoRef.current = monaco

    hasValue.current = editor.createContextKey('hasValue', false)
    const placeholderEl = document.getElementById(placeholderId) as HTMLElement | null
    if (placeholderEl && placeholder !== undefined && (value ?? '').trim().length === 0) {
      placeholderEl.style.display = 'block'
    }

    if (!disableTabToUsePlaceholder) {
      editor.addCommand(
        monaco.KeyCode.Tab,
        () => {
          editor.executeEdits('source', [
            {
              // @ts-ignore
              identifier: 'add-placeholder',
              range: new monaco.Range(1, 1, 1, 1),
              text: (placeholder ?? '')
                .split('\n\n')
                .join('\n')
                .replaceAll('*', '')
                .replaceAll('&nbsp;', ''),
            },
          ])
        },
        '!hasValue'
      )
    }

    editor.focus()

    _onMount()
  }

  const onChangeContent: OnChange = (value) => {
    hasValue.current.set((value ?? '').length > 0)

    const placeholderEl = document.getElementById(placeholderId) as HTMLElement | null
    if (placeholderEl) {
      if (!value) {
        placeholderEl.style.display = 'block'
      } else {
        placeholderEl.style.display = 'none'
      }
    }

    onChange()
  }

  // when the value has changed, trigger the onChange callback so that the height of the container can be adjusted.
  // Happens when the value wordwraps and is updated via a template.
  useEffect(() => {
    onChange()
  }, [value])

  async function formatPgsql(value: any) {
    try {
      const formatted = await formatQuery({
        projectRef: project?.ref!,
        connectionString: project?.connectionString,
        sql: value,
      })
      return formatted
    } catch (error) {
      console.error('formatPgsql error:', error)
      return value
    }
  }

  useEffect(() => {
    if (monaco) {
      // Enable pgsql format
      const formatprovider = monaco.languages.registerDocumentFormattingEditProvider('pgsql', {
        async provideDocumentFormattingEdits(model: any) {
          const value = model.getValue()
          const formatted = await formatPgsql(value)
          return [
            {
              range: model.getFullModelRange(),
              text: formatted.result.trim(),
            },
          ]
        },
      })

      return () => {
        formatprovider.dispose()
      }
    }
  }, [monaco])

  useEffect(() => {
    if (value !== undefined && value.trim().length > 0) {
      const placeholderEl = document.getElementById(placeholderId) as HTMLElement | null
      if (placeholderEl) placeholderEl.style.display = 'none'
    }
  }, [value])

  return (
    <>
      <Editor
        path={id}
        theme="supabase"
        wrapperProps={{ className: cn(wrapperClassName) }}
        className={cn(className, 'monaco-editor')}
        value={value ?? undefined}
        defaultLanguage="pgsql"
        defaultValue={defaultValue ?? undefined}
        options={options}
        onMount={onMount}
        onChange={onChangeContent}
      />
      {placeholder !== undefined && (
        <div
          id={placeholderId}
          className={cn(
            'monaco-placeholder absolute top-[0px] left-[57px] text-sm pointer-events-none font-mono tracking-tighter',
            '[&>div>p]:text-foreground-lighter [&>div>p]:!m-0'
          )}
          style={{ display: 'none' }}
        >
          <Markdown content={placeholder} />
        </div>
      )}
    </>
  )
}

export default RLSCodeEditor
