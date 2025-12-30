# supabase.com

## Overview

Refer to the [Development Guide](../../DEVELOPERS.md) to learn how to run this site locally.

To get started copy the example env file using `cp .env.local.example .env.local`.

## Best practices

### Images

- **Resize images**: All new images should be resized to only the maximum resolution needed when rendering on the frontend. Don't upload images larger than what will be displayed.
- **Compress images**: All new images should be compressed before committing. Use tools like Clop or ImageOptim to reduce file size without noticeable quality loss.
- **Image locations**: Store blog post images in `apps/www/public/images/blog/`. Event images go in `apps/www/public/images/events/`.

### Content frontmatter image fields

Different content types use different image field conventions:

#### Blog posts

Blog posts support two image fields in their frontmatter:

- **`imgSocial`**: Used for OpenGraph and social media sharing (X, LinkedIn, etc.). These images should include text overlays since they appear standalone in social feeds without accompanying text.
- **`imgSite`**: Used for internal thumbnails displayed on the blog listing pages and featured posts. These images don't need text overlays since they're always displayed alongside the post title and description.

**Image path format**

- Always use **relative paths** (just the filename or subfolder/filename)
- The `/images/blog/` prefix is added automatically by the code
- ✅ Correct: `imgSocial: my-post/og.png` or `imgSocial: og.png`
- ❌ Wrong: `imgSocial: /images/blog/my-post/og.png` (creates double prefix)

**Image fallback behavior**

For site display (what visitors see):

- Priority 1: `imgSite`
- Priority 2: `imgSocial` (if `imgSite` is missing)
- Priority 3: `/images/blog/blog-placeholder.png` (if both missing)

For social sharing (OpenGraph meta tags):

- Priority 1: `imgSocial`
- Priority 2: `imgSite` (if `imgSocial` is missing)
- Priority 3: No fallback (undefined)

Special case for CMS posts:

- CMS posts may also have a `meta.image` field which takes highest priority for social sharing when available.

What happens if fields are not provided?

- If only `imgSite` is provided: Site displays the image correctly, social sharing uses `imgSite` as fallback
- If only `imgSocial` is provided: Social sharing uses it, site display uses it as fallback
- If neither is provided: Site shows placeholder image, social sharing has no image
- Best practice: Provide both fields for optimal display and social sharing

**Example**

```yaml
---
title: 'My Blog Post'
imgSocial: 2025-01-01-my-post/og.png # Relative path - with text overlay for social sharing
imgSite: 2025-01-01-my-post/thumb.png # Relative path - without text, clean image
---
```

The images would be stored at:

- `apps/www/public/images/blog/2025-01-01-my-post/og.png`
- `apps/www/public/images/blog/2025-01-01-my-post/thumb.png`

Or if using the same image for both:

```yaml
---
title: 'My Blog Post'
imgSocial: my-image.png # Stored at: apps/www/public/images/blog/my-image.png
imgSite: my-image.png
---
```

#### Events

Events use different image fields to avoid confusion with their display patterns:

- **`thumb`**: Used for event grid item thumbnails (small cards in listing)
- **`cover_url`**: Used for the featured event banner (large display on events page)

These serve genuinely different display purposes (thumbnail vs banner), unlike blog posts where both fields serve similar purposes in different contexts.

**Example:**

```yaml
---
title: 'Supabase Meetup'
thumb: /images/events/2025-01-meetup/thumbnail.png
cover_url: https://external-cdn.com/event-banner.jpg
---
```

#### Case studies

Case studies are defined in `data/CustomerStories.ts` and use a different field name:

- **`imgUrl`**: Path to the case study image in the source data
- This gets mapped to `imgSite` when rendered via `BlogGridItem` component
- Case studies only need one image for site display (no separate social sharing image)

**Example** (in `data/CustomerStories.ts`):

```typescript
{
  type: 'Customer Story',
  title: 'Company ABC built their platform with Supabase',
  description: '...',
  organization: 'Company ABC',
  imgUrl: 'images/customers/logos/company-abc.png', // Full path from public/
  logo: '/images/customers/logos/company-abc.png',
  url: '/customers/company-abc',
}
```
