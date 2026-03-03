import fs from 'fs'
import matter from 'gray-matter'
import path from 'path'
import { generateReadingTime } from './helpers'

type Directories = '_blog' | '_case-studies' | '_customers' | '_alternatives' | '_events'

// substring amount for file names
// based on YYYY-MM-DD format
export const FILENAME_SUBSTRING = 11

export type Post = {
  slug: string
  title?: string
  description?: string
  author?: string
  imgSocial?: string
  imgThumb?: string
  categories?: string[]
  tags?: string[]
  date?: string
  toc_depth?: number
  formattedDate: string
  readingTime: string
  url: string
  path: string

  [key: string]: any // Allow additional properties from frontmatter
}

type GetSortedPostsParams = {
  directory: Directories
  limit?: number
  tags?: string[]
  runner?: unknown
  currentPostSlug?: string
  categories?: any
}

export const getSortedPosts = ({
  directory,
  limit,
  tags,
  categories,
  currentPostSlug,
}: GetSortedPostsParams): Post[] => {
  //Finding directory named "blog" from the current working directory of Node.
  const postDirectory = path.join(process.cwd(), directory)

  //Reads all the files in the post directory
  const fileNames = fs.readdirSync(postDirectory)

  const allPosts = fileNames
    .map((filename) => {
      const slug =
        directory === '_blog' || directory === '_events'
          ? filename.replace('.mdx', '').substring(FILENAME_SUBSTRING)
          : filename.replace('.mdx', '')

      const fullPath = path.join(postDirectory, filename)

      //Extracts contents of the MDX file
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents) as unknown as {
        data: { [key: string]: any; tags?: string[] }
        content: string
      }

      const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
      const formattedDate = new Date(data.date).toLocaleDateString('en-IN', options)

      const readingTime = generateReadingTime(content)

      const url = `/${directory.replace('_', '')}/${slug}`
      const contentPath = `/${directory.replace('_', '')}/${slug}`

      const frontmatter = {
        ...data,
        formattedDate,
        readingTime,
        url: url,
        path: contentPath,
      }

      return {
        slug,
        ...frontmatter,
      }
    })
    // avoid reading content if it's the same post as the one the user is already reading
    .filter((post) => post.slug !== currentPostSlug)

  let sortedPosts = [...allPosts]

  sortedPosts = sortedPosts.sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  if (categories) {
    sortedPosts = sortedPosts.filter((post: any) => {
      const found = categories?.some((tag: any) => post.categories?.includes(tag))
      return found
    })
  }

  if (tags) {
    sortedPosts = sortedPosts.filter((post: any) => {
      const found = tags.some((tag: any) => post.tags?.includes(tag))
      return found
    })
  }

  if (limit) sortedPosts = sortedPosts.slice(0, limit)

  return sortedPosts
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
          .substring(directory === '_blog' || directory === '_events' ? FILENAME_SUBSTRING : 0),
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
    post.categories?.map((tag: string) => {
      if (!categories.includes(tag)) return categories.push(tag)
    })
  })

  return categories
}

export const getAllTags = (directory: Directories) => {
  const posts = getSortedPosts({ directory })
  let tags: any = []

  posts.map((post: any) => {
    post.tags?.map((tag: string) => {
      if (!tags.includes(tag)) return tags.push(tag)
    })
  })

  return tags
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
