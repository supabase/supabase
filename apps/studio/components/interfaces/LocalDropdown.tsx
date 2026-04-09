import { FlaskConical, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  singleThemes,
  Theme,
} from 'ui'

import { ButtonTooltip } from '../ui/ButtonTooltip'
import { useFeaturePreviewModal } from './App/FeaturePreview/FeaturePreviewContext'
import { ProfileImage } from '@/components/ui/ProfileImage'
import { useAppStateSnapshot } from '@/state/app-state'

export const LocalDropdown = ({
  triggerClassName,
  contentClassName,
}: {
  triggerClassName?: string
  contentClassName?: string
}) => {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const appStateSnapshot = useAppStateSnapshot()
  const { toggleFeaturePreviewModal } = useFeaturePreviewModal()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn('border flex-shrink-0 px-3', triggerClassName)} asChild>
        <ButtonTooltip
          type="default"
          className="[&>span]:flex px-0 py-0 rounded-full overflow-hidden h-8 w-8"
          tooltip={{ content: { text: 'Settings' } }}
        >
          <ProfileImage className="w-8 h-8 rounded-md" />
        </ButtonTooltip>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className={cn('w-44', contentClassName)}>
        <DropdownMenuItem className="flex gap-2 cursor-pointer" asChild>
          <Link
            href="/account/me"
            onClick={() => {
              if (router.pathname !== '/account/me') {
                appStateSnapshot.setLastRouteBeforeVisitingAccountPage(router.asPath)
              }
            }}
          >
            <Settings size={14} strokeWidth={1.5} className="text-foreground-lighter" />
            Preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex gap-2 cursor-pointer"
          onClick={() => toggleFeaturePreviewModal(true)}
          onSelect={() => toggleFeaturePreviewModal(true)}
        >
          <FlaskConical size={14} strokeWidth={1.5} className="text-foreground-lighter" />
          Feature previews
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(value) => {
              setTheme(value)
            }}
          >
            {singleThemes.map((theme: Theme) => (
              <DropdownMenuRadioItem
                key={theme.value}
                value={theme.value}
                className="cursor-pointer"
              >
                {theme.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
