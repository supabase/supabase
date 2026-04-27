/**
 * Pure ESM changelog RSS document builder (used by generateStaticContent.mjs and re-exported from rss.tsx).
 * @typedef {{ number?: number; title: string; url: string; sortDate: string; labels?: string[] }} ChangelogRssItemInput
 */
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat.js'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)
dayjs.extend(advancedFormat)

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
  return dayjs(isoOrDate)
    .utcOffset(0, true)
    .startOf('day')
    .format('ddd, DD MMM YYYY HH:mm:ss [-0700]')
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

/**
 * Converts a display label into a lowercase, URL-safe filename slug.
 * e.g. "Edge Functions" → "edge-functions", "AI & Vector" → "ai-vector"
 * @param {string} label
 */
export function labelToFileSlug(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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

/**
 * Generates a tag-filtered RSS feed.
 * @param {ChangelogRssItemInput[]} allEntries - all entries (labels as lowercase strings)
 * @param {{ githubLabelSlug: string; displayLabel: string }} tag
 */
export function generateChangelogTagRssXml(allEntries, tag) {
  const { githubLabelSlug, displayLabel } = tag
  const fileSlug = labelToFileSlug(displayLabel)

  const filtered = allEntries.filter(
    (e) => !e.title.includes('[d]') && (e.labels ?? []).includes(githubLabelSlug.toLowerCase())
  )
  const sorted = [...filtered].sort(
    (a, b) => dayjs(b.sortDate).valueOf() - dayjs(a.sortDate).valueOf()
  )

  const lastBuildDate = sorted[0]?.sortDate
    ? formatRssPubDate(sorted[0].sortDate)
    : formatRssPubDate(dayjs().toISOString())

  const feedUrl = `https://supabase.com/changelog-rss/${fileSlug}.xml`
  const channelTitle = xmlEncodeRss(`Supabase Changelog · ${displayLabel}`)
  const channelDescription = xmlEncodeRss(
    `${displayLabel} updates and improvements from Supabase`
  )

  return `
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>${channelTitle}</title>
      <link>https://supabase.com/changelog</link>
      <description>${channelDescription}</description>
      <language>en</language>
      <lastBuildDate>${lastBuildDate}</lastBuildDate>
      <atom:link href="${xmlEncodeRss(feedUrl)}" rel="self" type="application/rss+xml"/>
      ${buildItemsXml(sorted)}
    </channel>
  </rss>
`
}
