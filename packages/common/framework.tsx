'use client'

import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  type ComponentPropsWithoutRef,
  type ComponentType,
  type CSSProperties,
  type ForwardedRef,
  type ReactNode,
  type RefAttributes,
} from 'react'

export interface StaticImageData {
  src: string
  height: number
  width: number
  blurDataURL?: string
  blurWidth?: number
  blurHeight?: number
}

export interface StaticRequire {
  default: StaticImageData
}

export type StaticImport = StaticRequire | StaticImageData

export interface FrameworkLinkProps extends Omit<ComponentPropsWithoutRef<'a'>, 'href'> {
  href: string
  prefetch?: boolean | null | 'auto'
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
}

export type FrameworkLinkComponent = ComponentType<
  FrameworkLinkProps & RefAttributes<HTMLAnchorElement>
>

export interface FrameworkImageProps extends Omit<
  ComponentPropsWithoutRef<'img'>,
  'src' | 'srcSet' | 'ref' | 'alt' | 'width' | 'height' | 'loading'
> {
  src: string | StaticImport
  alt: string
  width?: number | `${number}`
  height?: number | `${number}`
  fill?: boolean
  sizes?: string
  priority?: boolean
  preload?: boolean
  loading?: 'lazy' | 'eager'
  quality?: number | `${number}`
  placeholder?: 'blur' | 'empty' | `data:image/${string}`
  blurDataURL?: string
  unoptimized?: boolean
  overrideSrc?: string
}

export type FrameworkImageComponent = ComponentType<FrameworkImageProps>

export interface FrameworkContextValue {
  /** Framework Link component (e.g. next/link or TanStack Link). Defaults to `<a>`. */
  Link?: FrameworkLinkComponent
  /** Framework Image component (e.g. next/image). Defaults to `<img>`. */
  Image?: FrameworkImageComponent
  /** Current route pattern or pathname (e.g. `/project/[ref]` or `/guides/auth`). */
  pathname?: string
  /**
   * Current resolved path without basePath. Includes search and hash where the adapter can supply
   * them; Next App Router adapters supply the pathname only, since reading search params at the
   * root would opt static pages out of static rendering.
   */
  asPath?: string
  /** Whether dynamic route params are hydrated (Next Pages Router `router.isReady`). Defaults to `true`. */
  isReady?: boolean
  /** Current route and search params consumed by `useParams()`. */
  params?: Record<string, string | string[] | undefined>
  /** Programmatic client-side navigation. Falls back to `window.location.assign`. */
  push?: (path: string) => void | Promise<unknown>
}

function defaultPush(path: string) {
  if (typeof window !== 'undefined') {
    window.location.assign(path)
  }
}

const FrameworkContext = createContext<FrameworkContextValue | null>(null)

export function useFramework(): FrameworkContextValue &
  Required<Pick<FrameworkContextValue, 'push'>> {
  const context = useContext(FrameworkContext)
  return useMemo(() => ({ ...context, push: context?.push ?? defaultPush }), [context])
}

/** Whether a `FrameworkProvider` is mounted above. `useFramework()` falls back to defaults without one. */
export function useHasFrameworkProvider(): boolean {
  return useContext(FrameworkContext) !== null
}

export function FrameworkProvider({
  value,
  children,
}: {
  value: FrameworkContextValue
  children: ReactNode
}) {
  return <FrameworkContext.Provider value={value}>{children}</FrameworkContext.Provider>
}

export const DefaultFrameworkLink = forwardRef(function DefaultFrameworkLink(
  {
    href,
    prefetch: _prefetch,
    replace: _replace,
    scroll: _scroll,
    shallow: _shallow,
    children,
    ...rest
  }: FrameworkLinkProps,
  ref: ForwardedRef<HTMLAnchorElement>
) {
  return (
    <a ref={ref} href={href} {...rest}>
      {children}
    </a>
  )
})

export const FrameworkLink = forwardRef(function FrameworkLink(
  props: FrameworkLinkProps,
  ref: ForwardedRef<HTMLAnchorElement>
) {
  const { Link } = useFramework()
  const LinkComponent = Link ?? DefaultFrameworkLink
  return <LinkComponent ref={ref} {...props} />
})

export function resolveStaticImageSrc(src: string | StaticImport): string {
  if (typeof src === 'string') return src
  if ('default' in src) return src.default.src
  return src.src
}

export function DefaultFrameworkImage({
  src,
  alt,
  width,
  height,
  fill,
  sizes,
  priority,
  preload: _preload,
  loading,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  unoptimized: _unoptimized,
  overrideSrc: _overrideSrc,
  style,
  fetchPriority,
  ...rest
}: FrameworkImageProps) {
  const resolvedSrc = resolveStaticImageSrc(src)
  const finalStyle: CSSProperties | undefined = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }
    : style

  return (
    <img
      {...rest}
      src={resolvedSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      fetchPriority={priority ? 'high' : fetchPriority}
      style={finalStyle}
    />
  )
}

export function FrameworkImage(props: FrameworkImageProps) {
  const { Image } = useFramework()
  const ImageComponent = Image ?? DefaultFrameworkImage
  return <ImageComponent {...props} />
}
