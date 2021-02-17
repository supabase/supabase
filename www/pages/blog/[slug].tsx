// file: pages/blog/[slug].js
import React from 'react'
import { Typography } from '@supabase/ui'
import ReactMarkdown from 'react-markdown'
import DefaultLayout from '~/components/Layouts/Default'

function BlogPostPage(props: any) {
  return (
    <DefaultLayout>
      <div className="bg-white dark:bg-dark-700 overflow-hidden py-12">
        <div className="container mx-auto px-8 sm:px-16 xl:px-20 mt-16">
          <div className="mx-auto max-w-7xl">
            <Typography.Title>{props.blog.title}</Typography.Title>
          </div>
        </div>
      </div>
      <div className="overflow-hidden py-12">
        <div className="container mx-auto px-8 sm:px-16 xl:px-20">
          <div className="mx-auto max-w-7xl">
            <Typography>
              <ReactMarkdown>{props.blog.content}</ReactMarkdown>
            </Typography>
          </div>
        </div>
      </div>
    </DefaultLayout>
  )
}

// pass props to BlogPostPage component
export async function getStaticProps(context: any) {
  const fs = require('fs')
  // const html = require('remark-html')
  // const highlight = require('remark-highlight.js')
  // const unified = require('unified')
  // const markdown = require('remark-parse')
  const matter = require('gray-matter')

  const slug = context.params.slug // get slug from params
  const path = `${process.cwd()}/_blog/${slug}.md`

  // read file content and store into rawContent variable
  const rawContent = fs.readFileSync(path, {
    encoding: 'utf-8',
  })

  const { data, content } = matter(rawContent) // pass rawContent to gray-matter to get data and content

  // const result = await unified()
  //   .use(markdown)
  //   .use(highlight) // highlight code block
  //   .use(html)
  //   .process(content) // pass content to process

  return {
    props: {
      blog: {
        ...data,
        // content: result.toString(),
        content: content,
      },
    },
  }
}

// generate HTML paths at build time
export async function getStaticPaths(context: any) {
  const fs = require('fs')

  const path = `${process.cwd()}/_blog`
  const files = fs.readdirSync(path, 'utf-8')

  const markdownFileNames = files
    .filter((fn: any) => fn.endsWith('.md'))
    .map((fn: any) => fn.replace('.md', ''))

  return {
    paths: markdownFileNames.map((fileName: any) => {
      return {
        params: {
          slug: fileName,
        },
      }
    }),
    fallback: false,
  }
}

export default BlogPostPage
