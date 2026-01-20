---
description: "Docs: OG image generation for documentation pages"
globs:
  - apps/docs/features/seo/openGraph.ts
  - apps/docs/features/docs/**/*.tsx
  - apps/docs/content/**/*.mdx
alwaysApply: false
---

# OG Image Generation for Documentation

## Overview

OG images for documentation pages (guides and API reference) are dynamically generated using the `og-images` Supabase Edge Function. The function is deployed via `.github/workflows/og_images.yml` when changes are made to `supabase/functions/og-images/**`.

## Implementation

### Helper Function

- **Location**: `apps/docs/features/seo/openGraph.ts`
- **Function**: `generateOpenGraphImageMeta({ type, title, description? })`
- **Function URL**: `https://obuldanrptloktxcffvn.supabase.co/functions/v1/og-images?site=docs&type={type}&title={title}&description={description}`

### Usage in Guides

- **Location**: `apps/docs/features/docs/GuidesMdx.utils.tsx`
- Used in `generateGuidesMetadata()` function
- Generates OG images for all guide pages
- Parameters:
  - `type`: Determined from the guide's frontmatter or category (e.g., "Guide", "Tutorial")
  - `title`: From the guide's frontmatter `title`
  - `description`: From the guide's frontmatter `description` (optional)

### Usage in API Reference

- **Location**: `apps/docs/features/docs/Reference.utils.ts`
- Used in `generateReferenceMetadata()` function
- Generates OG images for API reference pages
- Parameters:
  - `type`: Always `"API Reference"`
  - `title`: Format: `{SDK Name}{: Section Title}` (e.g., "JavaScript: auth")

### Example

```typescript
// In apps/docs/features/seo/openGraph.ts
export function generateOpenGraphImageMeta({
  type,
  title,
  description,
}: {
  type: string
  title: string
  description?: string
}) {
  return {
    url: `${MISC_URL}/functions/v1/og-images?site=docs&type=${encodeURIComponent(type)}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description ?? 'undefined')}`,
    width: 800,
    height: 600,
    alt: title,
  }
}
```

## Frontmatter

- **DO NOT** include `og_image` field in documentation MDX files
- OG images are always generated dynamically
- The `type` parameter is typically derived from the page category or section

## Development

- In development, ensure `MISC_URL` points to the local Supabase instance
- The function runs at `http://127.0.0.1:54321/functions/v1/og-images` locally
- Ensure Supabase is running locally: `supabase start`
- The function can be served locally: `supabase functions serve og-images`

## Deployment

- Changes to `supabase/functions/og-images/**` automatically trigger deployment via `.github/workflows/og_images.yml`
- The workflow runs on push to `master` branch when OG image function files change
- Manual deployment is also available via `workflow_dispatch`

## Function Implementation

The OG image generation logic is in `supabase/functions/og-images/handler.tsx`:
- Supports three sites: `docs`, `customers`, and `events`
- For docs, uses the `Docs` component with optional `type` and `icon` parameters
- Uses React components and custom fonts (Circular and SourceCodePro)
- Returns PNG images (1200x630) with long cache headers

## Notes

- The `description` parameter is optional and defaults to `'undefined'` if not provided
- The function handles URL encoding automatically
- All OG images are cached with `max-age=31536000` headers
