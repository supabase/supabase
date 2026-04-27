/**
 * Pure ESM changelog RSS document builder (used by generateStaticContent.mjs and re-exported from rss.tsx).
 * @typedef {{ number?: number; title: string; url: string; sortDate: string; labels?: string[] }} ChangelogRssItemInput
 */
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)

function xmlEncodeRss(str) {
  if (str === undefined || str === null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatRssPubDate(isoOrDate) {
  return `${dayjs(isoOrDate).utc().startOf('day').format('ddd, DD MMM YYYY HH:mm:ss')} +0000`
}

function buildItemsXml(sorted) {
  return sorted
    .map((e) => {
      const encodedTitle = xmlEncodeRss(e.title)
      const canonicalUrl = e.number ? `https://supabase.com/changelog/${e.number}` : e.url
      const encodedCanonical = xmlEncodeRss(canonicalUrl)
      const pubDate = formatRssPubDate(e.sortDate)
      return `<item>
  <guid isPermaLink="true">${encodedCanonical}</guid>
  <title>${encodedTitle}</title>
  <link>${encodedCanonical}</link>
  <pubDate>${pubDate}</pubDate>
</item>`
    })
    .join('\n')
}

/** @param {ChangelogRssItemInput[]} entries */
export function generateChangelogRssXml(entries) {
  const visible = entries.filter((e) => !e.title.includes('[d]'))
  const sorted = [...visible].sort(
    (a, b) => dayjs(b.sortDate).valueOf() - dayjs(a.sortDate).valueOf()
  )

  const lastBuildDate = sorted[0]?.sortDate
    ? formatRssPubDate(sorted[0].sortDate)
    : formatRssPubDate(dayjs().toISOString())

  return `
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>Supabase Changelog</title>
      <link>https://supabase.com/changelog</link>
      <description>Product updates and improvements from Supabase</description>
      <language>en</language>
      <lastBuildDate>${lastBuildDate}</lastBuildDate>
      <atom:link href="https://supabase.com/changelog-rss.xml" rel="self" type="application/rss+xml"/>
      ${buildItemsXml(sorted)}
    </channel>
  </rss>
`
}
