import { graphql } from '@octokit/graphql'
import { writeToDisk } from './spec/gen/lib/helpers'
const dayjs = require('dayjs')
const relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)

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
            category {
              name
            }
            comments {
              totalCount
              nodes {
                author {
                  avatarUrl
                  url
                  login
                }
                body
                createdAt
              }
            }
            upvoteCount 
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
const postTemplate = ({
  title,
  author,
  avatarUrl,
  authorUrl,
  body,
  category,
  answer,
  upvoteCount,
  comments,
}) => `---
title: ${title}
author: ${author}
tags: [Question]
author_image_url: ${avatarUrl}
author_url: ${authorUrl}
category: ${category}
upvoteCount: ${upvoteCount}
commentCount: ${comments ? comments.totalCount : 0}
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

${body}

---

<a href="${answer.url}" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="${answer.author.url}" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="${answer.author.avatarUrl}"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">${answer.author.login}</span>
    <span style={{ color: '#8b949e' }}>${dayjs(answer.createdAt).fromNow()}</span>
  </span>
  </a>
  </div>
  ${answer.body}
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">${upvoteCount}</span></p>
    <p>${answer.replies?.totalCount || 0} replies</p>
  </div>
</details> 
`

async function fetchDiscussions() {
  const { repository } = await graphql(query, {
    headers: {
      authorization: `token secret123`,
    },
  })
  return repository
}

function formatDate(date) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear()

  if (month.length < 2) month = '0' + month
  if (day.length < 2) day = '0' + day

  return [year, month, day].join('-')
}

function slugify(str) {
  str = str.replace(/^\s+|\s+$/g, '') // trim
  str = str.toLowerCase()

  // remove accents, swap ñ for n, etc
  var from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;'
  var to = 'aaaaeeeeiiiioooouuuunc------'
  for (var i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i))
  }

  str = str
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-') // collapse dashes

  return str
}

// type Discussion = { id: string; author: string; body: string; title: string; createdAt: string; answer: string }

async function main() {
  // 1. Fetch the discussions
  // const discussions = await fetchDiscussions()

  // 2. Save discussions to disk
  // @TODO

  // 3. Transform the discussions into "blog" posts
  discussions.nodes.map(async (discussion) => {
    const { id, author, body, title, createdAt, answer, category, upvoteCount, comments } =
      discussion

    const voidTags = /(\<(img|hr|br|area|base|col|embed|param|source).*)(\>)/g

    let terminatedBody = body.replace(voidTags, '$1/$3')

    if (answer) {
      const post = postTemplate({
        title,
        author: author.login,
        authorUrl: author.url,
        avatarUrl: author.avatarUrl,
        body: terminatedBody,
        category: category.name,
        answer,
        upvoteCount,
        comments,
      })
      const fileName = `${formatDate(createdAt)}-${slugify(title)}.md`
      await writeToDisk(`./discussions/${fileName}`, post)
    }
  })
}

// Fire script
main()
