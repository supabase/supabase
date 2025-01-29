'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from 'ui'
import { motion } from 'framer-motion'
import DefaultLayout from '../components/Layouts/Default'

import * as supabaseLogoWordmarkDark from 'common/assets/images/supabase-logo-wordmark--dark.png'
import * as supabaseLogoWordmarkLight from 'common/assets/images/supabase-logo-wordmark--light.png'

const Error404 = () => {
  return (
    <DefaultLayout hideHeader hideFooter>
      <div className="relative mx-auto flex h-screen w-full flex-col items-center justify-center">
        <div className="absolute top-0 mx-auto w-full max-w-7xl px-8 pt-6 sm:px-6 lg:px-8">
          <nav className="relative flex items-center justify-between sm:h-10">
            <div className="flex flex-shrink-0 flex-grow items-center lg:flex-grow-0">
              <div className="flex w-full items-center justify-between md:w-auto">
                <a href="/">
                  {/* Light mode logo */}
                  <Image
                    src={supabaseLogoWordmarkLight}
                    width={124}
                    height={24}
                    alt="Supabase Logo"
                    className="dark:hidden"
                    priority
                  />
                  {/* Dark mode logo */}
                  <Image
                    src={supabaseLogoWordmarkDark}
                    width={124}
                    height={24}
                    alt="Supabase Logo"
                    className="hidden dark:block"
                    priority
                  />
                </a>
              </div>
            </div>
          </nav>
        </div>
        {/* Using framer-motion for smooth blur effect */}
        <motion.h1
          className="absolute text-foreground select-none text-[12rem] sm:text-[18rem] lg:text-[24rem]"
          initial={{ opacity: 0 }}
          animate={{ filter: 'blur(4px)', opacity: 0.04 }}
          transition={{ duration: 0.8 }}
        >
          404
        </motion.h1>

        {/* Using framer-motion for smooth blur effect */}
        <motion.div
          className="flex flex-col items-center justify-center space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-foreground flex w-[320px] flex-col items-center justify-center space-y-3">
            <h1 className="m-2 text-2xl">🔍 Looking for something?</h1>
            <p className="text-center text-sm">
              We couldn't find the page that you're looking for!
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button asChild size="small" className="text-foreground">
              <Link href="/">Head back</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </DefaultLayout>
  )
}

export default Error404
