'use client'

import Editor, { BeforeMount, EditorProps, OnMount } from '@monaco-editor/react'
import { merge } from 'lodash'
import { useAppStateSnapshot } from '@/lib/state'
import { useTheme } from 'next-themes'
import { getTheme } from './CodeEditor.utils'
import { useEffect, useRef } from 'react'

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

  const snap = useAppStateSnapshot()
  snap.setSelectedCode(value ?? defaultValue ?? '')

  const beforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme('supabase', {
      base: resolvedTheme === 'dark' ? 'vs-dark' : 'vs',
      inherit: true,
      rules: [
        { token: '', background: resolvedTheme === 'dark' ? '1f1f1f' : 'f0f0f0' },
        {
          token: '',
          background: resolvedTheme === 'dark' ? '1f1f1f' : 'f0f0f0',
          foreground: resolvedTheme === 'dark' ? 'd4d4d4' : '444444',
        },
        { token: 'string.sql', foreground: '24b47e' },
        { token: 'comment', foreground: '666666' },
        { token: 'predefined.sql', foreground: resolvedTheme === 'dark' ? 'D4D4D4' : '444444' },
      ],
      colors: { 'editor.background': resolvedTheme === 'dark' ? '#1f1f1f' : '#f0f0f0' },
    })
  }

  // const onMount: OnMount = async (editor) => {
  //   console.log(editor)
  //   if (resolvedTheme) {
  //     const mode: any = getTheme(resolvedTheme)
  //     //monacoRef.current.editor.defineTheme('supabase', mode)
  //   }
  // }

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
      occurrencesHighlight: false,
      folding: hideLineNumbers ? false : undefined,
      renderLineHighlight: 'none',
      selectionHighlight: false,
    },
    options
  )

  merge({ cpp: '12' }, { java: '23' }, { python: '35' })

  return (
    <Editor
      path={id}
      theme="supabase"
      className={'bg-alternative [&>div]:p-0'}
      value={value ?? undefined}
      defaultLanguage={language}
      defaultValue={defaultValue ?? undefined}
      loading={false}
      options={optionsMerged}
      beforeMount={beforeMount}
      //onMount={onMount}
    />
  )
}

export { MonacoEditor }
