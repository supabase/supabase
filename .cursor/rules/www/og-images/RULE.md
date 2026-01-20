---
description: "WWW: OG image generation for events and customer stories"
globs:
  - apps/www/pages/events/**/*.tsx
  - apps/www/pages/customers/**/*.tsx
  - apps/www/_events/**/*.mdx
  - apps/www/_customers/**/*.mdx
alwaysApply: false
---

# OG Image Generation for Events and Customer Stories

## Overview

OG images for events and customer stories are dynamically generated using the `og-images` Supabase Edge Function. The function is deployed via `.github/workflows/og_images.yml` when changes are made to `supabase/functions/og-images/**`.

## Customer Stories

### Implementation

- **Location**: `apps/www/pages/customers/[slug].tsx`
- **OG Image Generation**: Always uses the dynamic `og-images` function
- **Function URL**: `https://obuldanrptloktxcffvn.supabase.co/functions/v1/og-images?site=customers&customer={slug}&title={title}`

### Frontmatter Rules

- **DO NOT** include `og_image` field in customer story MDX files (`apps/www/_customers/*.mdx`)
- The `og_image` field is ignored and not used by the code
- OG images are always generated dynamically using the customer `slug` and `title` (or `meta_title` if provided)

### Example

```typescript
// In apps/www/pages/customers/[slug].tsx
const ogImageUrl = encodeURI(
  `${process.env.NODE_ENV === 'development' 
    ? 'http://127.0.0.1:54321' 
    : 'https://obuldanrptloktxcffvn.supabase.co'}/functions/v1/og-images?site=customers&customer=${slug}&title=${meta_title ?? title}`
)
```

## Events

### Implementation

- **Location**: `apps/www/pages/events/[slug].tsx`
- **OG Image Generation**: Uses dynamic generation with optional override
- **Function URL**: `https://obuldanrptloktxcffvn.supabase.co/functions/v1/og-images?site=events&eventType={type}&title={title}&description={description}&date={date}&duration={duration}`

### Frontmatter Rules

- **Optional**: You can include `og_image` field in event MDX files (`apps/www/_events/*.mdx`) to override the dynamic generation
- If `og_image` is provided, it takes precedence over the dynamically generated image
- If `og_image` is not provided, the function generates an image using:
  - `eventType` (from `type` field)
  - `title` (or `meta_title` if provided)
  - `description` (or `meta_description` if provided)
  - `date` (formatted as "DD MMM YYYY" using the event's timezone)
  - `duration` (if provided)

### Example

```typescript
// In apps/www/pages/events/[slug].tsx
const ogImageUrl = event.og_image
  ? event.og_image  // Use static override if provided
  : encodeURI(
      `${process.env.NODE_ENV === 'development' 
        ? 'http://127.0.0.1:54321' 
        : 'https://obuldanrptloktxcffvn.supabase.co'}/functions/v1/og-images?site=events&eventType=${event.type}&title=${event.meta_title ?? event.title}&description=${event.meta_description ?? event.description}&date=${dayjs(event.date).tz(event.timezone).format(`DD MMM YYYY`)}&duration=${event.duration}`
    )
```

## Development

- In development, the function runs locally at `http://127.0.0.1:54321/functions/v1/og-images`
- Ensure Supabase is running locally: `supabase start`
- The function can be served locally: `supabase functions serve og-images`

## Deployment

- Changes to `supabase/functions/og-images/**` automatically trigger deployment via `.github/workflows/og_images.yml`
- The workflow runs on push to `master` branch when OG image function files change
- Manual deployment is also available via `workflow_dispatch`

## Function Implementation

The OG image generation logic is in `supabase/functions/og-images/handler.tsx`:
- Supports three sites: `docs`, `customers`, and `events`
- Uses React components and custom fonts (Circular and SourceCodePro)
- Returns PNG images (1200x630) with long cache headers
