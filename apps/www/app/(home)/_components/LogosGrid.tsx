import { ComponentProps } from 'react'

import {
  BetasharesLogo,
  BoltLogo,
  FigmaLogo,
  GithubLogo,
  LangchainLogo,
  LovableLogo,
  MobbinLogo,
  MozillaLogo,
  OnePasswordLogo,
  PwcLogo,
  ResendLogo,
  V0Logo,
} from './logos/PublicityLogos'
import SectionContainer from '@/components/Layouts/SectionContainer'

const gridLogos: { name: string; Logo: (props: ComponentProps<'svg'>) => React.JSX.Element }[] = [
  { name: 'lovable', Logo: LovableLogo },
  { name: 'mozilla', Logo: MozillaLogo },
  { name: 'pwc', Logo: PwcLogo },
  { name: 'figma', Logo: FigmaLogo },
  { name: 'v0', Logo: V0Logo },
  { name: 'bolt', Logo: BoltLogo },
  { name: 'github', Logo: GithubLogo },
  { name: 'betashares', Logo: BetasharesLogo },
  { name: 'mobbin', Logo: MobbinLogo },
  { name: 'resend', Logo: ResendLogo },
  { name: 'langchain', Logo: LangchainLogo },
  { name: '1password', Logo: OnePasswordLogo },
]

export function LogosGrid() {
  return (
    <div>
      <SectionContainer className="py-6!">
        <p className="text-sm text-foreground-lighter">
          Trusted by fast-growing companies worldwide
        </p>
      </SectionContainer>

      <div className="border-y border-border">
        <SectionContainer className="border-x border-border py-10!">
          <ul
            aria-label="Trusted by fast-growing companies worldwide"
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-y-10 gap-x-6 list-none"
          >
            {gridLogos.map(({ name, Logo }) => (
              <li
                key={name}
                className="flex items-center justify-center h-10 text-foreground-lighter opacity-70"
              >
                <Logo
                  role="img"
                  aria-label={
                    name === '1password'
                      ? '1Password'
                      : name.charAt(0).toUpperCase() + name.slice(1)
                  }
                  className="h-8 lg:h-12 w-auto"
                />
              </li>
            ))}
          </ul>
        </SectionContainer>
      </div>
    </div>
  )
}
