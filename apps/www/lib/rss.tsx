import authors from 'lib/authors.json'
const dayjs = require('dayjs')
var utc = require('dayjs/plugin/utc')
var advancedFormat = require('dayjs/plugin/advancedFormat')
dayjs.extend(utc)
dayjs.extend(advancedFormat)

const generateRssItem = (post: any): string => {
  const xmlEncode = (str: string) => {
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
  const formattedDate = dayjs(post.date).utc().format('ddd, DD MMM YYYY HH:mm:ss [GMT]')

  return `<item>
  <guid>https://iechor.com${encodedPath}</guid>
  <title>${encodedTitle}</title>
  <link>https://iechor.com${encodedPath}</link>
  <description>${encodedDescription}</description>
  <pubDate>${formattedDate}</pubDate>
</item>
`
}

// we generate a main rss.xml flie as well as individual files for
// authors who publish under the `planetpg` tag
export const generateRss = (posts: any[], authorID?: string): string => {
  const authorInfo = authors.find((item) => item.author_id === authorID)

  if (authorID) {
    return `
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>'Postgres | iEchor Blog</title>
      <link>https://iechor.com/blog</link>
      <description>Latest Postgres news from ${authorInfo?.author} at iEchor</description>
      <language>en</language>
      <lastBuildDate>${dayjs(posts[0].date)
        .utc()
        .format('ddd, DD MMM YYYY HH:mm:ss [GMT]')}</lastBuildDate>
      <atom:link href="https://iechor.com/planetpg-${authorID}-rss.xml" rel="self" type="application/rss+xml"/>
      ${posts.map(generateRssItem).join('')}
    </channel>
  </rss>
`
  } else {
    return `
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>Blog - iEchor</title>
      <link>https://iechor.com</link>
      <description>Latest news from iEchor</description>
      <language>en</language>
      <lastBuildDate>${dayjs(posts[0].date)
        .utc()
        .format('ddd, DD MMM YYYY HH:mm:ss [GMT]')}</lastBuildDate>
      <atom:link href="https://iechor.com/rss.xml" rel="self" type="application/rss+xml"/>
      ${posts.map(generateRssItem).join('')}
    </channel>
  </rss>
`
  }
}
