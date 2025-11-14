import Link from 'next/link'
import { Button, cn, HoverCard, HoverCardContent, HoverCardTrigger } from 'ui'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { BASE_PATH } from 'lib/constants'
import { InfoIcon } from 'lucide-react'

interface DocsPopoverProps {
  href: string
  label: string
  className?: string
}

export const DocsPopover = ({ href, label, className }: DocsPopoverProps) => {
  const { resolvedTheme } = useTheme()

  const buttonClassName = cn(
    'text-sm text-foreground-light',
    'relative px-1 py-0 -my-px',
    'rounded bg-surface-200 border border-dashed',
    'transition-colors hover:border-strong group/inline-popup'
  )

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span role="button" tabIndex={0} className={cn(buttonClassName)}>
          {label}
          <InfoIcon
            aria-hidden={true}
            className="absolute p-[1px] bg-background rounded-full -left-1.5 -top-1.5 w-3 h-3 text-foreground-lighter group-hover/inline-popup:text-foreground-light transition-colors"
          />
        </span>
      </HoverCardTrigger>

      <HoverCardContent
        side="top"
        align="center"
        className={cn('w-[500px]', className)}
        animate="slide-in"
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-1.5">
              <svg
                viewBox="0 0 16 16"
                width={20}
                height={20}
                strokeWidth={1.5}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.7156 1.77258C7.58712 1.14341 8.76326 1.14175 9.63655 1.76846L12.0629 3.50974C12.7162 3.97855 12.8569 4.83994 12.4888 5.4786L13.0896 5.9098C13.7748 6.4015 13.8962 7.32509 13.4579 7.97059L14.1753 8.4882C15.0124 9.09219 15.0035 10.3415 14.1578 10.9335L9.42209 14.2484C8.5592 14.8524 7.41031 14.8508 6.54911 14.2444L1.83872 10.9276C0.999787 10.3368 0.988308 9.09703 1.81616 8.49086L2.80076 7.76992C2.50724 7.14639 2.66597 6.35556 3.27999 5.91229L3.88264 5.47721C3.51614 4.83981 3.65602 3.98138 4.30587 3.51223L6.7156 1.77258ZM5.00242 5.21218C4.95761 5.16341 4.90473 5.12529 4.84735 5.09839C4.61595 4.88922 4.62987 4.51169 4.8912 4.32303L7.30093 2.58337C7.82385 2.20587 8.52953 2.20487 9.0535 2.5809L11.4799 4.32218C11.7403 4.50906 11.7564 4.88309 11.5302 5.09348C11.4651 5.12213 11.4054 5.16499 11.3562 5.22122L9.03905 6.84318C8.52132 7.20559 7.83199 7.20462 7.31527 6.84078L5.00242 5.21218ZM4.62864 6.17202L3.86532 6.72308C3.58687 6.92411 3.58931 7.33956 3.87012 7.53729L7.31263 9.96135C7.82935 10.3252 8.51869 10.3262 9.03642 9.96376L12.5018 7.53808C12.7841 7.34045 12.7866 6.92317 12.5066 6.72224L11.7408 6.17267L9.6125 7.66242C8.74962 8.26643 7.60073 8.26482 6.73953 7.65841L4.62864 6.17202ZM3.49834 8.49855L2.40694 9.29769C2.13099 9.49975 2.13482 9.91301 2.41446 10.1099L7.12485 13.4268C7.64157 13.7906 8.3309 13.7916 8.84864 13.4292L13.5844 10.1143C13.8663 9.91694 13.8692 9.50049 13.5902 9.29916L12.674 8.63814L9.60987 10.783C8.74698 11.387 7.59809 11.3854 6.7369 10.779L3.49834 8.49855Z"
                  fill="currentColor"
                />
              </svg>
              <span>Platform</span>
            </div>
            <div className="flex items-center gap-1">
              <Image
                src={
                  resolvedTheme?.includes('dark')
                    ? `${BASE_PATH}/img/supabase-dark.svg`
                    : `${BASE_PATH}/img/supabase-light.svg`
                }
                alt="Supabase"
                height={18}
                width={96}
              />
              <span className="font-mono text-sm font-medium text-brand-link mb-px">DOCS</span>
            </div>
          </div>
          <div className="py-3 relative">
            <h1 className="text-xl mt-2 mb-4">Manage Monthly Active Third-Party Users usage</h1>
            <h3 className="font-medium mb-1">What you are charged for</h3>
            <p className="text-sm text-foreground-light leading-relaxed">
              You are charged for the number of distinct users who log in or refresh their token
              during the billing cycle using a third-party authentication provider (Clerk, Firebase
              Auth, Auth0, AWS Cognito). Each unique user is counted only once per billing cycle,
              regardless of how many times they authenticate. These users are referred to as
              "Third-Party MAUs".
            </p>
          </div>
          <div className="border-t border-border pt-3 mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-foreground-lighter">Need some help?</span>
              <Link href="#" className="text-brand-link hover:text-brand-link-hover">
                Contact support
              </Link>
            </div>
            <Button type="primary" size="tiny" asChild>
              <Link href={href} target="_blank">
                Continue reading
              </Link>
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
