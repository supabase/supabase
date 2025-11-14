import { readFile, writeFile } from 'fs/promises'
import { parse, stringify } from 'yaml'

interface YamlFunction {
  id: string
  title: string
  $ref: string
  description?: string
  notes?: string
}

interface YamlSpec {
  functions: YamlFunction[]
}

interface TypeDocComment {
  summary?: Array<{ text: string }>
  shortText?: string
}

interface TypeDocChild {
  name: string
  kind?: number
  comment?: TypeDocComment
  children?: TypeDocChild[]
  signatures?: Array<{
    name: string
    comment?: TypeDocComment
  }>
}

interface TypeDocSpec {
  children?: TypeDocChild[]
}

// Normalize text for comparison (trim, lowercase, remove extra whitespace)
function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\.$/, '') // Remove trailing period
}

// Extract comment text from TypeDoc comment structure
function getCommentText(comment: TypeDocComment | undefined): string | null {
  if (!comment) return null

  // Try summary array first (TypeDoc v0.23+)
  if (comment.summary && comment.summary.length > 0) {
    return comment.summary.map((s) => s.text).join('')
  }

  // Fallback to shortText (older TypeDoc)
  if (comment.shortText) {
    return comment.shortText
  }

  return null
}

// Extract function comments from TypeDoc JSON
function extractTypeDocComments(typeDocData: TypeDocSpec): Map<string, string> {
  const comments = new Map<string, string>()

  function traverse(children: TypeDocChild[] | undefined, parentName = '') {
    if (!children) return

    for (const child of children) {
      const commentText = getCommentText(child.comment)

      // Store class/interface/function level
      if (commentText) {
        comments.set(child.name.toLowerCase(), normalizeText(commentText))
        if (parentName) {
          comments.set(`${parentName}.${child.name}`.toLowerCase(), normalizeText(commentText))
        }
      }

      // Check signatures (for methods)
      if (child.signatures) {
        for (const sig of child.signatures) {
          const sigComment = getCommentText(sig.comment)
          if (sigComment) {
            comments.set(child.name.toLowerCase(), normalizeText(sigComment))
            if (parentName) {
              comments.set(`${parentName}.${child.name}`.toLowerCase(), normalizeText(sigComment))
            }
          }
        }
      }

      // Recurse into children
      if (child.children) {
        traverse(child.children, child.name)
      }
    }
  }

  traverse(typeDocData.children)
  return comments
}

async function main() {
  console.log('Reading files...')

  const yamlPath = 'spec/supabase_js_v2.yml'
  const combinedJsonPath = 'spec/enrichments/tsdoc_v2/combined.json'

  const yamlContent = await readFile(yamlPath, 'utf-8')
  const combinedContent = await readFile(combinedJsonPath, 'utf-8')

  const yamlSpec: YamlSpec = parse(yamlContent)
  const typeDocData: TypeDocSpec = JSON.parse(combinedContent)

  console.log(`Loaded ${yamlSpec.functions.length} functions from YAML`)

  // Extract all TypeDoc comments
  const typeDocComments = extractTypeDocComments(typeDocData)
  console.log(`Found ${typeDocComments.size} TypeDoc comments`)

  // Check for duplicates and remove them
  let removedCount = 0
  let keptCount = 0

  for (const fn of yamlSpec.functions) {
    if (!fn.description) continue

    // Try to find matching TypeDoc comment
    // The $ref format is like: @supabase/supabase-js.GoTrueAdminApi.listUsers
    const refParts = fn.$ref?.split('.')
    if (!refParts || refParts.length < 2) continue

    // Try different key combinations
    const possibleKeys = [
      // Full path: GoTrueAdminApi.listUsers
      `${refParts[refParts.length - 2]}.${refParts[refParts.length - 1]}`.toLowerCase(),
      // Just method name: listUsers
      refParts[refParts.length - 1].toLowerCase(),
      // Class name: GoTrueAdminApi
      refParts[refParts.length - 2].toLowerCase(),
    ]

    let foundDuplicate = false
    for (const key of possibleKeys) {
      const typeDocComment = typeDocComments.get(key)
      if (typeDocComment) {
        const normalizedYamlDesc = normalizeText(fn.description)

        // Check if they're the same (or very similar)
        if (normalizedYamlDesc === typeDocComment || typeDocComment.includes(normalizedYamlDesc)) {
          console.log(`  ✓ Removing duplicate for ${fn.id}: "${fn.description.substring(0, 60)}..."`)
          delete fn.description
          removedCount++
          foundDuplicate = true
          break
        }
      }
    }

    if (!foundDuplicate && fn.description) {
      keptCount++
    }
  }

  console.log(`\n✅ Removed ${removedCount} duplicate descriptions`)
  console.log(`   Kept ${keptCount} unique descriptions`)

  // Write back
  console.log('\nWriting updated YAML...')
  await writeFile(yamlPath, stringify(yamlSpec), 'utf-8')

  console.log('✅ Done!')
}

main().catch(console.error)
