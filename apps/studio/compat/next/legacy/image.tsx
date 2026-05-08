import {
  forwardRef,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ForwardedRef,
  type SyntheticEvent,
} from 'react'

// `next/legacy/image` is the pre-Next-13 Image API. Functionally similar
// to `next/image` but with `layout` and `objectFit`/`objectPosition`
// props instead of `fill` + style. Same shim approach: degrade to a
// plain <img> with the prop surface preserved.

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

function resolveSrc(
  src: ImageProps['src'],
  width?: ImageProps['width'],
  quality?: ImageProps['quality'],
  loader?: ImageLoader
): string {
  const raw = typeof src === 'string' ? src : src.src
  if (!loader) return raw
  return loader({
    src: raw,
    width: typeof width === 'number' ? width : Number(width ?? 0),
    quality: quality !== undefined ? Number(quality) : undefined,
  })
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

  const handleLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    onLoad?.(e)
    if (onLoadingComplete && e.currentTarget) {
      onLoadingComplete(e.currentTarget)
    }
  }

  useEffect(() => {
    const img = innerRef.current
    if (!onLoadingComplete || !img) return
    if (img.complete && img.naturalWidth > 0) onLoadingComplete(img)
  }, [onLoadingComplete])

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
      src={resolveSrc(src, width, quality, loader)}
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

export default Image
