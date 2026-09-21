# Markdown editor

A focused React editor for Markdown documents. Content stays editable in place. Selected ProseMirror modules handle selection, input, and history; Markdown remains the storage format.

## Usage

```tsx
import { MarkdownEditor } from 'markdown-editor'
import type { MarkdownEditorHandle } from 'markdown-editor/types'
import { useRef, useState } from 'react'

export function Notes() {
  const [markdown, setMarkdown] = useState('## Notes')
  const editor = useRef<MarkdownEditorHandle>(null)

  return (
    <div className="prose prose-sm max-w-none">
      <MarkdownEditor
        ref={editor}
        markdown={markdown}
        onChange={setMarkdown}
        aria-label="Notes"
        className="min-h-12 rounded-md focus-visible:outline"
      />
    </div>
  )
}
```

The consumer owns `prose`, typography, colors, width, and focus styling. The package renders semantic HTML and uses only structural Tailwind utilities. Include its `src` directory in your Tailwind sources. Neither Tailwind nor Typography is a runtime dependency. The component needs a browser to initialize; loading it lazily keeps its code outside unrelated routes.

## Editing

- Paragraphs, H1–H6, bullet/numbered lists, blockquotes, and fenced code blocks.
- Bold, italic, inline code, and safe links.
- Type a heading/list/quote prefix followed by a space to convert it. Type an opening code fence, optionally with a language, then Enter to create a code block.
- Undo/redo and formatting shortcuts are scoped to the document. Use Cmd/Ctrl+B for bold, Cmd/Ctrl+I for italic, and Cmd/Ctrl+backtick for inline code.
- Cmd/Ctrl+[ and Cmd/Ctrl+] change list indentation. Shift+Enter inserts a line break.
- Escape or Cmd/Ctrl+Enter leaves a code block. Arrow keys at its boundaries move back into the document. Backspace in an empty code block replaces it with a paragraph.

Images, tables, task lists, HTML, and other unsupported structures remain editable as literal source blocks. HTML is never executed. Opening a document does not rewrite its Markdown. Editing can normalize supported Markdown syntax; unsupported source slices are retained.

## Synchronization

`onDirty` runs immediately after a document edit. `onChange` receives serialized Markdown after 250 ms of inactivity, with a maximum delay of one second during continuous typing. Selection changes do not emit either callback. Blur outside the document, unmount, page hide, and document visibility changes flush pending edits.

Call `ref.current.flush()` before saving or exporting; it returns the latest Markdown and synchronously calls `onChange` when needed. Read fresh application state afterward. `getMarkdown()` reads without committing; `focus()` focuses the document.

An incoming `markdown` value replaces a clean document and resets history. An echo of the editor's current source preserves history. If an incoming value conflicts with pending edits, local edits are retained and `onConflict(incomingMarkdown)` runs. The consumer owns conflict resolution. `isReadOnly` disables editing.

## Custom code editors

Pass `components={{ CodeBlockEditor: YourEditor }}` with a stable component definition. The component receives `BlockEditorProps` from `markdown-editor/types`: value, language, read-only state, change/focus callbacks, and history/navigation controls.

Report code changes with `onChange(value, selection)` using character offsets. Implement `editorRef.focus(selection)` so selection can be restored. Route undo/redo to `onUndo`/`onRedo`, boundary navigation to `onExit`, and Backspace on an empty value to `onRemove`. These callbacks share the document's history. Wrap complex editor controls in `not-prose` and provide their own styles.

Studio's `NotebookCodeBlockEditor` adapts its existing Monaco editor. The package does not import Monaco, a syntax highlighter, or any other code editor. Its default is a plain textarea.

## Custom blocks

`extensions` accepts stable `MarkdownBlockExtension` definitions. Each has a unique `type`, a `parse(node, source)` matcher returning `{ value, language? }` or `null`, a reversible Markdown `serialize` function, and an `Editor` component with the same block contract. Custom matchers run before built-in mappings. `code` and `source` are reserved types.

Extensions represent leaf blocks with opaque text content. Their source must parse into one Markdown block. Nested editable schemas and custom input-rule registration are outside this initial API.

## Footprint

The initial production bundle measured approximately **97 KiB gzip**, including the Markdown codec and runtime dependencies, with React and React DOM external. This is a standalone measurement, not the incremental cost within Studio, which already shares Markdown dependencies. The package has no toolbar, collaboration, or image-upload dependencies.
