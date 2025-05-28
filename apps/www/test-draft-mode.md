# Draft Mode Testing Guide

## Overview

This guide explains how to test the Next.js Draft Mode implementation for Payload CMS blog posts.

## Setup

1. Make sure your Payload CMS is running on `http://localhost:3030`
2. Make sure your Next.js app is running on `http://localhost:3000`
3. Set the `PREVIEW_SECRET` environment variable in your `.env.local` file

## Testing Steps

### 1. Create a Draft Post in Payload CMS

1. Go to your Payload CMS admin panel at `http://localhost:3030/admin`
2. Create a new blog post
3. Set the status to "Draft" (don't publish it)
4. Note the slug of the post

### 2. Test Draft Mode API

1. Visit the preview API endpoint: `http://localhost:3000/api/preview?slug=your-post-slug&secret=your-preview-secret`
2. You should be redirected to the blog post page with draft mode enabled
3. You should see:
   - A draft mode banner at the bottom
   - The draft content of your post
   - Live preview functionality (if you edit the post in CMS, changes should appear)

### 3. Test Exit Draft Mode

1. Click the "Exit Draft Mode" button in the banner
2. You should be redirected to the homepage
3. The draft mode cookie should be cleared

### 4. Test Direct Access

1. Try to access the draft post directly: `http://localhost:3000/blog/your-post-slug`
2. Without draft mode enabled, you should get a 404 error (since the post is not published)

## Expected Behavior

- ✅ Draft mode banner appears when viewing draft content
- ✅ Live preview updates work when editing in CMS
- ✅ Exit draft mode clears the cookie and redirects
- ✅ Draft posts are not accessible without draft mode
- ✅ Published posts work normally in both modes

## API Endpoints

- **Enable Draft Mode**: `/api/preview?slug=POST_SLUG&secret=PREVIEW_SECRET`
- **Disable Draft Mode**: `/api/disable-draft`

## Environment Variables

```env
PREVIEW_SECRET=your-secret-token-here
NEXT_PUBLIC_CMS_URL=http://localhost:3030
PAYLOAD_API_KEY=your-payload-api-key
```

## Troubleshooting

1. **404 on draft posts**: Make sure the post exists in CMS and draft mode is enabled
2. **No live preview**: Check that the CMS URL is correct and the post is being edited
3. **Banner not showing**: Check browser cookies for `__prerender_bypass`
4. **API errors**: Verify environment variables and CMS connectivity
