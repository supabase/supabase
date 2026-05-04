'use client'

import dynamic from 'next/dynamic'

const BlogPostRenderer = dynamic(() => import('./BlogPostRendererClient'), {
  ssr: false,
})

export default BlogPostRenderer
