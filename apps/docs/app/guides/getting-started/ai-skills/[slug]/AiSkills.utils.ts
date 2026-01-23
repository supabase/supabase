import matter from 'gray-matter'
import type { Heading, Root } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { readdir, readFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { cache } from 'react'
import { visit, EXIT } from 'unist-util-visit'
import { getCustomContent } from '~/lib/custom-content/getCustomContent'
import { EXAMPLES_DIRECTORY } from '~/lib/docs'

const { metadataTitle } = getCustomContent(['metadata:title'])
const SKILLS_DIRECTORY = join(EXAMPLES_DIRECTORY, 'skills')

interface SkillMetadata {
  name?: string
  title?: string
  description?: string
  author?: string
  version?: string
  license?: string
  github?: string
}

interface Skill {
  filename: string
  heading: string
  content: string
  metadata: SkillMetadata
}

function parseMarkdown(markdown: string) {
  const { content: withoutFrontmatter, data } = matter(markdown)
  const mdast = fromMarkdown(withoutFrontmatter)

  let heading = ''
  visit(mdast, 'heading', (node: Heading) => {
    if (node.depth === 1) {
      if ('value' in node.children[0]) {
        heading = node.children[0].value
      }
      return EXIT
    }
  })

  return {
    heading: data.title || heading,
    content: withoutFrontmatter.trim(),
    metadata: data as SkillMetadata
  }
}

async function getAiSkillsImpl(): Promise<Skill[]> {
  const files = await readdir(SKILLS_DIRECTORY)

  const skills: Skill[] = []

  for (const file of files) {
    if (extname(file) !== '.md') continue

    const rawContent = await readFile(join(SKILLS_DIRECTORY, file), 'utf-8')
    const parsed = parseMarkdown(rawContent)

    skills.push({
      filename: basename(file, '.md'),
      heading: parsed.heading,
      content: parsed.content,
      metadata: parsed.metadata,
    })
  }

  return skills.sort((a, b) => b.filename.localeCompare(a.filename))
}

export const getAiSkills = cache(getAiSkillsImpl)

async function getAiSkillImpl(slug: string) {
  const filePath = join(SKILLS_DIRECTORY, `${slug}.md`)

  try {
    const rawContent = await readFile(filePath, 'utf-8')
    return parseMarkdown(rawContent)
  } catch (err) {
    console.error('Failed to fetch skill: %o', err)
    return null
  }
}

export const getAiSkill = cache(getAiSkillImpl)

export async function generateAiSkillMetadata(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const skill = await getAiSkill(slug)

  if (!skill) {
    return {
      title: `AI Skill | ${metadataTitle || 'Supabase'}`,
    }
  }

  return {
    title: `AI Skill: ${skill.heading} | Supabase Docs`,
    description: skill.metadata?.description || skill.heading,
  }
}

export async function generateAiSkillsStaticParams() {
  const skills = await getAiSkills()

  return skills.map((skill) => ({
    slug: skill.filename
  }))
}
