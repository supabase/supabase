import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { UseFormReturn } from 'react-hook-form'
// End of third-party imports

import { SupportCategories } from '@supabase/shared-types/out/constants'
import { FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DocsSuggestions } from './DocsSuggestions'
import type { ExtendedSupportCategories } from './Support.constants'
import type { SupportFormValues } from './SupportForm.schema'

const INCLUDE_DISCUSSIONS: ExtendedSupportCategories[] = [
  SupportCategories.DATABASE_UNRESPONSIVE,
  SupportCategories.PROBLEM,
]

interface SubjectAndSuggestionsInfoProps {
  form: UseFormReturn<SupportFormValues>
  category: ExtendedSupportCategories
  subject: string
}

export function SubjectAndSuggestionsInfo({
  form,
  category,
  subject,
}: SubjectAndSuggestionsInfoProps) {
  return (
    <div className={'flex flex-col gap-y-2'}>
      <FormField_Shadcn_
        name="subject"
        control={form.control}
        render={({ field }) => (
          <FormItemLayout layout="vertical" label="Subject">
            <FormControl_Shadcn_>
              <Input_Shadcn_ {...field} placeholder="Summary of the problem you have" />
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />
      <DocsSuggestions searchString={subject} />
      {subject && INCLUDE_DISCUSSIONS.includes(category) && (
        <GitHubDiscussionSuggestion subject={subject} />
      )}
    </div>
  )
}

interface GitHubDiscussionSuggestionProps {
  subject: string
}

function GitHubDiscussionSuggestion({ subject }: GitHubDiscussionSuggestionProps) {
  return (
    <p className="flex items-center gap-x-1 text-foreground-lighter text-sm">
      Check our
      <Link
        key="gh-discussions"
        href={`https://github.com/orgs/supabase/discussions?discussions_q=${subject}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-x-1 underline hover:text-foreground transition"
      >
        GitHub discussions
        <ExternalLink size={14} strokeWidth={2} />
      </Link>
      for a quick answer
    </p>
  )
}
