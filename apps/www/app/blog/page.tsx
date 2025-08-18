import fs from 'fs'
import { generateRss } from 'lib/rss'
import { getSortedPosts } from 'lib/posts'
import BlogClient from 'app/blog/BlogClient'

export const dynamic = 'force-static'

export default async function BlogPage() {
  // Get static blog posts at build time
  const staticPostsData = getSortedPosts({ directory: '_blog', runner: '** BLOG PAGE **' })

  const allPostsData = [...staticPostsData].sort((a: any, b: any) => {
    const dateA = (a as any).date
      ? new Date((a as any).date).getTime()
      : new Date((a as any).formattedDate).getTime()
    const dateB = (b as any).date
      ? new Date((b as any).date).getTime()
      : new Date((b as any).formattedDate).getTime()
    return dateB - dateA
  })

  // Generate RSS feed from static posts
  const rss = generateRss(allPostsData)
  try {
    fs.writeFileSync('./public/rss.xml', rss)
  } catch {}

  // Generate PlanetPG author feeds
  try {
    const planetPgPosts = allPostsData.filter((post: any) => post.tags?.includes('planetpg'))
    const planetPgAuthors = planetPgPosts.map((post: any) => post.author.split(','))
    const uniquePlanetPgAuthors = new Set(([] as string[]).concat(...(planetPgAuthors as any)))
    uniquePlanetPgAuthors.forEach((author) => {
      const authorPosts = planetPgPosts.filter((post: any) => post.author.includes(author))
      if (authorPosts.length > 0) {
        const authorRss = generateRss(authorPosts, author as string)
        fs.writeFileSync(`./public/planetpg-${author}-rss.xml`, authorRss)
      }
    })
  } catch {}

  return <BlogClient blogs={allPostsData as any} />
}
