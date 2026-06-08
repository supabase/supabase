import matter from 'gray-matter'
import { cache } from 'react'

import { OCTOKIT_RETRY_OPTIONS, getGitHubFileContents, octokit } from '~/lib/octokit'

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

async function getAiSkillsImpl(): Promise<SkillSummary[]> {
  const { data: contents } = await octokit().request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: SKILLS_REPO.org,
    repo: SKILLS_REPO.repo,
    path: SKILLS_REPO.path,
    ref: SKILLS_REPO.branch,
    request: OCTOKIT_RETRY_OPTIONS,
  })

  if (!Array.isArray(contents)) {
    throw new Error('Expected directory listing from GitHub agent skills repo')
  }

  const skillDirs = contents.filter((item) => item.type === 'dir')

  const skills = await Promise.all(
    skillDirs.map(async (item) => {
      const skillPath = `${SKILLS_REPO.path}/${item.name}/SKILL.md`
      const rawContent = await getGitHubFileContents({
        org: SKILLS_REPO.org,
        repo: SKILLS_REPO.repo,
        branch: SKILLS_REPO.branch,
        path: skillPath,
      })
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
