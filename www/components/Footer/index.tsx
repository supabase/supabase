import { useState, useEffect } from 'react'
import FooterLinks from 'data/Footer.json'
import { useRouter } from 'next/router'

type Props = {
  darkMode: boolean
  updateTheme: Function
}

const Footer = (props: Props) => {
  const { basePath } = useRouter()
  const { darkMode, updateTheme } = props

  const toggleDarkMode = () => {
    localStorage.setItem('supabaseDarkMode', (!darkMode).toString())
    updateTheme(!darkMode)
  }

  const SunEmoji = () => (
    <svg width="32" height="32" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 2a1.4 1.4 0 011.4 1.4v1.4a1.4 1.4 0 11-2.8 0V3.4A1.4 1.4 0 0116 2zM6.1 6.1a1.4 1.4 0 011.98 0l.99.99a1.4 1.4 0 11-1.98 1.98l-.99-.99a1.4 1.4 0 010-1.98zm19.8 0a1.4 1.4 0 010 1.98l-.99.99a1.4 1.4 0 01-1.98-1.98l.99-.99a1.4 1.4 0 011.98 0zM9 16a7 7 0 1114 0 7 7 0 01-14 0zm-7 0a1.4 1.4 0 011.4-1.4h1.4a1.4 1.4 0 110 2.8H3.4A1.4 1.4 0 012 16zm23.8 0a1.4 1.4 0 011.4-1.4h1.4a1.4 1.4 0 110 2.8h-1.4a1.4 1.4 0 01-1.4-1.4zm-2.87 6.93a1.4 1.4 0 011.98 0l.99.99a1.4 1.4 0 01-1.98 1.98l-.99-.99a1.4 1.4 0 010-1.98zm-15.84 0a1.4 1.4 0 011.98 1.98l-.99.99a1.4 1.4 0 01-1.98-1.98l.99-.99zM16 25.8a1.4 1.4 0 011.4 1.4v1.4a1.4 1.4 0 11-2.8 0v-1.4a1.4 1.4 0 011.4-1.4z"
        fill="url(#paint0_linear)"
      />
      <defs>
        <linearGradient
          id="paint0_linear"
          x1="2"
          y1="2"
          x2="30"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop className="transition-all duration-200" stopColor="#bbbbbb" />
          <stop className="transition-all duration-200" offset="1" stopColor="#bbbbbb" />
        </linearGradient>
      </defs>
    </svg>
  )

  const MoonEmoji = () => (
    <svg
      width="24"
      height="24"
      fill="currentColor"
      className="transition-colors duration-200 text-gray-300"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.353 2.939a1 1 0 01.22 1.08 8 8 0 0010.408 10.408 1 1 0 011.301 1.3A10.003 10.003 0 0112 22C6.477 22 2 17.523 2 12c0-4.207 2.598-7.805 6.273-9.282a1 1 0 011.08.22z"
      />
    </svg>
  )

  return (
    <footer className="bg-white dark:bg-dark-700" aria-labelledby="footerHeading">
      <h2 id="footerHeading" className="sr-only">
        Footer
      </h2>
      <div className="container mx-auto px-8 sm:px-16 xl:px-20 py-12 lg:pt-16 lg:pb-32">
      <div className="mx-auto max-w-7xl">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <img
              className="h-10 w-auto"
              src={darkMode ? `${basePath}/images/logo-dark.png` : `${basePath}images/logo-light.png`}
              alt="Supabase"
            />
            <div className="flex space-x-6">
              <a
                href="https://twitter.com/supabase_io"
                className="text-gray-300 hover:text-gray-400"
              >
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>

              <a href="https://github.com/supabase" className="text-gray-300 hover:text-gray-400">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 xl:mt-0 xl:col-span-2">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {FooterLinks.map((segment: any) => {
                return (
                  <div key={`footer_${segment.title}`}>
                    <h3 className="text-sm font-semibold text-gray-400 dark:text-dark-400 tracking-wider uppercase">
                      {segment.title}
                    </h3>
                    <ul className="mt-4 space-y-4">
                      {segment.links.map((link: any, idx: number) => (
                        <li key={`${segment.title}_link_${idx}`}>
                          <a
                            href={link.url}
                            className={`text-base ${
                              link.url
                                ? 'text-gray-500 dark:text-dark-100'
                                : 'text-gray-400 dark:text-dark-200'
                            } hover:text-gray-900 dark:hover:text-gray-300`}
                          >
                            {link.text}
                            {!link.url && (
                              <span className="block text-sm text-gray-300 dark:text-dark-300">
                                Coming soon
                              </span>
                            )}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 dark:border-dark-600 pt-8 flex justify-between">
          <p className="text-base text-gray-400 dark:text-dark-400">&copy; Supabase Inc</p>
          <div className="flex items-center">
            <SunEmoji />
            <button
              type="button"
              aria-pressed="false"
              className={`
                relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer 
                transition-colors ease-in-out duration-200 focus:outline-none ${
                  darkMode ? 'bg-dark-500' : 'bg-gray-200'
                } mx-5
              `}
              onClick={() => toggleDarkMode()}
            >
              <span className="sr-only">Toggle Themes</span>
              <span
                aria-hidden="true"
                className={`
                  ${darkMode ? 'translate-x-5' : 'translate-x-0'} inline-block h-5 w-5 rounded-full
                  bg-white dark:bg-dark-700 shadow-lg transform ring-0 transition ease-in-out duration-200
                `}
              />
            </button>
            <MoonEmoji />
          </div>
        </div>
      </div>
      </div>
    </footer>
  )
}

export default Footer
