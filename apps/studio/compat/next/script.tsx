import { useEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'

// Next/Script handles ordering, deduplication, and load callbacks for
// third-party scripts. Under Vite we have no orchestrator — render a
// `<script>` and approximate the callback contract. Studio doesn't
// currently mount any <Script>, but the surface is shimmed
// comprehensively so the migration doesn't catch anyone out later.

type Strategy = 'beforeInteractive' | 'afterInteractive' | 'lazyOnload' | 'worker'

interface ScriptProps extends Omit<
  ComponentPropsWithoutRef<'script'>,
  'children' | 'onLoad' | 'onError'
> {
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

// eslint-disable-next-line no-restricted-exports
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
    // This shim mirrors next/script for the TanStack build (where vite aliases
    // `next/script` to this file via nextCompat). Call sites that opt for an
    // explicit `async`/`defer` already pass it through via {...rest}; we don't
    // force one here because Next's <Script> doesn't either at this layer.
    // eslint-disable-next-line @next/next/no-sync-scripts
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
