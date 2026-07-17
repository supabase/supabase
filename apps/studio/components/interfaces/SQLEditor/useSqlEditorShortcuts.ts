import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'

import { useSQLEditorContext } from './SQLEditorContext'
import { detectOS } from '@/lib/helpers'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

type UseSqlEditorShortcutsArgs = {
  isDiffOpen: boolean
  isPromptOpen: boolean
  prettifyQuery: () => void
  acceptAiHandler: () => void
  discardAiHandler: () => void
  resetPrompt: () => void
}

/**
 * Registers the SQL editor's keyboard shortcuts (focus editor, new snippet,
 * format) plus the window keydown that accepts/discards an open AI diff
 * or dismisses the prompt.
 */
export function useSqlEditorShortcuts({
  isDiffOpen,
  isPromptOpen,
  prettifyQuery,
  acceptAiHandler,
  discardAiHandler,
  resetPrompt,
}: UseSqlEditorShortcutsArgs) {
  const os = detectOS()
  const router = useRouter()
  const { ref } = useParams()
  const { editorRef, refocusEditor } = useSQLEditorContext()

  const openNewSnippet = useCallback(() => {
    if (!ref) return
    // skip=true bypasses the "load last visited snippet" redirect on /sql/new.
    // Without it, the effect in pages/project/[ref]/sql/[id].tsx bounces back
    // to the previous snippet.
    router.push(`/project/${ref}/sql/new?skip=true`)
  }, [ref, router])

  useShortcut(SHORTCUT_IDS.SQL_EDITOR_FOCUS_EDITOR, refocusEditor, {
    registerInCommandMenu: true,
  })

  useShortcut(SHORTCUT_IDS.SQL_EDITOR_NEW_SNIPPET, openNewSnippet, {
    registerInCommandMenu: true,
  })

  useShortcut(SHORTCUT_IDS.SQL_EDITOR_FORMAT, prettifyQuery, {
    registerInCommandMenu: true,
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isDiffOpen && !isPromptOpen) return

      switch (e.key) {
        case 'Enter':
          if ((os === 'macos' ? e.metaKey : e.ctrlKey) && isDiffOpen) {
            acceptAiHandler()
            resetPrompt()
          }
          return
        case 'Escape':
          if (isDiffOpen) discardAiHandler()
          resetPrompt()
          editorRef.current?.focus()
          return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editorRef, os, isDiffOpen, isPromptOpen, acceptAiHandler, discardAiHandler, resetPrompt])
}
