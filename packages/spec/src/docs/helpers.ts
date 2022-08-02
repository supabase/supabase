import fs from 'fs'

export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/[. )(]/g, '-') // Replace spaces and brackets -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

/**
 * writeToDisk()
 */
export const writeToDisk = (fileName: string, content: any) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, content, (err: any) => {
      if (err) return reject(err)
      else return resolve(true)
    })
  })
}
