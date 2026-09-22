import type { EditorThemeClasses } from 'lexical'

export const markdownEditorTheme: EditorThemeClasses = {
  code: 'block whitespace-pre-wrap rounded-md bg-surface-200 px-3 py-2 font-mono text-xs before:content-none after:content-none',
  list: {
    listitem: 'before:top-1/2 before:-translate-y-1/2 [ol>&]:before:content-[counter(item)]',
  },
  text: {
    strikethrough: 'line-through',
  },
}
