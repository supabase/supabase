# CLI Documentation Deep Link Enhancement

## Problem
When users search for "supabase cli db push" on Google, search engines weren't properly indexing the individual command sections. The CLI documentation was rendered as a single page (`/reference/cli`) with client-side navigation to different sections, making it difficult for search engines to properly index and rank individual commands.

## Solution
Enhanced the documentation build process to generate static pages for each CLI command with proper SEO metadata.

## Changes Made

### 1. Static Page Generation (`apps/docs/features/docs/Reference.utils.ts`)

**Function: `generateReferenceStaticParams()`** (Lines 108-119)

Previously, only one static page was generated for CLI:
```typescript
const cliPages = [
  {
    slug: ['cli'],
  },
]
```

Now generates individual pages for each CLI command:
```typescript
// Generate pages for CLI including individual command pages
const cliFlattenedSections = await getFlattenedSections('cli', 'latest')
const cliPages = [
  {
    slug: ['cli'],
  },
  ...(cliFlattenedSections || [])
    .filter((section) => section.type === 'cli-command' && !!section.slug)
    .map((section) => ({
      slug: ['cli', section.slug],
    })),
]
```

This generates static pages for:
- `/reference/cli` (base page)
- `/reference/cli/supabase-db-push` (individual command pages)
- `/reference/cli/supabase-start`
- ... (68 total CLI command pages)

### 2. Enhanced SEO Metadata (`apps/docs/features/docs/Reference.utils.ts`)

**Function: `generateReferenceMetadata()`** (Lines 180-213)

Added proper metadata generation for individual CLI command pages:

```typescript
} else if (isCliReference) {
  const { path } = parsedPath
  const flattenedSections = await getFlattenedSections('cli', 'latest')
  
  if (path.length > 0 && flattenedSections) {
    const sectionSlug = path[0]
    const section = flattenedSections.find((s) => s.slug === sectionSlug)
    
    if (section) {
      const url = [BASE_PATH, 'reference', 'cli', section.slug].filter(Boolean).join('/')
      const images = generateOpenGraphImageMeta({
        type: 'CLI Reference',
        title: `${section.title || section.id}`,
      })
      
      return {
        title: `${section.title || section.id} | Supabase CLI | Supabase Docs`,
        description: `CLI reference for ${section.title || section.id}`,
        alternates: {
          canonical: url,
        },
        openGraph: {
          ...parentOg,
          url,
          images,
        },
      }
    }
  }
  
  return {
    title: 'CLI Reference | Supabase Docs',
    description: 'CLI reference for the Supabase CLI',
  }
}
```

## Benefits

### For `supabase db push` specifically:
- **URL**: `/reference/cli/supabase-db-push`
- **Title**: "Push migration to remote database | Supabase CLI | Supabase Docs"
- **Description**: "CLI reference for Push migration to remote database"
- **Canonical URL**: Properly set for SEO
- **Open Graph Images**: Generated for social media sharing
- **Section ID**: `id="supabase-db-push"` for deep linking with anchors

### General Benefits:
1. **Better SEO**: Each command now has its own static HTML page with proper meta tags
2. **Improved Discoverability**: Search engines can index and rank individual commands
3. **Better Social Sharing**: Each command has its own Open Graph image and metadata
4. **Canonical URLs**: Proper canonical URLs prevent duplicate content issues
5. **Deep Linking**: Each command can be directly linked and shared

## How It Works

1. **Build Time**: Next.js generates static HTML pages for each CLI command during build
2. **Middleware**: The existing middleware (`apps/docs/middleware.ts`) rewrites all CLI paths to `/reference/cli` for rendering
3. **Client-Side**: The page component receives the full URL slug and renders all sections
4. **SEO**: Each static page has proper meta tags, making it easier for search engines to index
5. **Navigation**: Client-side JavaScript handles smooth scrolling to the appropriate section

## Testing

Verified that 68 CLI command pages will be generated, including:
- `/reference/cli/supabase-db-push`
- `/reference/cli/supabase-start`
- `/reference/cli/supabase-init`
- And 65 other commands

Each page will have:
- ✅ Its own static HTML page
- ✅ Proper meta title and description
- ✅ Canonical URL for SEO
- ✅ Section ID for deep linking
- ✅ Open Graph metadata for social sharing

## Files Modified

1. `apps/docs/features/docs/Reference.utils.ts`
   - Enhanced `generateReferenceStaticParams()` to generate pages for each CLI command
   - Enhanced `generateReferenceMetadata()` to provide proper SEO metadata for each command

No other files were modified. The existing middleware and rendering logic continue to work as before.