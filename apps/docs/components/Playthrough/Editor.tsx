import { basicSetup, EditorView } from 'codemirror'
import { keymap, Decoration, DecorationSet } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { json } from '@codemirror/lang-json'
import type { LanguageSupport } from '@codemirror/language'
import { Compartment, EditorState, StateField, StateEffect, Range } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import React from 'react'
import { saveDraft, updateDraft } from './file-system'
import { currentFileWatcher } from './store'

export function Editor({ className }) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => attach(ref.current), [])
  return <div ref={ref} className={className} />
}

const customizeTheme = EditorView.theme({
  '&': { maxHeight: '100%', minHeight: '100%', height: '100%' },
  '.cm-scroller': { overflow: 'auto', minHeight: '100%' },
  '.cm-content': { minHeight: '100%' },
  '.cm-gutter': { minHeight: '100%' },
  '.cm-new-code': { background: 'rgba(30, 200, 10, 0.2)' },
})

const newCodeMark = Decoration.mark({ class: 'cm-new-code' })
const newCodeEffect = StateEffect.define<Range<Decoration>[]>()
const newCodeExtension = StateField.define({
  create() {
    return Decoration.none
  },
  update(value, transaction) {
    value = value.map(transaction.changes)
    for (let effect of transaction.effects) {
      if (effect.is(newCodeEffect)) {
        value = value.update({ add: effect.value, sort: true })
      }
    }
    return value
  },
  provide: (f) => EditorView.decorations.from(f),
})

function newEditorState(content: string, lang: LanguageSupport, currentPath: string) {
  const draftExtension = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      updateDraft(currentPath, update.view.state.doc.toString())
    }
  })
  return {
    doc: content,
    extensions: [
      basicSetup,
      lang,
      oneDark,
      customizeTheme,
      draftExtension,
      keymap.of([{ key: 'Mod-s', run: () => saveDraft(currentPath) }]),
      newCodeExtension,
    ],
  }
}

function attach(parent: HTMLDivElement) {
  const view = new EditorView({ parent, ...newEditorState('', javascript(), null) })

  const el = parent.getElementsByClassName('cm-content')[0]
  el.setAttribute('data-enable-grammarly', 'false')

  let currentPath = null
  const unsubscribe = currentFileWatcher.subscribe((entry) => {
    const oldPath = currentPath
    const newPath = entry.path
    onFileChanged(oldPath, newPath, entry.contents, view)
    currentPath = entry.path
  })

  return () => {
    view.destroy()
    unsubscribe()
  }
}

function onFileChanged(oldPath: string, newPath: string, contents: string, view: EditorView) {
  const pathChanged = oldPath !== newPath

  if (!pathChanged) {
    const sameContent = view.state.doc.toString() === contents
    const update = view.state.update({
      changes: { from: 0, to: view.state.doc.length, insert: contents },
      effects: newCodeEffect.of([newCodeMark.range(0, 5)]),
    })
    view.dispatch(update)
  } else {
    const lang = guessLanguage(newPath)
    let newState = EditorState.create(newEditorState(contents, lang, newPath))
    view.setState(newState)
  }
}

function guessLanguage(path: string) {
  const extension = path.split('.').pop()
  switch (extension) {
    case 'css':
      return css()
    case 'html':
      return html()
    case 'json':
      return json()
    case 'local':
      return html()
    default:
      return javascript({ jsx: true })
  }
}
