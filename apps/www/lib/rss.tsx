const dayjs = require('dayjs')
var utc = require('dayjs/plugin/utc')
var advancedFormat = require('dayjs/plugin/advancedFormat')
dayjs.extend(utc)
dayjs.extend(advancedFormat)

const generateRssItem = (post: any): string => {
  // post.url = post.url.substring(11)

  return `<item>
  <guid>https://supabase.com${post.path}</guid>
  <title>${post.title}</title>
  <link>https://supabase.com${post.path}</link>
  <description>${post.description}</description>
  <pubDate>${dayjs(post.date).utc().format('ddd, DD MMM YYYY HH:hh:mm ZZ')}</pubDate>
</item>
`
}

export const generateRss = (posts: any[]): string => {
  return `
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>Blog - Supabase</title>
      <link>https://supabase.com</link>
      <description>Latest news from Supabase</description>
      <language>en</language>
      <lastBuildDate>${dayjs(posts[0].date)
        .utc()
        .format('ddd, DD MMM YYYY HH:hh:mm ZZ')}</lastBuildDate>
      <atom:link href="https://supabase.com/rss.xml" rel="self" type="application/rss+xml"/>
      ${posts.map(generateRssItem).join('')}
    </channel>
  </rss>
`
}
