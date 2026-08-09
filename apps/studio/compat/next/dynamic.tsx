import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'

type DynamicOptions = {
  loading?: () => ReactNode
  ssr?: boolean
  // Accepted-and-ignored: legacy/deprecated Next options. Listed so
  // call sites that pass them don't fail TypeScript.
  suspense?: boolean
  loadableGenerated?: unknown
}

type Loader<P> = () => Promise<ComponentType<P>> | Promise<{ default: ComponentType<P> }>

type DynamicComponent<P> = ComponentType<P> & {
  // Next stamps a `.preload()` on the returned component so consumers
  // can trigger the loader ahead of render (e.g. on hover). Returns a
  // promise that resolves when the loader settles.
  preload: () => Promise<void>
}

function isDefaultExport<P>(
  value: ComponentType<P> | { default: ComponentType<P> }
): value is { default: ComponentType<P> } {
  return typeof value === 'object' && value !== null && 'default' in value
}

// eslint-disable-next-line no-restricted-exports
export default function dynamic<P extends object = {}>(
  loader: Loader<P>,
  options: DynamicOptions = {}
): DynamicComponent<P> {
  const { loading, ssr = true } = options

  // Cache the in-flight loader promise so calling `preload()` and then
  // rendering doesn't kick off a second import. Matches Next's behaviour
  // where preload is essentially a head-start on the same module load.
  let cached: Promise<{ default: ComponentType<P> }> | null = null
  const load = () => {
    if (cached) return cached
    cached = loader().then((mod) => (isDefaultExport<P>(mod) ? mod : { default: mod }))
    return cached
  }

  const Lazy = lazy(load)

  function DynamicComponent(props: P) {
    if (ssr === false && typeof window === 'undefined') return null
    return (
      <Suspense fallback={loading ? loading() : null}>
        <Lazy {...props} />
      </Suspense>
    )
  }

  ;(DynamicComponent as DynamicComponent<P>).preload = () => load().then(() => undefined)

  return DynamicComponent as DynamicComponent<P>
}
