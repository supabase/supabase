import * as fs from 'fs'
import * as _ from 'lodash'

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

// Uppercase the first letter of a string
export const toTitle = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1)
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

/**
 * Convert Object to Array of values
 */
export const toArrayWithKey = (obj: object, keyAs: string) =>
  _.values(
    _.mapValues(obj, (value: any, key: string) => {
      value[keyAs] = key
      return value
    })
  )
