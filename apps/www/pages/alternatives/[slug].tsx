import matter from 'gray-matter'
import authors from 'lib/authors.json'
import LayoutComparison from '~/layouts/comparison'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { mdxSerialize } from '~/lib/mdx/mdxSerialize'
import { getAllPostSlugs, getPostdata, getSortedPosts } from '~/lib/posts'

// import all components used in blog articles here
// for instance, if you use a button, you must add `Button` in the components object below.

// table of contents extractor
const toc = require('markdown-toc')

export async function getStaticPaths() {
  const paths = getAllPostSlugs('_alternatives')
  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps({ params }: any) {
  const filePath = `${params.slug}`
  const postContent = await getPostdata(filePath, '_alternatives')
  const { data, content } = matter(postContent)

  const mdxSource: any = await mdxSerialize(content)

  const relatedPosts = getSortedPosts({
    directory: '_alternatives',
    limit: 5,
    tags: mdxSource.scope.tags,
  })

  const allPosts = getSortedPosts({ directory: '_alternatives' })

  const currentIndex = allPosts
    .map(function (e) {
      return e.slug
    })
    .indexOf(filePath)

  const nextPost = allPosts[currentIndex + 1]
  const prevPost = allPosts[currentIndex - 1]

  return {
    props: {
      prevPost: currentIndex === 0 ? null : prevPost ? prevPost : null,
      nextPost: currentIndex === allPosts.length ? null : nextPost ? nextPost : null,
      relatedPosts,
      blog: {
        slug: `${params.slug}`,
        content: mdxSource,
        source: content,
        ...data,
        toc: toc(content, { maxdepth: data.toc_depth ? data.toc_depth : 2 }),
      },
    },
  }
}

function BlogPostPage(props: any) {
  // @ts-ignore
  // const content = hydrate(props.blog.content, { components })
  // const content = props.blog.content
  const authorArray = props.blog.author.split(',')

  const author = []
  for (let i = 0; i < authorArray.length; i++) {
    author.push(
      // @ts-ignore
      authors.find((authors: string) => {
        // @ts-ignore
        return authors.author_id === authorArray[i]
      })
    )
  }

  return <LayoutComparison components={mdxComponents()} props={props} />
}

export default BlogPostPage
