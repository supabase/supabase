import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'
import * as cheerio from 'cheerio'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } })
  }

  const { url } = req.body

  if (!url) {
    return res.status(400).json({ error: { message: 'URL is required' } })
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract title
    const title = $('title').text().trim()

    // Extract meta description
    const description = $('meta[name="description"]').attr('content')?.trim() || ''

    // Extract main content
    const mainContent = extractMainContent($)

    return res.status(200).json({
      title,
      description,
      content: mainContent,
      url,
    })
  } catch (error) {
    console.error('Error fetching web content:', error)
    return res.status(500).json({ error: { message: 'Failed to fetch web content' } })
  }
}

function extractMainContent($: cheerio.CheerioAPI): string {
  // Remove script tags, style tags, and comments
  $('script, style, comment').remove()

  // Common selectors for main content
  const contentSelectors = [
    'article',
    '[role="main"]',
    '.main-content',
    '#main-content',
    '.post-content',
    '.entry-content',
    '.content',
    '#content',
    'main',
  ]

  let mainContent = ''

  // Try to find content using common selectors
  for (const selector of contentSelectors) {
    const element = $(selector)
    if (element.length > 0) {
      mainContent = element.text().trim()
      break
    }
  }

  // If no content found, use a density-based approach
  if (!mainContent) {
    mainContent = findContentByDensity($)
  }

  // Fallback to body content if still empty
  if (!mainContent) {
    mainContent = $('body').text().trim()
  }

  // Limit content length and clean it up
  return cleanAndLimitContent(mainContent)
}

function findContentByDensity($: cheerio.CheerioAPI): string {
  let bestElement: cheerio.Element | null = null
  let maxScore = 0

  $('p')
    .parent()
    .each((_, element) => {
      const $element = $(element)
      const text = $element.text()
      const linkDensity = $element.find('a').text().length / text.length || 0
      const score = text.length * (1 - linkDensity)

      if (score > maxScore) {
        maxScore = score
        bestElement = element
      }
    })

  return bestElement ? $(bestElement).text().trim() : ''
}

function cleanAndLimitContent(content: string): string {
  // Remove extra whitespace and newlines
  content = content.replace(/\s+/g, ' ').trim()

  // Limit to around 1000 words
  const words = content.split(' ')
  if (words.length > 1000) {
    content = words.slice(0, 1000).join(' ') + '...'
  }

  return content
}
