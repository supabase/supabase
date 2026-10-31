'use client'

import useActiveAnchors from '@/hooks/useActiveAnchors'

// Mounts the scroll-to-anchor + TOC active-section tracking listeners.
// Lives in its own client island so the surrounding blog post markup can SSR.
export default function BlogPostAnchorEffect() {
  useActiveAnchors()
  return null
}
