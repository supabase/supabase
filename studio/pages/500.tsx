import { NextPage } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@supabase/ui'
import { observer } from 'mobx-react-lite'

import { useStore } from 'hooks'

const Error500: NextPage = ({}) => {
  const { ui } = useStore()
  const { theme } = ui

  return (
    <div className="w-full h-full relative flex flex-col space-y-6 items-center justify-center mx-auto">
      <div className="absolute top-0 w-full max-w-7xl mx-auto pt-6 px-8 sm:px-6 lg:px-8">
        <nav className="relative flex items-center justify-between sm:h-10">
          <div className="flex items-center flex-grow flex-shrink-0 lg:flex-grow-0">
            <div className="flex items-center justify-between w-full md:w-auto">
              <a href="/">
                <Image
                  src={theme == 'dark' ? '/img/supabase-dark.svg' : '/img/supabase-light.svg'}
                  alt=""
                  height={24}
                  width={120}
                />
              </a>
            </div>
          </div>
        </nav>
      </div>
      <div className="w-[320px] flex flex-col items-center justify-center space-y-3">
        <h4 className="text-lg">Something went wrong 🤕</h4>
        <p className="text-center">
          Sorry about that, please try again later or feel free to reach out to us if the problem
          persists.
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/">
          <a>
            <Button>Head back</Button>
          </a>
        </Link>
        <Link href="/support/new">
          <a>
            <Button type="secondary">Submit a support request</Button>
          </a>
        </Link>
      </div>
    </div>
  )
}

export default observer(Error500)
