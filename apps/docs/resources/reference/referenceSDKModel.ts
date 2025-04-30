import { type SearchResultInterface } from '../globalSearch/globalSearchInterface'

export const SDKLanguages: Record<string, { value: string; pathSection: string }> = {
  JavaScript: {
    value: 'JavaScript',
    pathSection: 'javascript',
  },
  Swift: {
    value: 'Swift',
    pathSection: 'swift',
  },
  Dart: {
    value: 'Dart',
    pathSection: 'dart',
  },
  CSharp: {
    value: 'C#',
    pathSection: 'csharp',
  },
  Kotlin: {
    value: 'Kotlin',
    pathSection: 'kotlin',
  },
  Python: {
    value: 'Python',
    pathSection: 'python',
  },
}

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
    this.language = language
    this.methodName = methodName
  }
}
