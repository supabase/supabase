import 'dotenv/config'
import fs from 'node:fs'

import { fetchSources } from './search/sources'

async function generateLlmsTxtInner() {
  let res = '# Supabase Docs'

  const sources = await fetchSources()
  const sourceTexts = sources
    .map((source) => {
      source.process()
      return source.extractIndexedContent()
    })
    .join('\n\n')

  res += '\n\n' + sourceTexts
  return res
}

async function generateLlmsTxt() {
  const res = await generateLlmsTxtInner()
  fs.writeFileSync('public/llms.txt', res)
}

if (require.main === module) {
  generateLlmsTxt()
}
