import type { CodeContext } from './types'
import { getLanguageLabel, normalizeCodeLanguage } from './languageIcon'

const REALTIME_QUESTIONS = [
  'How do I authorize this channel?',
  "What's the difference between public and private channels?",
  'How do I test this locally?',
]

const DEFAULT_QUESTIONS = [
  'How do I get started with Supabase?',
  'How do I connect to my database?',
  'How do I set up authentication?',
]

function getLanguageSpecificQuestions(language: string): string[] {
  switch (normalizeCodeLanguage(language)) {
    case 'js':
    case 'jsx':
    case 'javascript':
    case 'ts':
    case 'tsx':
    case 'typescript':
      return [
        'What does this JavaScript code do?',
        'How do I use this with the Supabase client?',
        'How should I handle errors here?',
      ]
    case 'dart':
    case 'flutter':
      return [
        'What does this Dart code do?',
        'How do I run this in a Flutter app?',
        'What Supabase packages does this use?',
      ]
    case 'swift':
      return [
        'What does this Swift code do?',
        'How do I integrate this with my iOS app?',
        'What setup does this require?',
      ]
    case 'kotlin':
      return [
        'What does this Kotlin code do?',
        'How do I use this in an Android project?',
        'What dependencies does this require?',
      ]
    case 'python':
    case 'py':
      return [
        'What does this Python code do?',
        'How do I run this locally?',
        'What environment variables does this need?',
      ]
    case 'sql':
    case 'pgsql':
      return [
        'What does this SQL do?',
        'Is this safe to run in production?',
        'How would I adapt this for my schema?',
      ]
    case 'bash':
    case 'sh':
    case 'shell':
      return [
        'What does this command do?',
        'What do I need installed to run this?',
        'How do I troubleshoot if this fails?',
      ]
    default:
      return [
        'What does this code do?',
        'Explain this step by step',
        'How do I adapt this for my app?',
      ]
  }
}

function mergeUniqueQuestions(primary: string[], secondary: string[]) {
  const seen = new Set<string>()
  const merged: string[] = []

  for (const question of [...primary, ...secondary]) {
    if (seen.has(question)) continue
    seen.add(question)
    merged.push(question)
  }

  return merged.slice(0, 3)
}

export function getExampleQuestions(
  codeContext: CodeContext | null,
  isCodeContextEnabled: boolean,
  pageSectionQuestions: string[] = []
) {
  if (codeContext && isCodeContextEnabled) {
    const languageQuestions = getLanguageSpecificQuestions(codeContext.language)

    if (codeContext.pagePath.includes('/guides/realtime')) {
      return mergeUniqueQuestions(languageQuestions, REALTIME_QUESTIONS)
    }

    return languageQuestions
  }

  if (pageSectionQuestions.length > 0) {
    return pageSectionQuestions.slice(0, 3)
  }

  if (codeContext?.pagePath.includes('/guides/realtime')) {
    return REALTIME_QUESTIONS
  }

  return DEFAULT_QUESTIONS
}

export function getSuggestionKey(
  codeContext: CodeContext | null,
  revision: number,
  pageSectionQuestions: string[] = []
) {
  if (!codeContext) {
    const sectionsKey =
      pageSectionQuestions.length > 0 ? pageSectionQuestions.join('|') : 'default'
    return `page-${revision}-${sectionsKey}`
  }

  return `${revision}-${codeContext.language}-${codeContext.lineCount}-${codeContext.content.slice(0, 48)}`
}

export function getSuggestionLabel(
  codeContext: CodeContext | null,
  isCodeContextEnabled: boolean,
  pageSectionQuestions: string[] = []
) {
  if (codeContext && isCodeContextEnabled) {
    return `Suggested for ${getLanguageLabel(codeContext.language, codeContext.lineCount)}`
  }

  if (pageSectionQuestions.length > 0) {
    return 'On this page'
  }

  return 'Examples'
}
