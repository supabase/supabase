# CMS Block Integration

This directory contains utilities for integrating PayloadCMS custom blocks with the www marketing site blog.

## Overview

PayloadCMS blog posts can contain custom blocks (Banner, MediaBlock, Code, Quote, YouTube) in addition to regular text content. This integration converts those blocks into the existing markdown/MDX syntax that the www blog already understands, ensuring seamless compatibility.

## Components

### convertRichTextToMarkdown.ts

Enhanced conversion utilities:

- `convertRichTextToMarkdownWithBlocks()` - Converts PayloadCMS rich text to markdown using existing www syntax
- `convertRichTextToMarkdown()` - Legacy function for backward compatibility

### processCMSContent.ts

Main processor that:

1. Converts PayloadCMS rich text to markdown using existing www component syntax
2. Generates table of contents from the converted content
3. Serializes content for MDX rendering

## Usage

### In Blog Pages

```typescript
import { processCMSContent } from '~/lib/cms/processCMSContent'

// Process CMS content - blocks are converted to existing www syntax
const processedContent = await processCMSContent(cmsPost.content, tocDepth)

// Use in blog data
const blogData = {
  ...cmsPost,
  content: processedContent.content, // MDX with existing www components
  toc: processedContent.toc,
}
```

### Block Conversion Examples

PayloadCMS blocks are automatically converted to existing www markdown syntax:

````typescript
// PayloadCMS MediaBlock becomes:
'<Img alt="Description" src="/uploads/image.jpg" />'

// PayloadCMS Code block becomes:
'```typescript\nconst example = "Hello world"\n```'

// PayloadCMS Quote block becomes:
'<Quote img="avatar.jpg" caption="Author Name">\n\nQuote text here\n\n</Quote>'

// PayloadCMS YouTube block becomes:
'<div className="video-container">\n  <iframe src="..." />\n</div>'

// PayloadCMS Banner block becomes:
'<Admonition type="note">\n\nBanner content\n\n</Admonition>'
````

## Block Type Mapping

| PayloadCMS Block | WWW Syntax                          | Notes                                                                     |
| ---------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `banner`         | `<Admonition>`                      | Style mapped: info→note, warning→warning, error→destructive, success→note |
| `mediaBlock`     | `<Img>`                             | Handles CMS image URLs and captions                                       |
| `code`           | `code`                              | Standard markdown code blocks with language syntax highlighting           |
| `quote`          | `<Quote>`                           | Avatar image and caption support                                          |
| `youtube`        | `<div className="video-container">` | Wrapped iframe with expected styling                                      |

## Environment Variables

- `NEXT_PUBLIC_CMS_SITE_ORIGIN` - Used for resolving relative CMS image URLs

## Integration Points

1. **apps/www/app/blog/[slug]/page.tsx** - Uses `processCMSContent()` to convert CMS content
2. **apps/www/app/blog/[slug]/BlogPostClient.tsx** - Handles live preview with block conversion
3. **apps/www/lib/get-cms-posts.tsx** - Uses shared conversion utilities for consistent processing

This system allows PayloadCMS editors to use rich blocks while maintaining 100% compatibility with the existing MDX-based blog rendering system. No new components or special handling is required - blocks are seamlessly converted to the markdown/MDX syntax that www already understands.
