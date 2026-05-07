import { describe, expect, it, vi } from 'vitest'

import {
  BLOG_PLACEHOLDER_IMAGE,
  getAbsoluteBlogSocialImage,
  getBlogSocialImage,
  getBlogThumbnailImage,
  resolveBlogImagePath,
  validateBlogFrontmatterImages,
} from './blog-images'

describe('blog image helpers', () => {
  it('prefers imgThumb for on-site blog thumbnails', () => {
    expect(
      getBlogThumbnailImage({
        imgThumb: 'example/thumb.png',
        imgSocial: 'example/og.png',
      })
    ).toBe('/images/blog/example/thumb.png')
  })

  it('falls back to imgSocial for on-site blog thumbnails', () => {
    expect(
      getBlogThumbnailImage({
        imgSocial: 'example/og.png',
      })
    ).toBe('/images/blog/example/og.png')
  })

  it('prefers imgSocial for social metadata', () => {
    expect(
      getBlogSocialImage({
        imgThumb: 'example/thumb.png',
        imgSocial: 'example/og.png',
      })
    ).toBe('/images/blog/example/og.png')
  })

  it('returns absolute URLs unchanged and prefixes relative paths', () => {
    expect(resolveBlogImagePath('https://example.com/og.png')).toBe('https://example.com/og.png')
    expect(resolveBlogImagePath('/images/blog/example/og.png')).toBe('/images/blog/example/og.png')
    expect(resolveBlogImagePath('example/og.png')).toBe('/images/blog/example/og.png')
  })

  it('builds absolute social image URLs', () => {
    expect(
      getAbsoluteBlogSocialImage(
        {
          imgSocial: 'example/og.png',
        },
        'https://supabase.com'
      )
    ).toBe('https://supabase.com/images/blog/example/og.png')
  })

  it('uses the placeholder when neither image is present', () => {
    expect(getBlogThumbnailImage({})).toBe(BLOG_PLACEHOLDER_IMAGE)
    expect(getBlogThumbnailImage({}, { fallbackToPlaceholder: false })).toBeUndefined()
  })

  it('warns when blog frontmatter is missing one of the image fields', () => {
    const warn = vi.fn()

    validateBlogFrontmatterImages(
      {
        imgThumb: 'example/thumb.png',
      },
      '/tmp/example-post.mdx',
      warn
    )

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('missing "imgSocial"'))
  })

  it('warns when a blog image uses the prefixed public path', () => {
    const warn = vi.fn()

    validateBlogFrontmatterImages(
      {
        imgThumb: '/images/blog/example/thumb.png',
        imgSocial: 'example/og.png',
      },
      '/tmp/example-prefixed-post.mdx',
      warn
    )

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('should not include the "/images/blog/" prefix')
    )
  })
})
