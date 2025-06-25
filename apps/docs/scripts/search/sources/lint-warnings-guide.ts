import { Octokit } from '@octokit/core'
import { BaseLoader, BaseSource } from './base.js'
import { createHash } from 'node:crypto'

const getBasename = (path: string) => path.split('/').at(-1)!.replace(/\.md$/, '')

export class LintWarningsGuideLoader extends BaseLoader {
  type = 'markdown' as const

  constructor(
    source: string,
    path: string,
    public org: string,
    public repo: string,
    public branch: string,
    public docsDir: string
  ) {
    super(source, path)
  }

  async load() {
    const octokit = new Octokit()

    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: this.org,
      repo: this.repo,
      path: this.docsDir,
      ref: this.branch,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    if (response.status >= 400) {
      throw Error(`Could not get contents of repo ${this.org}/${this.repo}`)
    }

    if (!Array.isArray(response.data)) {
      throw Error(
        'Reading a directory, not a file. Should not reach this, solely to appease Typescript.'
      )
    }

    const lintsList = response.data.filter(({ path }) => /docs\/\d+.+\.md$/.test(path))

    // Fetch all lint files and combine them into a single guide
    const lints = await Promise.all(
      lintsList.map(async ({ path }) => {
        const fileResponse = await fetch(
          `https://raw.githubusercontent.com/${this.org}/${this.repo}/${this.branch}/${path}`
        )

        if (fileResponse.status >= 400) {
          throw Error(`Could not get contents of file ${this.org}/${this.repo}/${path}`)
        }

        const content = await fileResponse.text()
        const basename = getBasename(path)

        return {
          path: basename,
          content,
          originalPath: path,
        }
      })
    )

    // Create a separate source for each lint file
    return lints.map(
      (lint) =>
        new LintWarningsGuideSource(
          this.source,
          `${this.path}?queryGroups=lint&lint=${lint.path}`,
          lint
        )
    )
  }
}

export class LintWarningsGuideSource extends BaseSource {
  type = 'markdown' as const

  constructor(
    source: string,
    path: string,
    public lint: {
      path: string
      content: string
      originalPath: string
    }
  ) {
    super(source, path)
  }

  process() {
    this.checksum = createHash('sha256').update(this.lint.content).digest('base64')

    this.meta = {
      title: `Database Advisor: Lint ${this.lint.path}`,
    }

    this.sections = [
      {
        content: this.lint.content,
      },
    ]

    return { checksum: this.checksum, meta: this.meta, sections: this.sections }
  }

  extractIndexedContent(): string {
    const sections = this.sections ?? []
    const sectionText = sections.map(({ content }) => content).join('\n\n')
    return `# ${this.lint.path}\n\n${sectionText}`
  }
}
