import { useTheme } from 'common/Providers'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import { IconChevronLeft } from '~/../../packages/ui'
import * as NavItems from './NavigationMenu.constants'
import * as Accordion from '@radix-ui/react-accordion'

const HeaderImage = React.memo(function HeaderImage(props: any) {
  const router = useRouter()
  const { isDarkMode } = useTheme()

  return (
    <Image
      alt={props.icon}
      width={15}
      height={15}
      src={`${router.basePath}` + `/img/icons/menu/${props.icon}${isDarkMode ? '' : '-light'}.svg`}
    />
  )
})

const HeaderLink = React.memo(function HeaderLink(props: any) {
  const router = useRouter()

  return (
    <span
      className={[
        ' ',
        !props.title && 'capitalize',
        props.url === router.pathname ? 'text-brand-900' : 'hover:text-brand-900 text-scale-1200',
      ].join(' ')}
    >
      {props.title ?? props.id}
    </span>
  )
})

const ContentAccordionLink = React.memo(function ContentAccordionLink(props: any) {
  const router = useRouter()
  const { isDarkMode } = useTheme()

  const LinkContainer = (props) => {
    return (
      <Link href={props.url} passHref>
        <a className={props.className}>{props.children}</a>
      </Link>
    )
  }

  return (
    <>
      {props.subItemIndex === 0 && (
        <>
          <div className="h-px w-full bg-green-500 my-3"></div>
          <span className="font-mono text-xs uppercase text-scale-1200 font-medium tracking-wider">
            {props.parent.name}
          </span>
        </>
      )}
      <Accordion.Item key={props.subItem.label} value={props.subItem.url}>
        <li key={props.subItem.name}>
          <LinkContainer
            url={props.subItem.url}
            className={[
              'flex items-center gap-2',
              'cursor-pointer transition text-sm',
              props.subItem.url === router.pathname
                ? 'text-brand-900'
                : 'hover:text-brand-900 text-scale-1000',
            ].join(' ')}
            parent={props.subItem.parent}
          >
            {props.subItem.icon && (
              <Image
                alt={props.subItem.name + router.basePath}
                src={
                  `${router.basePath}` + `${props.subItem.icon}${!isDarkMode ? '-light' : ''}.svg`
                }
                width={15}
                height={15}
              />
            )}
            {props.subItem.name}
          </LinkContainer>
        </li>

        {props.subItem.items && props.subItem.items.length > 0 && (
          <Accordion.Content className="transition data-open:animate-slide-down data-closed:animate-slide-up ml-2">
            {props.subItem.items.map((subSubItem) => {
              return (
                <li key={props.subItem.name}>
                  <Link href={`${subSubItem.url}`} passHref>
                    <a
                      className={[
                        'cursor-pointer transition text-sm',
                        subSubItem.url === router.pathname
                          ? 'text-brand-900'
                          : 'hover:text-brand-900 text-scale-1000',
                      ].join(' ')}
                    >
                      {subSubItem.name}
                    </a>
                  </Link>
                </li>
              )
            })}
          </Accordion.Content>
        )}
      </Accordion.Item>
    </>
  )
})

const ContentLink = React.memo(function ContentLink(props: any) {
  const router = useRouter()

  return (
    <li>
      <Link href={`${props.url}`} passHref>
        <a
          className={[
            'cursor-pointer transition text-sm',
            props.url === router.pathname
              ? 'text-brand-900'
              : 'hover:text-brand-900 text-scale-1000',
          ].join(' ')}
        >
          {props.icon && (
            <Image
              alt={props.icon}
              width={12}
              height={12}
              src={`${router.basePath}${props.icon}`}
            />
          )}
          {props.name}
        </a>
      </Link>
    </li>
  )
})

const Content = (props) => {
  const { id } = props

  const menu = NavItems[id]

  return (
    <ul className={['relative w-full flex flex-col gap-0'].join(' ')}>
      <Link href={`${menu.parent ?? '/'}`} passHref>
        <a
          className={[
            'flex items-center gap-1 text-xs group mb-3',
            'text-base transition-all duration-200 text-brand-900 hover:text-brand-1200 hover:cursor-pointer ',
          ].join(' ')}
        >
          <div className="relative w-2">
            <div className="transition-all ease-out ml-0 group-hover:-ml-1">
              <IconChevronLeft size={10} strokeWidth={3} />
            </div>
          </div>
          <span>Back to Home</span>
        </a>
      </Link>

      <Link href={menu.url ?? ''} passHref>
        <a>
          <div className="flex items-center gap-3 my-3">
            <HeaderImage icon={menu.icon} />
            <HeaderLink title={menu.title} url={menu.url} id={id} />
          </div>
        </a>
      </Link>

      {menu.items.map((x) => {
        return (
          <div key={x.name}>
            {x.items && x.items.length > 0 ? (
              <div className="flex flex-col gap-1">
                {x.items.map((subItem, subItemIndex) => {
                  return (
                    <ContentAccordionLink
                      key={subItem.name}
                      subItem={subItem}
                      subItemIndex={subItemIndex}
                      parent={x}
                    />
                  )
                })}
              </div>
            ) : (
              <ContentLink url={x.url} icon={x.icon} name={x.name} key={x.name} />
            )}
          </div>
        )
      })}
    </ul>
  )
}

export default React.memo(Content)
