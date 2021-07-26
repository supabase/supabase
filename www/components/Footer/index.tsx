import { useRouter } from 'next/router'
import FooterLinks from 'data/Footer.json'
import SectionContainer from '../Layouts/SectionContainer'
import DarkModeToggle from '../DarkModeToggle'

type Props = {
  darkMode: boolean
  updateTheme: Function
}

const Footer = (props: Props) => {
  const { basePath } = useRouter()
  const { darkMode, updateTheme } = props

  return (
    <footer
      className="bg-white dark:bg-dark-800 border-t border-gray-100 dark:border-gray-600"
      aria-labelledby="footerHeading"
    >
      <h2 id="footerHeading" className="sr-only">
        Footer
      </h2>
      <SectionContainer>
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <img
              className="w-40"
              src={
                darkMode ? `${basePath}/images/logo-dark.png` : `${basePath}/images/logo-light.png`
              }
              alt="Supabase"
            />
            <div className="flex space-x-6">
              <a href="https://twitter.com/supabase" className="text-gray-300 hover:text-gray-400">
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
                    <h3 className="text-sm text-gray-300 dark:text-dark-400">{segment.title}</h3>
                    <ul className="mt-4 space-y-2">
                      {segment.links.map((link: any, idx: number) => (
                        <li key={`${segment.title}_link_${idx}`}>
                          <a
                            href={link.url}
                            className={`text-sm ${
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
        <div className="mt-32 border-t border-gray-100 dark:border-dark-600 pt-8 flex justify-between">
          <p className="text-base text-gray-400 dark:text-dark-400">&copy; Supabase Inc</p>
          <DarkModeToggle darkMode={darkMode} updateTheme={updateTheme} />
        </div>
      </SectionContainer>
    </footer>
  )
}

export default Footer
