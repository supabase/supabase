import Link from 'next/link'
import { useRouter } from 'next/router'
import { useIntl } from 'react-intl'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui/src/components/shadcn/ui/dropdown-menu'
import { useHasTranslations, buildLocaleUrl } from '~/lib/intl'

const languageNames: { [key: string]: string } = {
  en: 'English',
  ja: '日本語',
}

export const LanguageSelector = () => {
  const currentPageHasTranslations = useHasTranslations()
  const { locale } = useIntl()
  const router = useRouter()

  if (!currentPageHasTranslations) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{languageNames[locale]}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        className="w-[160px] p-2 mt-2"
        sideOffset={8}
      >
        {Object.entries(languageNames).map(([newLocale, name]) => (
          <DropdownMenuItem className="group text-sm" key={newLocale}>
            <Link href={buildLocaleUrl(locale, newLocale, router.asPath)}>{name}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
