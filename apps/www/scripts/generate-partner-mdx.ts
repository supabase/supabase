/**
 * Script to generate MDX files for partners from CSV data
 * Run with: node --experimental-strip-types scripts/generate-partner-mdx.ts
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PARTNERS_CSV = path.join(__dirname, '../data/partners/partners_rows.csv')
const OUTPUT_DIR = path.join(__dirname, '../_partners')

interface PartnerRow {
  id: string
  slug: string
  type: 'technology' | 'expert'
  category: string
  developer: string
  title: string
  description: string
  logo: string
  images: string
  overview: string
  website: string
  docs: string
  contact: string
  approved: string
  created_at: string
  tsv: string
  video: string
  call_to_action_link: string
  featured: string
}

// Simple CSV parser that handles quoted fields with newlines
function parseCSV(content: string): PartnerRow[] {
  const rows: PartnerRow[] = []
  const lines = content.split('\n')
  
  // Get headers from first line
  const headers = parseCSVLine(lines[0])
  
  let currentRow = ''
  let inQuotes = false
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    
    // Count quotes to determine if we're inside a quoted field
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes
    }
    
    currentRow += (currentRow ? '\n' : '') + line
    
    // If we're not in quotes, this row is complete
    if (!inQuotes) {
      if (currentRow.trim()) {
        const values = parseCSVLine(currentRow)
        if (values.length >= headers.length) {
          const row: Record<string, string> = {}
          headers.forEach((header, idx) => {
            row[header] = values[idx] || ''
          })
          rows.push(row as unknown as PartnerRow)
        }
      }
      currentRow = ''
    }
  }
  
  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

function parseImages(imagesStr: string): string[] {
  if (!imagesStr || imagesStr === '[]') return []
  try {
    return JSON.parse(imagesStr.replace(/'/g, '"'))
  } catch {
    return []
  }
}

function escapeYamlString(str: string): string {
  if (!str) return '""'
  if (str.includes(':') || str.includes('#') || str.includes("'") || str.includes('"') || str.includes('\n') || str.startsWith(' ') || str.endsWith(' ')) {
    return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
  }
  return str
}

function generateFrontmatter(partner: PartnerRow): string {
  const images = parseImages(partner.images)
  
  let yaml = '---\n'
  yaml += `slug: ${escapeYamlString(partner.slug)}\n`
  yaml += `title: ${escapeYamlString(partner.title)}\n`
  yaml += `type: ${partner.type}\n`
  yaml += `category: ${escapeYamlString(partner.category)}\n`
  yaml += `developer: ${escapeYamlString(partner.developer)}\n`
  yaml += `description: ${escapeYamlString(partner.description)}\n`
  yaml += `logo: ${escapeYamlString(partner.logo)}\n`
  yaml += `website: ${escapeYamlString(partner.website)}\n`
  yaml += `featured: ${partner.featured === 'true'}\n`
  
  if (partner.docs) yaml += `docs: ${escapeYamlString(partner.docs)}\n`
  if (partner.video) yaml += `video: ${escapeYamlString(partner.video)}\n`
  if (partner.call_to_action_link) yaml += `call_to_action_link: ${escapeYamlString(partner.call_to_action_link)}\n`
  
  if (images.length > 0) {
    yaml += `images:\n`
    for (const img of images) {
      yaml += `  - ${escapeYamlString(img)}\n`
    }
  }
  
  yaml += '---\n'
  return yaml
}

function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // Read and parse CSV
  const csvContent = fs.readFileSync(PARTNERS_CSV, 'utf-8')
  const records = parseCSV(csvContent)

  let count = 0
  let skipped = 0

  for (const partner of records) {
    // Only process approved technology partners
    if (partner.approved !== 'true' || partner.type !== 'technology') {
      skipped++
      continue
    }

    if (!partner.slug) {
      console.warn(`Skipping partner without slug: ${partner.title}`)
      skipped++
      continue
    }

    const frontmatter = generateFrontmatter(partner)
    const content = `${frontmatter}\n${partner.overview || ''}\n`
    
    const outputPath = path.join(OUTPUT_DIR, `${partner.slug}.mdx`)
    fs.writeFileSync(outputPath, content)
    count++
    
    console.log(`Generated: ${partner.slug}.mdx`)
  }

  console.log(`\nDone! Generated ${count} MDX files, skipped ${skipped} records.`)
  console.log(`Output directory: ${OUTPUT_DIR}`)
}

main()
