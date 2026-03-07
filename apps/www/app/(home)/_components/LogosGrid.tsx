'use client'

import { ComponentProps } from 'react'
import {
  BetasharesLogo,
  BoltLogo,
  ChatbaseLogo,
  FigmaLogo,
  GithubLogo,
  GoodtapeLogo,
  GopuffLogo,
  GumloopLogo,
  HappyteamsLogo,
  HumataLogo,
  LangchainLogo,
  LoopsLogo,
  LovableLogo,
  MarkpromptLogo,
  MdnLogo,
  MobbinLogo,
  MozillaLogo,
  PikaLogo,
  PwcLogo,
  ResendLogo,
  SoshiLogo,
  SubmagicLogo,
  TempoLogo,
  V0Logo,
} from './logos/PublicityLogos'

const gridLogos: { name: string; Logo: (props: ComponentProps<'svg'>) => React.JSX.Element }[] = [
  { name: 'betashares', Logo: BetasharesLogo },
  { name: 'bolt', Logo: BoltLogo },
  { name: 'chatbase', Logo: ChatbaseLogo },
  { name: 'figma', Logo: FigmaLogo },
  { name: 'github', Logo: GithubLogo },
  { name: 'goodtape', Logo: GoodtapeLogo },
  { name: 'gopuff', Logo: GopuffLogo },
  { name: 'gumloop', Logo: GumloopLogo },
  { name: 'happyteams', Logo: HappyteamsLogo },
  { name: 'humata', Logo: HumataLogo },
  { name: 'langchain', Logo: LangchainLogo },
  { name: 'loops', Logo: LoopsLogo },
  { name: 'lovable', Logo: LovableLogo },
  { name: 'markprompt', Logo: MarkpromptLogo },
  { name: 'mdn', Logo: MdnLogo },
  { name: 'mobbin', Logo: MobbinLogo },
  { name: 'mozilla', Logo: MozillaLogo },
  { name: 'pika', Logo: PikaLogo },
  { name: 'pwc', Logo: PwcLogo },
  { name: 'resend', Logo: ResendLogo },
  { name: 'soshi', Logo: SoshiLogo },
  { name: 'submagic', Logo: SubmagicLogo },
  { name: 'tempo', Logo: TempoLogo },
  { name: 'v0', Logo: V0Logo },
]

export function LogosGrid() {
  return (
    <div>
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 py-6">
        <p className="text-sm text-foreground-lighter">
          Trusted by fast-growing companies worldwide
        </p>
      </div>

      <div className="border-y border-border">
        <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 border-x border-border py-10">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-y-10 gap-x-6 opacity-70">
            {gridLogos.map(({ name, Logo }) => (
              <div key={name} className="flex items-center justify-center h-10 text-foreground-lighter">
                <Logo className="h-8 lg:h-12 w-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
