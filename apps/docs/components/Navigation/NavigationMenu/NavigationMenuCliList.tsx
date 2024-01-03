import Link from 'next/link'
import { useRouter } from 'next/router'
import { IconChevronLeft } from 'ui'
import * as NavItems from './NavigationMenu.constants'

import clientLibsCommon from '~/spec/common-cli.yml' assert { type: 'yml' }

const NavigationMenuCliList = ({ currentLevel, setLevel, id }) => {
  const router = useRouter()

  const menu = NavItems[id]

  const FunctionLink = ({
    title,
    id,
    icon,
  }: {
    title: string
    name: string
    id: string
    icon?: string
  }) => {
    return (
      <li key={id} className="function-link-item text-foreground-lighter leading-3">
        <Link
          href={`#${id}`}
          className="cursor-pointer transition text-foreground-lighter text-sm hover:text-brand flex gap-3"
        >
          {icon && <img className="w-3" src={`${router.basePath}${icon}`} />}
          {title}
        </Link>
      </li>
    )
  }

  const SideMenuTitle = ({ title }: { title: string }) => {
    return (
      <span
        className="
    font-mono text-xs uppercase
    text-foreground font-medium
    tracking-wider
    mb-3
    "
      >
        {title}
      </span>
    )
  }

  const Divider = () => {
    return <div className="h-px w-full bg-border my-3"></div>
  }

  const MenuSections = [
    {
      key: 'general',
      label: 'General',
    },
    {
      key: 'secrets',
      label: 'Secrets',
    },
    {
      key: 'projects',
      label: 'Projects',
    },
    {
      key: 'organizations',
      label: 'Organizations',
    },
    {
      key: 'migration',
      label: 'Migration',
    },
    {
      key: 'database',
      label: 'Database',
    },
    {
      key: 'completion',
      label: 'Completion',
    },
  ]

  return (
    <div
      className={[
        'transition-all duration-150 ease-out',
        // enabled
        currentLevel === id && 'opacity-100 ml-0 delay-150 h-auto',
        // move menu back to margin-left
        currentLevel === 'home' && 'ml-12',
        // disabled
        currentLevel !== 'home' && currentLevel !== id ? '-ml-8' : '',
        currentLevel !== id ? 'opacity-0 invisible absolute h-0 overflow-hidden' : '',
      ].join(' ')}
    >
      <div className={'w-full flex flex-col gap-0 sticky top-8'}>
        <Link
          href={`${menu.parent ?? '/'}`}
          className={[
            'flex items-center gap-1 text-xs group mb-3',
            'text-base transition-all duration-200 text-brand hover:text-brand-600 hover:cursor-pointer ',
          ].join(' ')}
        >
          <div className="relative w-2">
            <div className="transition-all ease-out ml-0 group-hover:-ml-1">
              <IconChevronLeft size={10} strokeWidth={3} />
            </div>
          </div>
          <span>Back to menu</span>
        </Link>
        <div className="flex items-center gap-3 my-3">
          <img
            src={`${router.basePath}` + menu.icon ?? `/img/icons/menu/${id}.svg`}
            className="w-5 rounded"
          />

          <h2 className={['text-foreground ', !menu.title && 'capitalize'].join(' ')}>
            {menu.title ?? currentLevel}
          </h2>
        </div>
        <ul className="function-link-list">
          {MenuSections.map((section) => {
            return (
              <>
                <Divider />
                <SideMenuTitle title={section.label} />

                {clientLibsCommon.commands
                  .filter((x) => x.product === section.key)
                  .map((x, index) => {
                    return <FunctionLink {...x} />
                  })}
              </>
            )
          })}

          <Divider />
        </ul>
      </div>
    </div>
  )
}

export default NavigationMenuCliList
