import { useEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'

// Next/Script handles ordering, deduplication, and load callbacks for
// third-party scripts. Under Vite we have no orchestrator — render a
// `<script>` and approximate the callback contract. Studio doesn't
// currently mount any <Script>, but the surface is shimmed
// comprehensively so the migration doesn't catch anyone out later.

type Strategy = 'beforeInteractive' | 'afterInteractive' | 'lazyOnload' | 'worker'

interface ScriptProps extends Omit<ComponentPropsWithoutRef<'script'>, 'children'> {
  // Accepted-and-dropped in this shim — the browser handles network
  // priority via the regular `<script>` element; we don't reorder.
  strategy?: Strategy
  // Children as the script body (inline scripts) are also accepted via
  // dangerouslySetInnerHTML; Next allows either. We honour both.
  children?: ReactNode
  onLoad?: (e: Event) => void
  onReady?: () => void
  onError?: (e: Event | string) => void
}

export default function Script({
  strategy: _strategy,
  children,
  dangerouslySetInnerHTML,
  onLoad,
  onError,
  onReady,
  src,
  id,
  ...rest
}: ScriptProps) {
  const ref = useRef<HTMLScriptElement | null>(null)
  const readyFiredRef = useRef(false)

  // onReady fires once the script has loaded (or immediately on mount
  // if it's already been loaded by a previous instance with the same
  // id). Approximate by firing once after mount when the element is
  // present and either has no src (inline) or has finished loading.
  useEffect(() => {
    const node = ref.current
    if (!node || !onReady || readyFiredRef.current) return
    if (!src) {
      // Inline script — body executed synchronously on mount.
      readyFiredRef.current = true
      onReady()
      return
    }
    if (node.dataset.loaded === 'true') {
      readyFiredRef.current = true
      onReady()
    }
  }, [onReady, src])

  const handleLoad = (e: Event | React.SyntheticEvent<HTMLScriptElement>) => {
    const node = ref.current
    if (node) node.dataset.loaded = 'true'
    onLoad?.(e as Event)
    if (onReady && !readyFiredRef.current) {
      readyFiredRef.current = true
      onReady()
    }
  }

  const handleError = (e: Event | React.SyntheticEvent<HTMLScriptElement>) => {
    onError?.(e as Event)
  }

  // For inline scripts, `children` is preferred over
  // dangerouslySetInnerHTML when both are present (matches Next).
  if (children !== undefined) {
    return (
      <script
        {...rest}
        id={id}
        ref={ref}
        onLoad={handleLoad}
        onError={handleError}
         
        dangerouslySetInnerHTML={{
          __html: typeof children === 'string' ? children : '',
        }}
      />
    )
  }

  return (
    <script
      {...rest}
      id={id}
      src={src}
      ref={ref}
      onLoad={handleLoad}
      onError={handleError}
      dangerouslySetInnerHTML={dangerouslySetInnerHTML}
    />
  )
}
