import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { generateReadingTime } from './helpers'

type Directories = '_blog' | '_case-studies' | '_customers' | '_alternatives'

// substring amount for file names
// based on YYYY-MM-DD format
const FILENAME_SUBSTRING = 11

type GetSortedPostsParams = {
  directory: Directories
  limit?: number
  tags?: string[]
  runner?: unknown
  currentPostSlug?: string
}

export const getSortedPosts = ({
  directory,
  limit,
  tags,
  currentPostSlug,
}: GetSortedPostsParams) => {
  //Finding directory named "blog" from the current working directory of Node.
  const postDirectory = path.join(process.cwd(), directory)

  //Reads all the files in the post directory
  const fileNames = fs.readdirSync(postDirectory)

  const posts = []

  for (const filename of fileNames) {
    const slug =
      directory === '_blog'
        ? filename.replace('.mdx', '').substring(FILENAME_SUBSTRING)
        : filename.replace('.mdx', '')

    // avoid reading content if it's the same post as the one the user is already reading
    if (slug === currentPostSlug) {
      continue
    }

    const fullPath = path.join(postDirectory, filename)

    //Extracts contents of the MDX file
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents) as unknown as {
      data: { [key: string]: any; tags?: string[] }
      content: string
    }

    // if no matching tags, there's no need to do the rest
    if (tags && !tags.some((tag) => data.tags?.includes(tag))) {
      continue
    }

    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
    const formattedDate = new Date(data.date).toLocaleDateString('en-IN', options)

    const readingTime = generateReadingTime(content)

    const url = `/${directory.replace('_', '')}/${slug}`
    const contentPath = `/${directory.replace('_', '')}/${slug}`

    const frontmatter = {
      ...data,
      date: formattedDate,
      readingTime,
      publishedAt: data.published_at ?? null,
      url: url,
      path: contentPath,
    }

    const post = {
      slug,
      ...frontmatter,
    }

    posts.push(post)
  }

  /* Array.prototype.sort(), mutates the original array ¯\_(ツ)_/¯
   * so no need to re-assign -> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
   */
  posts.sort((a, b) => {
    const isPublishedAtBefore =
      a.publishedAt && b.publishedAt && Date.parse(a.publishedAt) < Date.parse(b.publishedAt)

    if (isPublishedAtBefore || new Date(a.date) < new Date(b.date)) {
      return 1
    }

    return -1
  })

  return posts.slice(0, limit)
}

// Get Slugs
export const getAllPostSlugs = (directory: Directories) => {
  //Finding directory named "blog" from the current working directory of Node.
  const postDirectory = path.join(process.cwd(), directory)

  const fileNames = fs.readdirSync(postDirectory)

  const files = fileNames.map((filename) => {
    const dates =
      directory === '_blog'
        ? getDatesFromFileName(filename)
        : {
            year: '2021',
            month: '04',
            day: '02',
          }

    return {
      params: {
        ...dates,
        slug: filename
          .replace('.mdx', '')
          .substring(directory === '_blog' ? FILENAME_SUBSTRING : 0),
      },
    }
  })

  return files
}

export const getPostdata = async (slug: string, directory: string) => {
  /**
   * All files are mdx files
   */
  const fileType = 'mdx'
  slug = slug + '.' + fileType

  /**
   * Return full directory
   */
  const postDirectory = path.join(process.cwd(), directory)
  const folderfiles = fs.readdirSync(postDirectory)

  /**
   * Check if the file exists in the directory
   * This should return 1 result
   *
   * this is so slugs like 'blog-post.mdx' will work
   * even if the mdx file is date namednamed like '2022-01-01-blog-post.mdx'
   */
  const found = folderfiles.filter((x) => x.includes(slug))[0]

  const fullPath = path.join(postDirectory, found)
  const postContent = fs.readFileSync(fullPath, 'utf8')
  return postContent
}

export const getAllCategories = (directory: Directories) => {
  const posts = getSortedPosts({ directory })
  let categories: any = []

  posts.map((post: any) => {
    // add tags into categories array
    post.tags?.map((tag: string) => {
      if (!categories.includes(tag)) return categories.push(tag)
    })
  })

  return categories
}

const getDatesFromFileName = (filename: string) => {
  // extract YYYY, MM, DD from post name
  const year = filename.substring(0, 4)
  const month = filename.substring(5, 7)
  const day = filename.substring(8, 10)

  return {
    year,
    month,
    day,
  }
}
