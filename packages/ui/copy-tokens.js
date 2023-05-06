const https = require('https')
const fs = require('fs')

// using Math.random() in a param as GitHub caches raw content
// const url = `https://raw.githubusercontent.com/MildTomato/supabase-design-tokens/${branch}/tokens.json?e=${Math.random()}`
const baseUrl = `https://raw.githubusercontent.com/MildTomato/supabase-design-tokens/${branch}/tokens/`

/*
 * Branch to target in GitHub repo
 */
const branch = 'feat/new-components'

/*
 * Files that need to be copied over from Tokens repo
 */
const urls = [
  // figma tokens misc config files
  baseUrl + '$metadata.json',
  baseUrl + '$themes.json',
  // source files
  baseUrl + 'global.json',
  baseUrl + 'global-two.json',
  baseUrl + 'typography.json',
  // root theme
  baseUrl + 'root.json',
  // themes
  baseUrl + 'light.json',
  baseUrl + 'darker-dark.json',
]

async function getTokensFile() {
  const promises = urls.map((url, i) => {
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            fs.writeFile(`./tokens/${url.replace(baseUrl, '')}`, data, 'utf8', () => {})
            resolve(data)
          })
        })
        .on('error', (err) => {
          reject(err)
        })
    })
  })

  await Promise.all(promises)
}

async function copyFiles() {
  console.log('Copying token files... \n')
  console.log('branch to pull is:', branch)
  try {
    await getTokensFile()
  } catch (error) {
    console.error(error)
  }
}

copyFiles()
