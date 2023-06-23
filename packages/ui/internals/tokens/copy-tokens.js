const https = require('https')
const fs = require('fs')

/*
 * Branch to target in GitHub repo
 */
const branch = 'feat/figma-variables' // 'feat/new-components'
// using Math.random() in a param as GitHub caches raw content
// const url = `https://raw.githubusercontent.com/MildTomato/supabase-design-tokens/${branch}/tokens.json?e=${Math.random()}`
const baseUrl = `https://raw.githubusercontent.com/MildTomato/supabase-design-tokens/${branch}/tokens/`

console.log(baseUrl)
/*
 * Files that need to be copied over from Tokens repo
 */
const TOKEN_FILES_METADATA = [
  // figma tokens misc config files (comment out for now)
  // { fileName: '$metadata.json', type: 'config' },
  // { fileName: '$themes.json', type: 'config' },
  // source files (comment out for now)
  { fileName: 'global.json', type: 'source', subdirectory: '' },
  // { fileName: 'global-two.json', type: 'source' },
  // semantic (comment out for now)
  // { fileName: 'typography.json', type: 'semantic' },
  // themes
  // { fileName: 'root.json', type: 'theme', subdirectory: 'new/' }, // root theme
  { fileName: 'dark.json', type: 'theme', subdirectory: 'new/' },
  { fileName: 'light.json', type: 'theme', subdirectory: 'new/' },
  // { fileName: 'darker-dark.json', type: 'theme', subdirectory: 'new/' },
]

const PATHS = {
  config: 'config/',
  source: 'source/',
  theme: 'themes/',
  semantic: 'semantic/',
}

async function getTokensFile() {
  const promises = TOKEN_FILES_METADATA.map((tokenMetadata, i) => {
    return new Promise((resolve, reject) => {
      console.log(
        'URL being copied',
        baseUrl +
          tokenMetadata.subdirectory +
          tokenMetadata.fileName +
          `?e=${Math.floor(Math.random() * 1000000)}`
      )
      https
        .get(
          baseUrl +
            tokenMetadata.subdirectory +
            tokenMetadata.fileName +
            `?e=${Math.floor(Math.random() * 1000000)}`,
          (res) => {
            // console.log('res', res)
            let data = ''
            res.on('data', (chunk) => {
              data += chunk
            })
            res.on('end', () => {
              console.log(
                'should save to ',
                `./tokens/${PATHS[tokenMetadata.type]}${tokenMetadata.fileName}`
              )
              fs.writeFile(
                `./tokens/${PATHS[tokenMetadata.type]}${tokenMetadata.fileName}`,
                data,
                'utf8',
                () => {}
              )
              resolve(data)
            })
          }
        )
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
