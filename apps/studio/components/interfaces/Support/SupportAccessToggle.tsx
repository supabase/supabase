// End of third-party imports

import { SupportCategories } from '@supabase/shared-types/out/constants'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { UseFormReturn } from 'react-hook-form'
import {
  Badge,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  FormField_Shadcn_,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { ExtendedSupportCategories } from './Support.constants'
import type { SupportFormValues } from './SupportForm.schema'

export const DISABLE_SUPPORT_ACCESS_CATEGORIES: ExtendedSupportCategories[] = [
  SupportCategories.ACCOUNT_DELETION,
  SupportCategories.SALES_ENQUIRY,
  SupportCategories.REFUND,
]

interface SupportAccessToggleProps {
  form: UseFormReturn<SupportFormValues>
}

export function SupportAccessToggle({ form }: SupportAccessToggleProps) {
  return (
    <FormField_Shadcn_
      name="allowSupportAccess"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItemLayout
            hideMessage
            name="allowSupportAccess"
            className="px-6"
            layout="flex"
            label={
              <div className="flex items-center gap-x-2">
                <span className="text-foreground">Allow support access to your project</span>
                <Badge className="bg-opacity-100">Recommended</Badge>
              </div>
            }
            description={
              <div className="flex flex-col">
                <span className="text-foreground-light">
                  Human support and AI diagnostic access.
                </span>
                <Collapsible_Shadcn_ className="mt-2">
                  <CollapsibleTrigger_Shadcn_
                    className={
                      'group flex items-center gap-x-1 group-data-[state=open]:text-foreground hover:text-foreground transition'
                    }
                  >
                    <ChevronRight
                      size={14}
                      className="transition-all group-data-[state=open]:rotate-90 text-foreground-muted -ml-1"
                    />
                    <span className="text-sm">More information</span>
                  </CollapsibleTrigger_Shadcn_>
                  <CollapsibleContent_Shadcn_ className="text-sm text-foreground-light mt-2 space-y-2">
                    <p>
                      By enabling this, you grant permission for our support team to access your
                      project temporarily and, if applicable, to use AI tools to assist in
                      diagnosing and resolving issues. This access may involve analyzing database
                      configurations, query performance, and other relevant data to expedite
                      troubleshooting and enhance support accuracy.
                    </p>
                    <p>
                      We are committed to maintaining strict data privacy and security standards in
                      all support activities.{' '}
                      <Link
                        href="https://supabase.com/privacy"
                        target="_blank"
                        rel="noreferrer"
                        className="text-foreground-light underline hover:text-foreground transition"
                      >
                        Privacy Policy
                      </Link>
                    </p>
                  </CollapsibleContent_Shadcn_>
                </Collapsible_Shadcn_>
              </div>
            }
          >
            <Switch
              size="large"
              id="allowSupportAccess"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormItemLayout>
        )
      }}
    />
  )
}
