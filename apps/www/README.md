# supabase.com

## Overview

Refer to the [Development Guide](../../DEVELOPERS.md) to learn how to run this site locally.

To get started copy the example env file using `cp .env.local.example .env.local`.

## Best practices

### Images

- **Resize images**: All new images should be resized to only the maximum resolution needed when rendering on the frontend. Don't upload images larger than what will be displayed.
- **Compress images**: All new images should be compressed before committing. Use tools like Clop or ImageOptim to reduce file size without noticeable quality loss.
- **Image locations**: Store blog post images in `apps/www/public/images/blog/`. Event images go in `apps/www/public/images/events/`.

### OG image generation

Open Graph (OG) images for social sharing are handled differently across content types:

- **Blog posts**: Use static images via `imgSocial` and `imgThumb` fields (see _Blog posts_ section below)
- **Events**: Use dynamic generation via Edge Function (with optional `og_image` override)
- **Customer stories**: Use dynamic generation via Edge Function (no static option)

The `og-images` Edge Function (`supabase/functions/og-images/`) automatically generates OG images for events and customer stories. It's deployed via `.github/workflows/og_images.yml` when changes are made to the function code.

**Development**: In local development, the function runs at `http://127.0.0.1:54321/functions/v1/og-images`. Ensure Supabase is running locally (`supabase start`).

### Content frontmatter image fields

Different content types use different image field conventions:

#### Blog posts

Blog posts support two image fields in their frontmatter:

- **`imgSocial`**: Used for Open Graph and social media sharing (X, LinkedIn, etc.). These images should include text overlays since they appear standalone in social feeds without accompanying text.
- **`imgThumb`**: Used for internal thumbnails displayed on the blog listing pages and featured posts. These images don't need text overlays since they're always displayed alongside the post title and description.

This naming convention was introduced to replace the previously confusing `thumb` and `og` fields, which were often mixed up. The new names clearly indicate:

- **`imgSocial`**: Purpose-built for social media sharing (needs text overlays)
- **`imgThumb`**: Optimized for site display (clean, no text overlays)

This separation allows you to optimize images for their specific use case while maintaining a clear, unambiguous naming convention.

**Image path format**

Always use **relative paths** (just the filename or subfolder/filename). The `/images/blog/` prefix is added automatically by the code.

- ✅ Correct: `imgSocial: my-post/og.png` or `imgSocial: og.png`
- ❌ Wrong: `imgSocial: /images/blog/my-post/og.png` (creates double prefix)

**Image fallback behavior**

For site display (what visitors see):

- Priority 1: `imgThumb`
- Priority 2: `imgSocial` (if `imgThumb` is missing)
- Priority 3: `/images/blog/blog-placeholder.png` (if both missing)

For social sharing (Open Graph meta tags):

- Priority 1: `imgSocial`
- Priority 2: `imgThumb` (if `imgSocial` is missing)
- Priority 3: No fallback (undefined)

Special case for CMS posts:

- CMS posts may also have a `meta.image` field which takes highest priority for social sharing when available.

What happens if fields are not provided?

- If only `imgThumb` is provided: Site displays the image correctly, social sharing uses `imgThumb` as fallback
- If only `imgSocial` is provided: Social sharing uses it, site display uses it as fallback
- If neither is provided: Site shows placeholder image, social sharing has no image
- Best practice: Provide both fields for optimal display and social sharing

**Example**

```yaml
---
title: 'My Blog Post'
imgSocial: 2025-01-01-my-post/og.png # Relative path - with text overlay for social sharing
imgThumb: 2025-01-01-my-post/thumb.png # Relative path - without text, clean image
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
imgThumb: my-image.png
---
```

#### Events

Events use different image fields to avoid confusion with their display patterns:

- **`thumb`**: Used for event grid item thumbnails (small cards in listing)
- **`cover_url`**: Used for the featured event banner (large display on events page)
- **`og_image`** (optional): Used to override the dynamically generated OG image for social sharing

**OG image generation**

Events automatically generate Open Graph images using the `og-images` Supabase Edge Function. The function creates images dynamically based on:

- Event type (conference, hackathon, etc.)
- Title (or `meta_title` if provided)
- Description (or `meta_description` if provided)
- Date (formatted as "DD MMM YYYY" using the event's timezone)
- Duration (if provided)

If you need a custom OG image that differs from the auto-generated one, you can provide an `og_image` field in the frontmatter. This will override the dynamic generation.

**Example:**

```yaml
---
title: 'Supabase Meetup'
thumb: /images/events/2025-01-meetup/thumbnail.png
cover_url: https://external-cdn.com/event-banner.jpg
og_image: /images/events/2025-01-meetup/custom-og.png # Optional override
---
```

**Note**: The `og_image` field is optional. If not provided, OG images are generated automatically via the Edge Function.

#### Customer Stories (Case Studies)

Customer stories are defined in MDX files (`apps/www/_customers/*.mdx`) and use a different approach:

- **No `og_image` field**: Customer stories do NOT use static OG images
- **Dynamic OG generation**: All customer story OG images are automatically generated using the `og-images` Supabase Edge Function
- The function creates images based on the customer `slug` and `title` (or `meta_title` if provided)

Do not include an `og_image` field in customer story frontmatter. It will be ignored. OG images are always generated dynamically.

**Example** (in `apps/www/_customers/company-abc.mdx`):

```yaml
---
name: Company ABC
title: Company ABC built their platform with Supabase
# DO NOT include og_image - it's generated automatically
logo: /images/customers/logos/company-abc.png
---
```

**Legacy Case Studies** (in `data/CustomerStories.ts`):

- **`imgUrl`**: Path to the case study image in the source data
- This gets mapped to `imgThumb` when rendered via `BlogGridItem` component
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
