import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'

type DynamicOptions = {
  loading?: () => ReactNode
  ssr?: boolean
}

type Loader<P> = () => Promise<ComponentType<P>> | Promise<{ default: ComponentType<P> }>

function isDefaultExport<P>(
  value: ComponentType<P> | { default: ComponentType<P> }
): value is { default: ComponentType<P> } {
  return typeof value === 'object' && value !== null && 'default' in value
}

 
export default function dynamic<P extends object = {}>(
  loader: Loader<P>,
  options: DynamicOptions = {}
): ComponentType<P> {
  const { loading, ssr = true } = options

  const Lazy = lazy(() =>
    loader().then((mod) => (isDefaultExport<P>(mod) ? mod : { default: mod }))
  )

  return function DynamicComponent(props: P) {
    if (ssr === false && typeof window === 'undefined') return null
    return (
      <Suspense fallback={loading ? loading() : null}>
        <Lazy {...props} />
      </Suspense>
    )
  }
}
