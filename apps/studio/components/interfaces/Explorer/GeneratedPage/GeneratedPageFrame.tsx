import { type CSSProperties, type Ref } from 'react'
import { cn } from 'ui'

/**
 * Sandbox flags for a generated page, spelled out here because what is *absent* is the
 * point: no `allow-same-origin` (so the frame gets an opaque origin and cannot read the
 * parent DOM, cookies, or storage), no forms, no popups, no downloads, no top navigation.
 */
export const GENERATED_PAGE_SANDBOX = 'allow-scripts'

export interface GeneratedPageFrameProps {
  title: string
  /** Complete wrapper document from `buildGeneratedPageDocument`. */
  document: string
  ref: Ref<HTMLIFrameElement>
  /** Omit to let the frame fill its container instead of following its reported height. */
  height?: number
  className?: string
  onLoad: () => void
}

/** The sandboxed iframe a generated page runs in. Mount only after the user starts it. */
export const GeneratedPageFrame = ({
  title,
  document,
  ref,
  height,
  className,
  onLoad,
}: GeneratedPageFrameProps) => {
  const style: CSSProperties | undefined = height === undefined ? undefined : { height }

  return (
    <iframe
      ref={ref}
      title={title}
      data-testid="generated-page-frame"
      sandbox={GENERATED_PAGE_SANDBOX}
      srcDoc={document}
      onLoad={onLoad}
      className={cn('w-full bg-white', height === undefined && 'h-full', className)}
      style={style}
    />
  )
}
