import Link from 'next/link'
import { IconChevronRight } from 'ui'
import { useTheme } from 'next-themes'
import { BASE_PATH } from 'lib/constants'

interface ExampleProjectProps {
  framework: string
  title: string
  description: string
  url: string
}

const ExampleProject = ({ framework, title, description, url }: ExampleProjectProps) => {
  const { theme } = useTheme()

  return (
    <Link href={url}>
      <a target="_blank" rel="noreferrer">
        <div
          className={[
            'group relative',
            'border bg-panel-header-light  hover:bg-panel-border-light dark:bg-panel-header-dark dark:hover:bg-panel-border-dark',
            'border-panel-border-light hover:border-panel-border-hover-light  dark:border-panel-border-dark',
            'flex h-32 flex-row rounded-md p-4 hover:border-gray-300 dark:hover:border-panel-border-hover-dark',
            'transition duration-150 ease-in-out',
          ].join(' ')}
        >
          <div className="mr-4 flex flex-col">
            <img
              className="transition-all group-hover:scale-110"
              src={`${BASE_PATH}/img/libraries/${framework.toLowerCase()}${
                ['expo', 'nextjs'].includes(framework.toLowerCase())
                  ? theme === 'dark'
                    ? '-dark'
                    : ''
                  : ''
              }-icon.svg`}
              alt={`${framework} logo`}
              width={26}
              height={26}
            />
          </div>
          <div className="w-4/5 space-y-2">
            <h5 className="text-foreground">{title}</h5>
            <p className="text-sm text-foreground-light">{description}</p>
          </div>
          <div
            className="
            absolute
            right-4
            top-3
            text-scale-900
            transition-all
            duration-200
            group-hover:right-3
            group-hover:text-foreground
          "
          >
            <IconChevronRight />
          </div>
        </div>
      </a>
    </Link>
  )
}

export default ExampleProject
