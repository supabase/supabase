import { stripIndent } from 'common-tags'

export function getEdgeFunctionUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')

  if (!supabaseUrl) return undefined

  // https://github.com/supabase/supabase-js/blob/10d3423506cbd56345f7f6ab2ec2093c8db629d4/src/SupabaseClient.ts#L96
  const isPlatform = supabaseUrl.match(/(supabase\.co)|(supabase\.in)/)

  if (isPlatform) {
    const [schemeAndProjectId, domain, tld] = supabaseUrl.split('.')
    return `${schemeAndProjectId}.functions.${domain}.${tld}`
  } else {
    return `${supabaseUrl}/functions/v1`
  }
}

export function promptDataReducer(
  state: any[],
  action: {
    index?: number
    answer?: string | undefined
    status?: string
    query?: string | undefined
    type?: 'remove-last-item' | string
  }
) {
  // set a standard state to use later
  let current = [...state]

  if (action.type) {
    switch (action.type) {
      case 'remove-last-item':
        current.pop()
        return [...current]
      default:
        break
    }
  }

  // check that an index is present
  if (action.index === undefined) return [...state]

  if (!current[action.index]) {
    current[action.index] = { query: '', answer: '', status: '' }
  }

  current[action.index].answer = action.answer

  if (action.query) {
    current[action.index].query = action.query
  }
  if (action.status) {
    current[action.index].status = action.status
  }

  return [...current]
}

export const generatePrompt = (prompt: string, definitions?: any) => {
  return stripIndent`
${
  definitions !== undefined
    ? `
Given the following Postgres SQL tables:
${definitions}
`
    : ''
}

Generate a Postgres SQL query based on the following natural language prompt.
- Only output valid SQL - all explanations must be SQL comments
- SQL comments should be short
- Your very last output should be "\`\`\`"
- For primary keys, always use "integer primary key generated always as identity"

Natural language prompt:
${prompt}
  
Postgres SQL query (markdown SQL only):
`.trim()
}

/**
 * Formats a string for use as a title.
 *
 * Removes punctuation and capitalizes each word
 */
export function formatTitle(value: string) {
  let words = value.replace(/\.$/, '').replace(/['"]/g, '').split(' ')
  words = words.map((word) => {
    // Don't capitalize code
    if (/[._\(\)]+/.test(word)) {
      return word
    }
    return word.charAt(0).toUpperCase() + word.slice(1)
  })
  return words.join(' ')
}
