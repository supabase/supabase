import { createClient } from '@supabase/supabase-js'
import { compact } from 'lodash'
import { Book, Github, Hash, MessageSquare } from 'lucide-react'

import {
  DocsSearchResultType as PageType,
  type DocsSearchResult as Page,
  type DocsSearchResultSection as PageSection,
} from 'common'
import { uuidv4 } from 'lib/helpers'

const SUPPORT_API_URL = process.env.NEXT_PUBLIC_SUPPORT_API_URL || ''
const SUPPORT_API_KEY = process.env.NEXT_PUBLIC_SUPPORT_ANON_KEY || ''

export const uploadAttachments = async (ref: string, files: File[]) => {
  const supportSupabaseClient = createClient(SUPPORT_API_URL, SUPPORT_API_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      // @ts-ignore
      multiTab: false,
      detectSessionInUrl: false,
      localStorage: {
        getItem: (key: string) => undefined,
        setItem: (key: string, value: string) => {},
        removeItem: (key: string) => {},
      },
    },
  })

  const filesToUpload = Array.from(files)
  const uploadedFiles = await Promise.all(
    filesToUpload.map(async (file) => {
      const suffix = file.type.split('/')[1]
      const prefix = `${ref}/${uuidv4()}.${suffix}`
      const options = { cacheControl: '3600' }

      const { data, error } = await supportSupabaseClient.storage
        .from('support-attachments')
        .upload(prefix, file, options)

      if (error) console.error('Failed to upload:', file.name, error)
      return data
    })
  )
  const keys = compact(uploadedFiles).map((file) => file.path)

  if (keys.length === 0) return []

  const { data, error } = await supportSupabaseClient.storage
    .from('support-attachments')
    .createSignedUrls(keys, 10 * 365 * 24 * 60 * 60)
  if (error) {
    console.error('Failed to retrieve URLs for attachments', error)
  }
  return data ? data.map((file) => file.signedUrl) : []
}

export const formatMessage = (message: string, attachments: string[]) => {
  if (attachments.length > 0) {
    const attachmentsImg = attachments.map((url) => `\n${url}`)
    return `${message}\n${attachmentsImg.join('')}`
  } else {
    return message
  }
}

export function getPageIcon(page: Page) {
  switch (page.type) {
    case PageType.Markdown:
    case PageType.Reference:
    case PageType.Integration:
      return <Book strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    case PageType.GithubDiscussion:
      return <Github strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}

export function getPageSectionIcon(page: Page) {
  switch (page.type) {
    case PageType.Markdown:
    case PageType.Reference:
    case PageType.Integration:
      return <Hash strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    case PageType.GithubDiscussion:
      return <MessageSquare strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}

export function generateLink(pageType: PageType, link: string): string {
  switch (pageType) {
    case PageType.Markdown:
    case PageType.Reference:
      return `https://supabase.com/docs${link}`
    case PageType.Integration:
      return `https://supabase.com${link}`
    case PageType.GithubDiscussion:
      return link
    default:
      throw new Error(`Unknown page type '${pageType}'`)
  }
}

export function formatSectionUrl(page: Page, section: PageSection): string {
  switch (page.type) {
    case PageType.Markdown:
    case PageType.GithubDiscussion:
      return `${generateLink(page.type, page.path)}#${section.slug ?? ''}`
    case PageType.Reference:
      return `${generateLink(page.type, page.path)}/${section.slug ?? ''}`
    case PageType.Integration:
      return generateLink(page.type, page.path) // Assuming no section slug for Integration pages
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}
