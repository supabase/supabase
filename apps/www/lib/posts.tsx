import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { generateReadingTime } from './helpers'

type Directories = '_blog' | '_case-studies' | '_alternatives'

// substring amount for file names
// based on YYYY-MM-DD format
const FILENAME_SUBSTRING = 11

export const getSortedPosts = (
  directory: Directories,
  limit?: number,
  tags?: any,
  runner?: any
) => {
  //Finding directory named "blog" from the current working directory of Node.
  const postDirectory = path.join(process.cwd(), directory)

  //Reads all the files in the post directory
  const fileNames = fs.readdirSync(postDirectory)

  // categories stored in this array

  const allPostsData = fileNames.map((filename) => {
    let slug = ''
    slug = filename.replace('.mdx', '')
    if (directory === '_blog') {
      slug = slug.substring(FILENAME_SUBSTRING)
    }

    const fullPath = path.join(postDirectory, filename)

    //Extracts contents of the MDX file
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
    const formattedDate = new Date(data.date).toLocaleDateString('en-IN', options)

    const readingTime = generateReadingTime(content)

    // construct url to link to blog posts
    // based on datestamp in file name
    let url = ''
    let contentPath = ''

    url = `/${directory.replace('_', '')}/${slug}`
    contentPath = `/${directory.replace('_', '')}/${slug}`

    const frontmatter = {
      ...data,
      date: formattedDate,
      readingTime,
      url: url,
      path: contentPath,
    }
    return {
      slug,
      ...frontmatter,
    }
  })

  let sortedPosts = [...allPostsData]

  sortedPosts = sortedPosts.sort((a, b) => {
    if (new Date(a.date) < new Date(b.date)) {
      return 1
    } else {
      return -1
    }
  })

  if (tags) {
    sortedPosts = sortedPosts.filter((post: any) => {
      const found = tags.some((tag: any) => post.tags.includes(tag))
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
  const posts = getSortedPosts(directory)
  let categories: any = []

  posts.map((post: any) => {
    // add tags into categories array
    post.tags.map((tag: string) => {
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
