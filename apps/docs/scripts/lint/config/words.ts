function single(word: string): [string, [string]] {
  return [word, [word]]
}

// Something is wrong with catching of plurals, see URLs, APIs
function plural(word: string): [string, [string, string]] {
  return [word, [`${word}s`, word]]
}

function pluralize(word: string): [string, string] {
  return plural(word)[1]
}

// Words are sorted in reverse so that longer potential matches are exhausted first
function multiword(...words: [string, ...string[]]): [string, string[]] {
  return [words[0].split(/\s+/)[0], [...words].sort((a, b) => b.length - a.length)]
}

type ExceptionList = Map<string, string[]>

export const capitalizedWords: ExceptionList = new Map([
  multiword('Auth', 'Auth UI'),
  plural('API'),
  single('Captcha'),
  multiword('ChatGPT', ...pluralize('ChatGPT Retrieval Plugin')),
  single('CLI'),
  single('CLIP'),
  single('CSS'),
  multiword('Edge Function'),
  single('Firebase'),
  single('Flutter'),
  multiword('GitHub Actions'),
  single('HNSW'),
  single('HTML'),
  multiword('Hugging Face'),
  single('I'),
  single('IVFFlat'),
  multiword('JSON', ...pluralize('JSON Web Token')),
  plural('JWT'),
  single('L2'),
  multiword('Navigable Small World'),
  single('Next.js'),
  single('OAuth'),
  single('OpenAI'),
  single('PKCE'),
  single('Poetry'),
  single('Postgres'),
  single('Python'),
  single('REST'),
  single('RLS'),
  multiword('Roboflow', 'Roboflow Inference'),
  multiword('Row Level Security'),
  single('SSR'),
  single('Supabase'),
  single('Transformers.js'),
  single('TypeScript'),
  plural('URL'),
  single('WebP'),
  plural('Wrapper'),
])

function isMultiword(word: string) {
  return /\s+/.test(word)
}

export function isException({
  list,
  word,
  fullString,
  index,
}: {
  list: ExceptionList
  word: string
  fullString: string
  index: number
}): { exception: boolean; advanceIndexBy?: number } {
  if (list.has(word)) {
    // If the exception list contains multiword terms, check for the multiword term
    const multiwords = list.get(word).filter(isMultiword)
    for (const term of multiwords) {
      if (fullString.indexOf(term, index) === index) {
        return { exception: true, advanceIndexBy: term.length - word.length }
      }
    }

    // If word directly matches, then it's on the exception list
    if (list.get(word).includes(word)) {
      return { exception: true, advanceIndexBy: 0 }
    }
  }

  // 0 beause it means the cursor doesn't need to move
  return { exception: false }
}
