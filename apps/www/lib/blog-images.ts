import { SITE_ORIGIN } from './constants'

type BlogImageFields = {
  imgSocial?: string
  imgThumb?: string
}

type ValidationWarn = (message?: unknown, ...optionalParams: unknown[]) => void

const warnedBlogImageIssues = new Set<string>()

export const BLOG_PLACEHOLDER_IMAGE = '/images/blog/blog-placeholder.png'
export const BLOG_GRID_IMAGE_SIZES = '(max-width: 1023px) 100vw, (max-width: 1279px) 50vw, 33vw'
export const BLOG_FEATURED_IMAGE_SIZES = '(max-width: 1023px) 100vw, 42vw'
export const BLOG_POST_HERO_IMAGE_SIZES = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'

function isAbsoluteUrl(image: string) {
  return image.startsWith('http://') || image.startsWith('https://')
}

function warnOnce(key: string, message: string, warn: ValidationWarn) {
  if (warnedBlogImageIssues.has(key)) return

  warnedBlogImageIssues.add(key)
  warn(message)
}

export function resolveBlogImagePath(image: string) {
  if (isAbsoluteUrl(image) || image.startsWith('/')) {
    return image
  }

  return `/images/blog/${image}`
}

export function toAbsoluteBlogImageUrl(image: string, siteOrigin: string = SITE_ORIGIN) {
  const resolvedImage = resolveBlogImagePath(image)

  if (isAbsoluteUrl(resolvedImage)) {
    return resolvedImage
  }

  return `${siteOrigin}${resolvedImage}`
}

export function getBlogThumbnailImage(
  { imgThumb, imgSocial }: BlogImageFields,
  options: { fallbackToPlaceholder?: boolean } = {}
) {
  const image = imgThumb || imgSocial

  if (!image) {
    return options.fallbackToPlaceholder === false ? undefined : BLOG_PLACEHOLDER_IMAGE
  }

  return resolveBlogImagePath(image)
}

export function getBlogSocialImage({ imgThumb, imgSocial }: BlogImageFields) {
  const image = imgSocial || imgThumb
  return image ? resolveBlogImagePath(image) : undefined
}

/**
 * Build-time ID appended to OG image URLs that point to the dynamic
 * `generate-og` Edge Function. A fresh value on every deploy forces
 * social-media crawlers (X, LinkedIn, etc.) to bypass their image cache.
 */
const buildId = Date.now()

export function getAbsoluteBlogSocialImage(
  { imgThumb, imgSocial }: BlogImageFields,
  siteOrigin: string = SITE_ORIGIN
) {
  const image = imgSocial || imgThumb
  if (!image) return undefined

  const url = toAbsoluteBlogImageUrl(image, siteOrigin)

  // Only bust cache for the dynamic OG function, not static images
  if (url.includes('/functions/v1/generate-og')) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}v=${buildId}`
  }

  return url
}

export function validateBlogFrontmatterImages(
  frontmatter: BlogImageFields,
  filePath: string,
  warn: ValidationWarn = console.warn
) {
  const hasImgSocial = typeof frontmatter.imgSocial !== 'undefined'
  const hasImgThumb = typeof frontmatter.imgThumb !== 'undefined'

  if (hasImgSocial && !hasImgThumb) {
    warnOnce(
      `${filePath}:imgThumb:missing`,
      `[blog images] ${filePath}: missing "imgThumb". Adding it keeps on-site thumbnails separate from social previews.`,
      warn
    )
  }

  if (hasImgThumb && !hasImgSocial) {
    warnOnce(
      `${filePath}:imgSocial:missing`,
      `[blog images] ${filePath}: missing "imgSocial". Adding it keeps social previews separate from on-site thumbnails.`,
      warn
    )
  }

  const imageFields = [
    ['imgSocial', frontmatter.imgSocial],
    ['imgThumb', frontmatter.imgThumb],
  ] as const

  for (const [fieldName, imageValue] of imageFields) {
    if (typeof imageValue === 'undefined') {
      continue
    }

    if (typeof imageValue !== 'string') {
      warnOnce(
        `${filePath}:${fieldName}:invalid-type`,
        `[blog images] ${filePath}: "${fieldName}" should be a string URL or a relative blog image path.`,
        warn
      )
      continue
    }

    const trimmedValue = imageValue.trim()

    if (!trimmedValue) {
      warnOnce(
        `${filePath}:${fieldName}:empty`,
        `[blog images] ${filePath}: "${fieldName}" is empty. Remove it or provide a valid image path.`,
        warn
      )
      continue
    }

    if (trimmedValue.startsWith('/images/blog/')) {
      warnOnce(
        `${filePath}:${fieldName}:prefixed`,
        `[blog images] ${filePath}: "${fieldName}" should not include the "/images/blog/" prefix. Use a relative path like "my-post/og.png" instead.`,
        warn
      )
    }

    if (trimmedValue.startsWith('./') || trimmedValue.startsWith('../')) {
      warnOnce(
        `${filePath}:${fieldName}:relative-dot`,
        `[blog images] ${filePath}: "${fieldName}" should use a clean relative blog path, not "${trimmedValue}".`,
        warn
      )
    }
  }
}
