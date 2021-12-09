import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { generateReadingTime } from './helpers'

// substring amount for file names
// based on YYYY-MM-DD format
const FILENAME_SUBSTRING = 11

type Directories = '_blog' | '_case-studies'

export const getSortedPosts = (directory: Directories, limit?: number, tags?: any) => {
  //Finding directory named "blog" from the current working directory of Node.
  const postDirectory = path.join(process.cwd(), directory)

  //Reads all the files in the post directory
  const fileNames = fs.readdirSync(postDirectory)

  // categories stored in this array

  let allPostsData = fileNames.map((filename) => {
    const slug = filename.replace('.mdx', '')

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
    if (directory === '_blog') {
      const dates = getDatesFromFileName(filename)
      url = `${dates.year}/${dates.month}/${dates.day}/${slug.substring(FILENAME_SUBSTRING)}`
    } else {
      url = `/${directory.replace('_', '')}/${slug}`
    }

    const frontmatter = {
      ...data,
      date: formattedDate,
      readingTime,
      url: url,
    }
    return {
      slug,
      ...frontmatter,
    }
  })

  allPostsData = allPostsData.sort((a, b) => {
    if (new Date(a.date) < new Date(b.date)) {
      return 1
    } else {
      return -1
    }
  })

  if (tags) {
    allPostsData = allPostsData.filter((post: any) => {
      const found = tags.some((tag: any) => post.tags.includes(tag))
      return found
    })
  }

  if (limit) allPostsData = allPostsData.slice(0, limit)

  return allPostsData
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

// Get Post based on Slug
export const getPostdata = async (slug: string, directory: string) => {
  //Finding directory named "blog" from the current working directory of Node.
  const postDirectory = path.join(process.cwd(), directory)

  const fullPath = path.join(postDirectory, `${slug}.mdx`)

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
