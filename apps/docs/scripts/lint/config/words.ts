function single(word: string): [string, [string]] {
  return [word, [word]]
}

function plural(word: string): [string, [string, string]] {
  return [word, [word, `${word}s`]]
}

function pluralize(word: string): [string, string] {
  return plural(word)[1]
}

function multiword(...words: [string, ...string[]]): [string, string[]] {
  return [words[0].split(/\s+/)[0], [...words]]
}

type ExceptionList = Map<string, string[]>

export const capitalizedWords: ExceptionList = new Map([
  plural('API'),
  single('Firebase'),
  single('I'),
  multiword('JSON', ...pluralize('JSON Web Token')),
  plural('JWT'),
  single('Next.js'),
  single('OAuth'),
  single('Postgres'),
  single('Supabase'),
  plural('URL'),
  single('WebP'),
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
}): boolean {
  if (list.has(word)) {
    // If word directly matches, then it's on the exception list
    if (list.get(word).includes(word)) {
      return true
    }

    // If the exception list contains multiword terms, check for the multiword term
    const multiwords = list.get(word).filter(isMultiword)
    for (const term of multiwords) {
      if (fullString.indexOf(term, index) === index) {
        return true
      }
    }
  }

  return false
}
