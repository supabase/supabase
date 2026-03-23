import matter from 'gray-matter'
import { cache } from 'react'

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
}

interface SkillSummary {
  name: string
  description: string
  installCommand: string
}

interface GitHubContentItem {
  name: string
  path: string
  type: 'file' | 'dir'
}

async function fetchGitHubDirectory(path: string): Promise<GitHubContentItem[]> {
  const url = `https://api.github.com/repos/${SKILLS_REPO.org}/${SKILLS_REPO.repo}/contents/${path}?ref=${SKILLS_REPO.branch}`

  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Supabase-Docs',
      },
      next: { revalidate: 3600 },
    })
  } catch (err) {
    throw new Error(`Failed to fetch agent skills directory from GitHub (network error)`, {
      cause: err,
    })
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch agent skills directory from GitHub: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  if (!Array.isArray(data)) {
    throw new Error('Expected directory listing from GitHub agent skills repo')
  }

  return data
}

async function fetchGitHubFile(path: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/${SKILLS_REPO.org}/${SKILLS_REPO.repo}/${SKILLS_REPO.branch}/${path}`

  let response: Response
  try {
    response = await fetch(url, {
      next: { revalidate: 3600 },
    })
  } catch (err) {
    throw new Error(`Failed to fetch agent skill file from GitHub (network error)`, { cause: err })
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch agent skill file from GitHub: ${response.status} ${response.statusText}`
    )
  }

  return await response.text()
}

async function getAiSkillsImpl(): Promise<SkillSummary[]> {
  const directories = await fetchGitHubDirectory(SKILLS_REPO.path)
  const skillDirs = directories.filter((item) => item.type === 'dir')

  const skills = await Promise.all(
    skillDirs.map(async (item) => {
      const skillPath = `${SKILLS_REPO.path}/${item.name}/SKILL.md`
      const rawContent = await fetchGitHubFile(skillPath)
      const { data } = matter(rawContent) as { data: SkillMetadata }

      return {
        name: item.name,
        description: data.description || '',
        installCommand: `npx skills add supabase/agent-skills --skill ${item.name}`,
      }
    })
  )

  return skills.sort((a, b) => a.name.localeCompare(b.name))
}

export const getAiSkills = cache(getAiSkillsImpl)
