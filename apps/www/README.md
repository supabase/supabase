# supabase.com

## Overview

Refer to the [Development Guide](../../DEVELOPERS.md) to learn how to run this site locally.

To get started copy the example env file using `cp .env.local.example .env.local`.

## Best practices

### Images

- **Resize images**: All new images should be resized to only the maximum resolution needed when rendering on the frontend. Don't upload images larger than what will be displayed.
- **Compress images**: All new images should be compressed before committing. Use tools like ImageOptim, TinyPNG, or similar to reduce file size without noticeable quality loss.

### Blog post frontmatter

Blog posts support two image fields in their frontmatter:

- **`imgSocial`**: Used for OpenGraph and social media sharing (Twitter, LinkedIn, etc.). These images should include text overlays since they appear standalone in social feeds without accompanying text.
- **`imgSite`**: Used for internal thumbnails displayed on the blog listing pages and featured posts. These images don't need text overlays since they're always displayed alongside the post title and description.

**Fallback behavior:**

For site display (what visitors see):

- Priority 1: `imgSite`
- Priority 2: `imgSocial` (if `imgSite` is missing)
- Priority 3: `/images/blog/blog-placeholder.png` (if both missing)

For social sharing (OpenGraph/Twitter meta tags):

- Priority 1: `imgSocial`
- Priority 2: `imgSite` (if `imgSocial` is missing)
- Priority 3: No fallback (undefined)

Special case for CMS posts:

- CMS posts may also have a `meta.image` field which takes highest priority for social sharing when available.

**What happens if fields are not provided?**

- If only `imgSite` is provided: Site displays the image correctly, social sharing uses `imgSite` as fallback
- If only `imgSocial` is provided: Social sharing uses it, site display uses it as fallback
- If neither is provided: Site shows placeholder image, social sharing has no image
- Best practice: Provide both fields for optimal display and social sharing

**Example:**

```yaml
---
title: 'My Blog Post'
imgSocial: 2025-01-01-my-post/og.png # With text overlay for social sharing
imgSite: 2025-01-01-my-post/thumbnail.png # Without text, clean image
---
```

Or if using the same image for both:

```yaml
---
title: 'My Blog Post'
imgSocial: 2025-01-01-my-post/image.png
imgSite: 2025-01-01-my-post/image.png
---
```
