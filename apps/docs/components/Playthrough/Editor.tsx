import { basicSetup, EditorView } from 'codemirror'
import { keymap } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { json } from '@codemirror/lang-json'
import { Compartment } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import React from 'react'
import { saveDraft, updateDraft } from './file-system'
import { currentFileWatcher } from './store'

let view = null
const languageConf = new Compartment()

export function Editor({ className }) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    const fixedHeightEditor = EditorView.theme({
      '&': { maxHeight: '100%', minHeight: '100%', height: '100%' },
      '.cm-scroller': { overflow: 'auto', minHeight: '100%' },
      '.cm-content': { minHeight: '100%' },
      '.cm-gutter': { minHeight: '100%' },
    })

    let currentPath = null

    const saveKeymap = [
      {
        key: 'Mod-s',
        run: () => {
          saveDraft(currentPath)
          return true
        },
      },
    ]

    view = new EditorView({
      doc: '',
      extensions: [
        basicSetup,
        languageConf.of(javascript({ jsx: true })),
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
      parent: ref.current,
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

      const update = view.state.update({
        changes: { from: 0, to: view.state.doc.length, insert: entry.contents },
        effects: languageConf.reconfigure(lang),
      })
      view.dispatch(update)
    })

    return () => {
      view.destroy()
      view = null
      cfs()
    }
  }, [])
  return <div ref={ref} className={className} />
}
