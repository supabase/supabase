// file: pages/blog/[slug].js
import React from 'react'
import { IconHash, IconLink, Space, Typography } from '@supabase/ui'
import ReactMarkdown from 'react-markdown'
import DefaultLayout from '~/components/Layouts/Default'
import authors from 'lib/authors.json'
import blogStyles from './[slug].module.css'
const toc = require('markdown-toc')
const gfm = require('remark-gfm')

function BlogPostPage(props: any) {
  // @ts-ignore
  const author = props.blog.author ? authors[props.blog.author] : authors['supabase']

  return (
    <DefaultLayout>
      <div className="bg-white dark:bg-dark-700 overflow-hidden py-12">
        <div className="container mx-auto px-8 sm:px-16 xl:px-20 mt-16">
          <div className="max-w-3xl">
            <Space className="mb-4">
              <Typography.Text type="secondary">{props.blog.date}</Typography.Text>
              <Typography.Text type="secondary">•</Typography.Text>
              <Typography.Text type="secondary">5 min read</Typography.Text>
            </Space>
            <Typography.Title>{props.blog.title}</Typography.Title>
            {author && (
              <div className="mt-6">
                <Space size={4}>
                  {author.author_image_url && (
                    <img src={author.author_image_url} className="rounded-full w-10" />
                  )}
                  <Space direction="vertical" size={0}>
                    <Typography.Text>{author.author}</Typography.Text>
                    <Typography.Text type="secondary" small>
                      {author.position}
                    </Typography.Text>
                  </Space>
                </Space>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="py-12">
        <div className="container mx-auto px-8 sm:px-16 xl:px-10 mb-16 -mt-16">
          <div className="max-w-4xl">
            <img
              src={'/new/images/blog/' + props.blog.thumb}
              className="object-cover"
              style={{ maxHeight: '520px', width: '100%' }}
            />
          </div>
        </div>
        <div className="container mx-auto px-8 sm:px-16 xl:px-20 mb-16">
          {/* <div className="max-w-7xl">
            <Typography.Text className=" block mb-4">Table of contents</Typography.Text>
            <ol>
              {props.blog.toc.json.map((item: any) => {
                return <li className="underline mb-2">{item.content}</li>
              })}
            </ol>
          </div> */}
          <Typography.Text className="block mb-4 underline">Table of contents</Typography.Text>
          <Typography>
            <div className={blogStyles['toc']}>
              <ReactMarkdown plugins={[gfm]}>{props.blog.toc.content}</ReactMarkdown>
            </div>
          </Typography>
        </div>
        <div className="container mx-auto px-8 sm:px-16 xl:px-20">
          <div className="max-w-7xl">
            <Typography>
              <ReactMarkdown plugins={[gfm]} renderers={{ heading: HeadingRenderer }}>
                {props.blog.content}
              </ReactMarkdown>
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
  //   .process(content) // pass content to process)

  return {
    props: {
      blog: {
        toc: toc(content),
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

// Heading renderer solution
// https://github.com/remarkjs/react-markdown/issues/404

const flatten = (text: string, child: any) => {
  const result: any =
    typeof child === 'string'
      ? text + child
      : React.Children.toArray(child.props.children).reduce(flatten, text)

  return result
}

/**
 * HeadingRenderer is a custom renderer
 * It parses the heading and attaches an id to it to be used as an anchor
 */
const HeadingRenderer = (props: any) => {
  const children = React.Children.toArray(props.children)
  const text = children.reduce(flatten, '')
  const slug = text.toLowerCase().replace(/\W/g, '-')
  return (
    <a href={'#' + slug} style={{ textDecoration: 'none' }}>
      <Space>
        <span className={blogStyles['header']}>
          {React.createElement('h' + props.level, { id: slug }, [
            props.children,
            <IconLink size="small" className="ml-2 hidden" />,
          ])}
        </span>
      </Space>
    </a>
  )
}

export default BlogPostPage
