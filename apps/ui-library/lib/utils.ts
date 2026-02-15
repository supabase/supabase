import { cn as uiCN } from 'ui'
import {Doc} from "contentlayer/generated";

export const cn = uiCN

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`
}

export function docToMarkdown(doc: Doc) {
  return `> ## Documentation Index
> Fetch the complete documentation index at: https://supabase.com/ui/llms.txt
> Use this file to discover all available pages before exploring further.

# ${doc.description}
${doc.body.raw}`
}
