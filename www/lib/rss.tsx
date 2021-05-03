const generateRssItem = (post: any): string => `
<item>
  <guid>https://supabase.io/blog/${post.url}</guid>
  <title>${post.title}</title>
  <link>https://supabase.io/blog/${post.url}</link>
  <description>${post.description}</description>
  <pubDate>${new Date(post.date).toUTCString()}</pubDate>
</item>
`

export const generateRss = (posts: any[]): string => {
  return `
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>Blog - Supabase</title>
      <link>https://supabase.io</link>
      <description>Latest news from Supabase</description>
      <language>en</language>
      <lastBuildDate>${new Date(posts[0].date).toUTCString()}</lastBuildDate>
      <atom:link href="https://supabase.io/blog/rss.xml" rel="self" type="application/rss+xml"/>
      ${posts.map(generateRssItem).join('')}
    </channel>
  </rss>
`
}
