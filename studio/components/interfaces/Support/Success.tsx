import Link from 'next/link'
import { useState } from 'react'
import { Button, IconCheck, IconExternalLink, IconMail, IconSearch, Input } from 'ui'

import Divider from 'components/ui/Divider'
import { CATEGORY_OPTIONS } from './Support.constants'

interface SuccessProps {
  sentCategory?: string
}

const Success = ({ sentCategory = '' }: SuccessProps) => {
  const categoriesToShowAdditionalResources = ['Problem', 'Unresponsive', 'Performance']

  const selectedCategory = CATEGORY_OPTIONS.find((option) => option.value === sentCategory)
  const [searchValue, setSearchValue] = useState<string>(selectedCategory?.query ?? '')

  return (
    <div className="mt-10 w-[620px] flex flex-col items-center space-y-4">
      <div className="relative">
        <IconMail strokeWidth={1.5} size={60} className="text-brand" />
        <div className="h-6 w-6 rounded-full bg-brand absolute bottom-1 -right-1.5 flex items-center justify-center">
          <IconCheck strokeWidth={4} size={18} />
        </div>
      </div>
      <div className="flex items-center flex-col space-y-2">
        <h3 className="text-xl">Support request successfully sent!</h3>
        <p className="text-sm text-foreground-light">
          We will reach out to you using your account's email address
        </p>
      </div>
      {categoriesToShowAdditionalResources.includes(sentCategory) && (
        <>
          <div className="!my-10 w-full">
            <Divider light />
          </div>
          <div className="flex flex-col items-center px-12 space-y-2">
            <p>In the meantime, tap into our community</p>
            <p className="text-sm text-foreground-light text-center">
              Find the answers you need with fellow developers building with Supabase by joining our
              GitHub discussions or on Discord - build the next best thing together
            </p>
          </div>
          <div className="w-full px-12 !mt-8">
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              icon={<IconSearch size={16} strokeWidth={1.5} />}
              actions={[
                <Button
                  key="search"
                  asChild
                  className="mr-1"
                  type="default"
                  icon={<IconExternalLink size={16} strokeWidth={1.5} />}
                >
                  <Link
                    href={`https://github.com/supabase/supabase/discussions?discussions_q=${searchValue}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Search on Github discussions
                  </Link>
                </Button>,
              ]}
            />
          </div>
        </>
      )}
      <div className="!mt-10 w-full">
        <Divider light />
      </div>
      <div className="w-full pb-4 px-4 flex items-center justify-end">
        <Link href="/">
          <Button>Go back</Button>
        </Link>
      </div>
    </div>
  )
}

export default Success
