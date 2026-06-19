import {
  forwardRef,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ForwardedRef,
  type SyntheticEvent,
} from 'react'

import { BASE_PATH } from '@/lib/constants'

// Next/Image is a smart wrapper around `<img>` that handles automatic
// resizing, lazy loading, blur placeholders, and a CDN loader. Under
// Vite we don't run the Next image optimizer, so this shim degrades to
// a plain `<img>` while preserving the prop surface so consumer code
// compiles without modification.
//
// basePath: Next auto-prepends the configured basePath to absolute `src`
// values that point at app-served assets (the optimizer URL Next builds
// internally is itself prefixed). Our shim has no optimizer, so we
// prepend basePath directly on the rendered <img src> for absolute
// paths. Full URLs (http:, data:, etc.) and already-prefixed paths are
// left alone. When a custom `loader` is provided the loader is
// responsible for the final URL — Next behaves the same way.

type ImageLoaderProps = { src: string; width: number; quality?: number }
type ImageLoader = (props: ImageLoaderProps) => string

interface ImageProps extends Omit<ComponentPropsWithoutRef<'img'>, 'src' | 'alt' | 'loading'> {
  src: string | { src: string; width?: number; height?: number }
  alt: string
  width?: number | `${number}`
  height?: number | `${number}`
  fill?: boolean
  sizes?: string
  priority?: boolean
  loading?: 'lazy' | 'eager'
  quality?: number | `${number}`
  loader?: ImageLoader
  placeholder?: 'blur' | 'empty' | `data:image/${string}`
  blurDataURL?: string
  unoptimized?: boolean
  onLoadingComplete?: (img: HTMLImageElement) => void
}

function applyBasePath(src: string): string {
  if (!BASE_PATH) return src
  // Schemes (http:, https:, data:, blob:) and protocol-relative URLs.
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(src) || src.startsWith('//')) return src
  // Already prefixed — happens when callers manually prepend BASE_PATH
  // (several studio components do this today).
  if (src === BASE_PATH || src.startsWith(`${BASE_PATH}/`)) return src
  // Absolute app path — prepend.
  if (src.startsWith('/')) return `${BASE_PATH}${src}`
  // Relative path — leave alone.
  return src
}

function resolveSrc(
  src: ImageProps['src'],
  width?: ImageProps['width'],
  quality?: ImageProps['quality'],
  loader?: ImageLoader
): string {
  const raw = typeof src === 'string' ? src : src.src
  if (loader) {
    // Loader is the source of truth for the final URL — match Next and
    // don't auto-prepend basePath. The loader receives the original src.
    return loader({
      src: raw,
      width: typeof width === 'number' ? width : Number(width ?? 0),
      quality: quality !== undefined ? Number(quality) : undefined,
    })
  }
  return applyBasePath(raw)
}

const Image = forwardRef(function Image(
  {
    src,
    width,
    height,
    fill,
    sizes,
    priority,
    loading,
    quality,
    loader,
    placeholder: _placeholder,
    blurDataURL: _blurDataURL,
    unoptimized: _unoptimized,
    onLoad,
    onLoadingComplete,
    style,
    ...rest
  }: ImageProps,
  forwardedRef: ForwardedRef<HTMLImageElement>
) {
  const innerRef = useRef<HTMLImageElement | null>(null)

  // Keep the latest callback in a ref so firing doesn't depend on the
  // caller memoizing onLoadingComplete.
  const onLoadingCompleteRef = useRef(onLoadingComplete)
  useEffect(() => {
    onLoadingCompleteRef.current = onLoadingComplete
  })

  const resolvedSrc = resolveSrc(src, width, quality, loader)

  // Mirror Next's onLoadingComplete, firing at most once per resolved src.
  const firedForSrc = useRef<string | null>(null)
  const fireLoadingComplete = (img: HTMLImageElement) => {
    if (firedForSrc.current === resolvedSrc) return
    firedForSrc.current = resolvedSrc
    onLoadingCompleteRef.current?.(img)
  }

  const handleLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    onLoad?.(e)
    if (e.currentTarget) fireLoadingComplete(e.currentTarget)
  }

  // If the image is already cached (loaded synchronously before our
  // handler attaches), fire on mount so the contract holds. Keyed on src
  // so it re-arms when the image changes.
  useEffect(() => {
    const img = innerRef.current
    if (img?.complete && img.naturalWidth > 0) fireLoadingComplete(img)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedSrc])

  const finalStyle: CSSProperties | undefined = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }
    : style

  return (
    <img
      {...rest}
      ref={(node) => {
        innerRef.current = node
        if (typeof forwardedRef === 'function') forwardedRef(node)
        else if (forwardedRef) forwardedRef.current = node
      }}
      src={resolvedSrc}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      // Match Next's defaults: lazy unless priority/loading says otherwise.
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      fetchPriority={priority ? 'high' : rest.fetchPriority}
      style={finalStyle}
      onLoad={handleLoad}
    />
  )
})

// eslint-disable-next-line no-restricted-exports
export default Image
