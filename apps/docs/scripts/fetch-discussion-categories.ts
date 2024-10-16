/* eslint-disable turbo/no-undeclared-env-vars */
import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/core'
import dotenv from 'dotenv'

dotenv.config()

async function fetchDiscussionCategories(owner: string, repo: string) {
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.SEARCH_GITHUB_APP_ID,
      installationId: process.env.SEARCH_GITHUB_APP_INSTALLATION_ID,
      privateKey: process.env.SEARCH_GITHUB_APP_PRIVATE_KEY,
    },
  })

  const query = `
    query fetchDiscussionCategories($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        discussionCategories(first: 100) {
          nodes {
            id
            name
          }
        }
      }
    }
  `

  const { repository } = await octokit.graphql<{
    repository: { discussionCategories: { nodes: { id: string; name: string }[] } }
  }>(query, { owner, repo })
  return repository.discussionCategories.nodes
}

async function main() {
  const owner = 'supabase'
  const repo = 'supabase'

  try {
    const categories = await fetchDiscussionCategories(owner, repo)
    console.log('Discussion Categories:')
    categories.forEach((category) => {
      console.log(`ID: ${category.id}, Name: ${category.name}`)
    })
  } catch (error) {
    console.error('Error fetching discussion categories:', error)
  }
}

main()
