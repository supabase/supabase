import matter from 'gray-matter'
import type { Heading } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { cache } from 'react'
import { visit, EXIT } from 'unist-util-visit'
import { getCustomContent } from '~/lib/custom-content/getCustomContent'

const { metadataTitle } = getCustomContent(['metadata:title'])

const SKILLS_REPO = {
  org: 'supabase',
  repo: 'agent-skills',
  branch: 'main',
  path: 'skills',
}

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

interface GitHubContentItem {
  name: string
  path: string
  type: 'file' | 'dir'
  download_url?: string
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
    heading: data.title || data.name || heading,
    content: withoutFrontmatter.trim(),
    metadata: data as SkillMetadata,
  }
}

async function fetchGitHubDirectory(path: string): Promise<GitHubContentItem[]> {
  const url = `https://api.github.com/repos/${SKILLS_REPO.org}/${SKILLS_REPO.repo}/contents/${path}?ref=${SKILLS_REPO.branch}`

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Supabase-Docs',
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const data = await response.json()
    if (!Array.isArray(data)) {
      throw new Error('Expected directory listing')
    }

    return data
  } catch (err) {
    console.error('Failed to fetch GitHub directory: %o', err)
    return []
  }
}

async function fetchGitHubFile(path: string): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${SKILLS_REPO.org}/${SKILLS_REPO.repo}/${SKILLS_REPO.branch}/${path}`

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`GitHub raw file error: ${response.status}`)
    }

    return await response.text()
  } catch (err) {
    console.error('Failed to fetch GitHub file: %o', err)
    return null
  }
}

async function getAiSkillsImpl(): Promise<Skill[]> {
  const directories = await fetchGitHubDirectory(SKILLS_REPO.path)

  const skills: Skill[] = []

  for (const item of directories) {
    if (item.type !== 'dir') continue

    const skillPath = `${SKILLS_REPO.path}/${item.name}/SKILL.md`
    const rawContent = await fetchGitHubFile(skillPath)

    if (!rawContent) continue

    const parsed = parseMarkdown(rawContent)

    skills.push({
      filename: item.name,
      heading: parsed.heading,
      content: parsed.content,
      metadata: {
        ...parsed.metadata,
        github: `https://github.com/${SKILLS_REPO.org}/${SKILLS_REPO.repo}/tree/${SKILLS_REPO.branch}/${SKILLS_REPO.path}/${item.name}`,
      },
    })
  }

  return skills.sort((a, b) => a.heading.localeCompare(b.heading))
}

export const getAiSkills = cache(getAiSkillsImpl)

async function getAiSkillImpl(slug: string) {
  const skillPath = `${SKILLS_REPO.path}/${slug}/SKILL.md`
  const rawContent = await fetchGitHubFile(skillPath)

  if (!rawContent) return null

  const parsed = parseMarkdown(rawContent)
  return {
    ...parsed,
    metadata: {
      ...parsed.metadata,
      github: `https://github.com/${SKILLS_REPO.org}/${SKILLS_REPO.repo}/tree/${SKILLS_REPO.branch}/${SKILLS_REPO.path}/${slug}`,
    },
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
    slug: skill.filename,
  }))
}
