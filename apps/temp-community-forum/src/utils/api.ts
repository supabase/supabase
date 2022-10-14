import { graphql } from '@octokit/graphql'

const query = `
{
    repository(owner: "supabase", name: "supabase") {
        discussions(first: 10) {
            nodes {
            id
            author {
                avatarUrl
                url
                login
            }
            body
            title
            answer {
                author {
                avatarUrl
                login
                }
                body
                createdAt
            }
            createdAt
            }
            totalCount
            pageInfo {
            startCursor
            endCursor
            hasNextPage
            hasPreviousPage
            }
        }
    }
}
`
export async function fetchDiscussions() {
  // @ts-ignore
  const { repository } = await graphql(query, {
    headers: {
      authorization: `token ${process.env.NEXT_PUBLIC_DISCUSSIONS_TOKEN}`,
    },
  })
  return repository.discussions.nodes
}
