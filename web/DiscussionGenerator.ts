import { graphql } from '@octokit/graphql'
import { writeToDisk } from './spec/gen/lib/helpers'
const fs = require('fs')

const discussions = require('./src/data/github/discussions')
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

async function fetchDiscussions() {
  const { repository } = await graphql(query, {
    headers: {
      authorization: `token secret123`,
    },
  })
  return repository
}

// type Discussion = { id: string; author: string; body: string; title: string; createdAt: string; answer: string }

async function main() {
  // 1. Fetch the discussions
  // const discussions = await fetchDiscussions()

  // 2. Save discussions to disk
  // @TODO

  // 3. Transform the discussions into "blog" posts
  discussions.nodes.map(async (discussion) => {
    const { id, author, body, title, createdAt, answer } = discussion

    // console.log('author', author)

//     ---
// title: Welcome Docusaurus v2
// author: Joel Marcey
// author_title: Co-creator of Docusaurus 1
// author_url: https://github.com/JoelMarcey
// author_image_url: https://avatars3.githubusercontent.com/u/13352?s=400&amp;v=4
// tags: [hello, docusaurus-v2]
// description: This is my first post on Docusaurus 2.
// image: https://i.imgur.com/mErPwqL.png
// hide_table_of_contents: false
// ---
    const post = `---
title: ${title}
author: ${author.login}
author_image_url: ${author.avatarUrl}
---
    `
    const fileName = `${id}.md`
    await writeToDisk(`./discussions/${fileName}`, post)
  })
}

// Fire script
main()
