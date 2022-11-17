import { basicSetup, EditorView } from 'codemirror'
import { keymap } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { json } from '@codemirror/lang-json'
import type { LanguageSupport } from '@codemirror/language'
import { Compartment, EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import React from 'react'
import { saveDraft, updateDraft } from './file-system'
import { currentFileWatcher } from './store'

let view = null
const languageConf = new Compartment()
const fixedHeightEditor = EditorView.theme({
  '&': { maxHeight: '100%', minHeight: '100%', height: '100%' },
  '.cm-scroller': { overflow: 'auto', minHeight: '100%' },
  '.cm-content': { minHeight: '100%' },
  '.cm-gutter': { minHeight: '100%' },
})

function newEditorState(content: string, lang: LanguageSupport, currentPath: string) {
  const saveKeymap = [
    {
      key: 'Mod-s',
      run: () => {
        saveDraft(currentPath)
        return true
      },
    },
  ]
  return {
    doc: content,
    extensions: [
      basicSetup,
      languageConf.of(lang),
      oneDark,
      fixedHeightEditor,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const content = view.state.doc.toString()
          updateDraft(currentPath, content)
        }
      }),
      keymap.of(saveKeymap),
    ],
  }
}

export function Editor({ className }) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    let currentPath = null

    view = new EditorView({
      parent: ref.current,
      ...newEditorState('', javascript({ jsx: true }), currentPath),
    })

    // remove grammarly
    const el = ref.current.getElementsByClassName('cm-content')[0]
    el.setAttribute('data-enable-grammarly', false)

    const cfs = currentFileWatcher.subscribe((entry) => {
      currentPath = entry.path

      const extension = entry.path.split('.').pop()
      const lang =
        extension === 'css'
          ? css()
          : extension === 'html'
          ? html()
          : extension === 'json'
          ? json()
          : extension === 'local'
          ? html()
          : javascript({ jsx: true })

      let newState = EditorState.create(newEditorState(entry.contents, lang, currentPath))
      view.setState(newState)
    })

    return () => {
      view.destroy()
      view = null
      cfs()
    }
  }, [])
  return <div ref={ref} className={className} />
}
