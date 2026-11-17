import {
  DASHBOARD_PROJECTS_URL,
  DASHBOARD_SIGN_IN_URL,
  DASHBOARD_SIGN_UP_URL,
} from 'common/constants/dashboard-urls'
import { buttonVariants, cn } from 'ui'

export interface MobileNavAccountActionsProps {
  isLoggedIn: boolean
  onSignInClick?: () => void
  onSignUpClick?: () => void
  className?: string
}

const accountLinkClassName = (variant: 'default' | 'primary') =>
  cn(buttonVariants({ variant, block: true }), 'h-8 text-sm')

export const MobileNavAccountActions = ({
  isLoggedIn,
  onSignInClick,
  onSignUpClick,
  className,
}: MobileNavAccountActionsProps) => (
  <div className={cn('flex items-stretch gap-4', className)}>
    {isLoggedIn ? (
      <a href={DASHBOARD_PROJECTS_URL} className={accountLinkClassName('default')}>
        Dashboard
      </a>
    ) : (
      <>
        <a
          href={DASHBOARD_SIGN_IN_URL}
          onClick={onSignInClick}
          className={accountLinkClassName('default')}
        >
          Sign in
        </a>
        <a
          href={DASHBOARD_SIGN_UP_URL}
          onClick={onSignUpClick}
          className={accountLinkClassName('primary')}
        >
          Start your project
        </a>
      </>
    )}
  </div>
)
