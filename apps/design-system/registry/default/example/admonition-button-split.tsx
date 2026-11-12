import { ChevronDown } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SplitButtonGroup,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

export default function AdmonitionButtonSplitDemo() {
  return (
    <Admonition
      type="default"
      layout="responsive"
      title="Set up custom SMTP to edit templates"
      description="Emails will be sent using the default templates. Set up custom SMTP to edit their subject and body."
      actions={
        <SplitButtonGroup className="w-full @lg:w-auto">
          <Button type="button" className="flex-1 px-3 @lg:flex-none">
            Set up SMTP
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                aria-label="More email template editing options"
                className="shrink-0 px-1 py-1.25"
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
        </SplitButtonGroup>
      }
    />
  )
}
