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

// `next/legacy/image` is the pre-Next-13 Image API. Functionally similar
// to `next/image` but with `layout` and `objectFit`/`objectPosition`
// props instead of `fill` + style. Same shim approach: degrade to a
// plain <img> with the prop surface preserved.
//
// basePath: see the matching note in ../image.tsx — absolute `src`
// values are auto-prefixed with the configured basePath; full URLs and
// already-prefixed paths pass through; loader-produced URLs are not
// touched.

type ImageLoaderProps = { src: string; width: number; quality?: number }
type ImageLoader = (props: ImageLoaderProps) => string

type Layout = 'fill' | 'fixed' | 'intrinsic' | 'responsive'
type ObjectFit = CSSProperties['objectFit']

interface ImageProps extends Omit<ComponentPropsWithoutRef<'img'>, 'src' | 'alt' | 'loading'> {
  src: string | { src: string }
  alt: string
  width?: number | `${number}`
  height?: number | `${number}`
  layout?: Layout
  objectFit?: ObjectFit
  objectPosition?: CSSProperties['objectPosition']
  priority?: boolean
  loading?: 'lazy' | 'eager'
  quality?: number | `${number}`
  loader?: ImageLoader
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  unoptimized?: boolean
  sizes?: string
  onLoadingComplete?: (img: HTMLImageElement) => void
}

function applyBasePath(src: string): string {
  if (!BASE_PATH) return src
  // Schemes (http:, https:, data:, blob:) and protocol-relative URLs.
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(src) || src.startsWith('//')) return src
  if (src === BASE_PATH || src.startsWith(`${BASE_PATH}/`)) return src
  if (src.startsWith('/')) return `${BASE_PATH}${src}`
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
    layout,
    objectFit,
    objectPosition,
    priority,
    loading,
    quality,
    loader,
    placeholder: _placeholder,
    blurDataURL: _blurDataURL,
    unoptimized: _unoptimized,
    sizes,
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

  // Fire onLoadingComplete at most once per resolved src, matching Next's
  // once-per-load contract.
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

  // Catch the cached-image case where the load event fired before our
  // handler attached. Keyed on src so it re-arms when the image changes.
  useEffect(() => {
    const img = innerRef.current
    if (img?.complete && img.naturalWidth > 0) fireLoadingComplete(img)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedSrc])

  const layoutStyle: CSSProperties | undefined =
    layout === 'fill'
      ? { position: 'absolute', inset: 0, width: '100%', height: '100%' }
      : layout === 'responsive'
        ? { width: '100%', height: 'auto' }
        : undefined

  const finalStyle: CSSProperties | undefined =
    layoutStyle || objectFit || objectPosition || style
      ? { ...layoutStyle, objectFit, objectPosition, ...style }
      : undefined

  return (
    <img
      {...rest}
      ref={(node) => {
        innerRef.current = node
        if (typeof forwardedRef === 'function') forwardedRef(node)
        else if (forwardedRef) forwardedRef.current = node
      }}
      src={resolvedSrc}
      width={layout === 'fill' ? undefined : width}
      height={layout === 'fill' ? undefined : height}
      sizes={sizes}
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      fetchPriority={priority ? 'high' : rest.fetchPriority}
      style={finalStyle}
      onLoad={handleLoad}
    />
  )
})

// eslint-disable-next-line no-restricted-exports
export default Image
