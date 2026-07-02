import { ChevronDown } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

export default function AdmonitionButtonSplitDemo() {
  return (
    <Admonition
      type="default"
      layout="responsive"
      title="Set up custom SMTP to edit templates"
      description="Emails will be sent using the default templates. Set up custom SMTP to edit their subject and body."
      actions={
        <div className="flex w-full @lg:w-auto">
          <Button
            type="button"
            variant="default"
            className="flex-1 rounded-r-none px-3 @lg:flex-none hover:z-10"
          >
            Set up SMTP
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="default"
                aria-label="More email template editing options"
                className="shrink-0 rounded-l-none px-[4px] py-[5px] -ml-px"
                icon={<ChevronDown />}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem>
                <div className="flex flex-col gap-y-0.5">
                  <p className="block text-foreground">Upgrade to Pro</p>
                  <p className="block text-foreground-lighter text-balance">
                    Customize templates while using Supabase’s email service
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-y-0.5">
                  <p className="block text-foreground">Configure Send Email hook</p>
                  <p className="block text-foreground-lighter text-balance">
                    Send auth emails through your own workflow
                  </p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    />
  )
}
