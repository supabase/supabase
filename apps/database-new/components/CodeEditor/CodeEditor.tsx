import Editor, { BeforeMount, EditorProps, OnMount } from '@monaco-editor/react'
import { merge } from 'lodash'
import { useTheme } from 'next-themes'
import { useEffect, useRef } from 'react'
import { format } from 'sql-formatter'
import { cn } from 'ui'

import { useAppStateSnapshot } from '@/lib/state'
import { getTheme } from './CodeEditor.utils'

interface MonacoEditorProps {
  id: string
  language: 'pgsql' | 'json' | 'html'
  autofocus?: boolean
  defaultValue?: string
  isReadOnly?: boolean
  onInputChange?: (value?: string) => void
  onInputRun?: (value: string) => void
  hideLineNumbers?: boolean
  loading?: boolean
  options?: EditorProps['options']
  value?: string
}

export const CodeEditor = ({ content = '' }: { content: string }) => {
  const snap = useAppStateSnapshot()
  const code = format(content, { language: 'postgresql' })

  useEffect(() => {
    snap.setSelectedCode(code)
  }, [code])

  return (
    <div
      className={cn(
        snap.hideCode ? 'max-w-0' : 'max-w-lg 2xl:max-w-xl',
        'w-full xl:border-l',
        'grow flex flex-col h-full'
      )}
    >
      <MonacoEditor id="sql-editor" language="pgsql" value={code} />
    </div>
  )
}

const MonacoEditor = ({
  id,
  language,
  defaultValue,
  hideLineNumbers = false,
  options,
  value,
}: MonacoEditorProps) => {
  const monacoRef = useRef<any>()
  const { resolvedTheme } = useTheme()

  const beforeMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco
    monaco.editor.defineTheme('supabase', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', background: '1f1f1f' },
        { token: '', background: '1f1f1f', foreground: 'd4d4d4' },
        { token: 'string.sql', foreground: '24b47e' },
        { token: 'comment', foreground: '666666' },
        { token: 'predefined.sql', foreground: 'D4D4D4' },
      ],
      colors: { 'editor.background': '#1f1f1f' },
    })
  }

  const onMount: OnMount = async (editor) => {
    // Add margin above first line
    editor.changeViewZones((accessor) => {
      accessor.addZone({
        afterLineNumber: 0,
        heightInPx: 4,
        domNode: document.createElement('div'),
      })
    })

    if (resolvedTheme) {
      const mode: any = getTheme(resolvedTheme)
      monacoRef.current.editor.defineTheme('supabase', mode)
    }
  }

  const optionsMerged = merge(
    {
      tabSize: 2,
      fontSize: 13,
      readOnly: true,
      minimap: { enabled: false },
      wordWrap: 'on',
      fixedOverflowWidgets: true,
      contextmenu: true,
      lineNumbers: hideLineNumbers ? 'off' : undefined,
      glyphMargin: hideLineNumbers ? false : undefined,
      lineNumbersMinChars: hideLineNumbers ? 0 : undefined,
      folding: hideLineNumbers ? false : undefined,
    },
    options
  )

  merge({ cpp: '12' }, { java: '23' }, { python: '35' })

  return (
    <Editor
      path={id}
      theme="supabase"
      className={cn('bg-alternative [&>div]:p-0')}
      value={value ?? undefined}
      defaultLanguage={language}
      defaultValue={defaultValue ?? undefined}
      loading={false}
      options={optionsMerged}
      beforeMount={beforeMount}
      onMount={onMount}
    />
  )
}
