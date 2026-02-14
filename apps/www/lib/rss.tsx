import authors from 'lib/authors.json'
const dayjs = require('dayjs')
var utc = require('dayjs/plugin/utc')
var advancedFormat = require('dayjs/plugin/advancedFormat')
dayjs.extend(utc)
dayjs.extend(advancedFormat)

const generateRssItem = (post: any): string => {
  const xmlEncode = (str: string) => {
    if (str === undefined || str === null) {
      return ''
    }

    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  const encodedTitle = xmlEncode(post.title)
  const encodedPath = xmlEncode(post.path)
  const encodedDescription = xmlEncode(post.description)
  const formattedDate = dayjs(post.date)
    .utcOffset(0, true)
    .startOf('day')
    .format('ddd, DD MMM YYYY HH:mm:ss [-0700]')

  return `<item>
  <guid>https://supabase.com${encodedPath}</guid>
  <title>${encodedTitle}</title>
  <link>https://supabase.com${encodedPath}</link>
  <description>${encodedDescription}</description>
  <pubDate>${formattedDate}</pubDate>
</item>
`
}

// This utility generates RSS feeds for specialized content:
// 1. Customer stories RSS feed (customers-rss.xml) - used by pages/customers.tsx via getStaticProps
// 2. Author-specific PlanetPG RSS feeds (planetpg-{authorID}-rss.xml) - filtered feeds for individual authors
//
// Note: The main blog RSS feed (rss.xml) containing all blog posts is generated separately
// in generateStaticContent.mjs during the build process. This file is NOT used for the main blog feed.
//
// Usage:
//   - Without authorID: Generates generic RSS feed (used for customer stories)
//   - With authorID: Generates author-specific feed with custom title/description for PlanetPG authors
export const generateRss = (posts: any[], authorID?: string): string => {
  const authorInfo = authors.find((item) => item.author_id === authorID)

  const formattedDate = dayjs(posts[0].date)
    .utcOffset(0, true)
    .startOf('day')
    .format('ddd, DD MMM YYYY HH:mm:ss [-0700]')

  if (authorID) {
    return `
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>'Postgres | Supabase Blog</title>
      <link>https://supabase.com/blog</link>
      <description>Latest Postgres news from ${authorInfo?.author} at Supabase</description>
      <language>en</language>
      <lastBuildDate>${formattedDate}</lastBuildDate>
      <atom:link href="https://supabase.com/planetpg-${authorID}-rss.xml" rel="self" type="application/rss+xml"/>
      ${posts.map(generateRssItem).join('')}
    </channel>
  </rss>
`
  } else {
    return `
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>Blog - Supabase</title>
      <link>https://supabase.com</link>
      <description>Latest news from Supabase</description>
      <language>en</language>
      <lastBuildDate>${formattedDate}</lastBuildDate>
      <atom:link href="https://supabase.com/rss.xml" rel="self" type="application/rss+xml"/>
      ${posts.map(generateRssItem).join('')}
    </channel>
  </rss>
`
  }
}
