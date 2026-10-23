import { type SearchResultInterface } from '../globalSearch/globalSearchInterface'

export const SDKLanguages: Record<string, { value: string; pathSection: string }> = {
  JAVASCRIPT: {
    value: 'JavaScript',
    pathSection: 'javascript',
  },
  SWIFT: {
    value: 'Swift',
    pathSection: 'swift',
  },
  DART: {
    value: 'Dart',
    pathSection: 'dart',
  },
  CSHARP: {
    value: 'C#',
    pathSection: 'csharp',
  },
  KOTLIN: {
    value: 'Kotlin',
    pathSection: 'kotlin',
  },
  PYTHON: {
    value: 'Python',
    pathSection: 'python',
  },
}

export const SDKLanguageValues = Object.values(SDKLanguages).map(({ value }) => value)

export class ReferenceSDKFunctionModel implements SearchResultInterface {
  public title?: string
  public href?: string
  public content?: string
  public language: string
  public methodName?: string

  constructor({
    title,
    href,
    content,
    language,
    methodName,
  }: {
    title?: string
    href?: string
    content?: string
    language: string
    methodName?: string
  }) {
    this.title = title
    this.href = href
    this.content = content
    this.methodName = methodName

    if (SDKLanguageValues.includes(language)) {
      this.language = language
    }
  }
}
