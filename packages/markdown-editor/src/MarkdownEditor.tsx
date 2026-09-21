'use client'

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'

import { BlockViews, createBlockStore } from './components/BlockViews'
import { createMarkdownView } from './createEditor'
import type { MarkdownEditorProps } from './types'

export function MarkdownEditor(props: MarkdownEditorProps) {
  const mount = useRef<HTMLDivElement>(null)
  const latest = useRef(props)
  const editor = useRef<ReturnType<typeof createMarkdownView> | null>(null)
  const [blocks] = useState(createBlockStore)
  useLayoutEffect(() => {
    latest.current = props
  })

  useImperativeHandle(
    props.ref,
    () => ({
      focus: () => editor.current?.focus(),
      getMarkdown: () => editor.current?.getMarkdown() ?? latest.current.markdown,
      flush: () => editor.current?.flush() ?? latest.current.markdown,
    }),
    []
  )

  useEffect(() => {
    if (!mount.current) return
    const instance = createMarkdownView(mount.current, () => latest.current, blocks)
    editor.current = instance
    return () => {
      instance.destroy()
      editor.current = null
    }
  }, [blocks])
  useEffect(() => {
    editor.current?.receive(props.markdown)
  }, [props.markdown, props.className, props.isReadOnly])

  return (
    <>
      <div ref={mount} />
      <BlockViews
        store={blocks}
        components={props.components}
        extensions={props.extensions}
        isReadOnly={props.isReadOnly}
      />
    </>
  )
}
