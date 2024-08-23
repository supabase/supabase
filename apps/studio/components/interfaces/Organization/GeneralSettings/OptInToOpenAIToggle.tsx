import Link from 'next/link'
import { cn, Collapsible_Shadcn_, CollapsibleTrigger_Shadcn_, CollapsibleContent_Shadcn_ } from 'ui'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

interface OptInToOpenAIToggleProps {
  className?: string
}
export default function OptInToOpenAIToggle({ className }: OptInToOpenAIToggleProps) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible_Shadcn_ open={open} onOpenChange={setOpen} className={cn('mt-4', className)}>
      <CollapsibleTrigger_Shadcn_ asChild>
        <div className="flex items-center space-x-2 cursor-pointer">
          <ChevronRight
            strokeWidth={2}
            size={16}
            className={cn('transition-all', open ? 'rotate-90' : '')}
          />
          <p className="text-sm text-foreground-light underline">
            Important information regarding opting in
          </p>
        </div>
      </CollapsibleTrigger_Shadcn_>
      <CollapsibleContent_Shadcn_>
        <div className="space-y-2 py-4 text-sm text-foreground-light">
          <p>
            Supabase AI is a chatbot support tool powered by OpenAI. Supabase will share the query
            you submit and information about the databases you manage through Supabase with OpenAI,
            L.L.C. and its affiliates in order to provide the Supabase AI tool.
          </p>
          <p>
            OpenAI will only access information about the structure of your databases, such as table
            names, column and row headings. OpenAI will not access the contents of the database
            itself.
          </p>
          <p>
            OpenAI uses this information to generate responses to your query, and does not retain or
            use the information to train its algorithms or otherwise improve its products and
            services.
          </p>
          <p>
            If you have your own individual account on Supabase, we will use any personal
            information collected through [Supabase AI] to provide you with the [Supabase AI] tool.
            If you are in the UK, EEA or Switzerland, the processing of this personal information is
            necessary for the performance of a contract between you and us.
          </p>
          <p>
            Supabase collects information about the queries you submit through Supabase AI and the
            responses you receive to assess the performance of the Supabase AI tool and improve our
            services. If you are in the UK, EEA or Switzerland, the processing is necessary for our
            legitimate interests, namely informing our product development and improvement.
          </p>
          <p>
            For more information about how we use personal information, please see our{' '}
            <Link
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-brand border-b border-brand"
            >
              privacy policy
            </Link>
            .
          </p>
        </div>
      </CollapsibleContent_Shadcn_>
    </Collapsible_Shadcn_>
  )
}
