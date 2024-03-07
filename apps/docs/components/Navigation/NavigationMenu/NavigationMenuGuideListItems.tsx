import * as Accordion from '@radix-ui/react-accordion'
import { useTheme } from 'next-themes'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useRef } from 'react'

const ContentAccordionLink = React.memo(function ContentAccordionLink(props: any) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const activeItem = props.subItem.url === router.asPath
  const activeItemRef = useRef(null)

  const LinkContainer = (props) => {
    return (
      <Link href={props.url} className={props.className}>
        {props.children}
      </Link>
    )
  }

  useEffect(() => {
    // scroll to active item
    if (activeItem && activeItemRef.current) {
      // this is a hack, but seems a common one on Stackoverflow
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 0)
    }
  })
  return (
    <>
      {props.subItemIndex === 0 && (
        <>
          <div className="h-px w-full bg-border my-3"></div>
          <span className="font-mono text-xs uppercase text-foreground font-medium tracking-wider">
            {props.parent.name}
          </span>
        </>
      )}
      <Accordion.Item key={props.subItem.label} value={props.subItem.url}>
        <li key={props.subItem.name} ref={activeItem ? activeItemRef : null}>
          <LinkContainer
            url={props.subItem.url}
            className={[
              'flex items-center gap-2',
              'cursor-pointer transition text-sm',
              activeItem
                ? 'text-brand font-medium'
                : 'hover:text-foreground text-foreground-lighter',
            ].join(' ')}
            parent={props.subItem.parent}
          >
            {props.subItem.icon && (
              <Image
                alt={props.subItem.name + router.basePath}
                src={
                  `${router.basePath}` +
                  `${props.subItem.icon}${!resolvedTheme?.includes('dark') ? '-light' : ''}.svg`
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
                  <Link
                    href={`${subSubItem.url}`}
                    className={[
                      'cursor-pointer transition text-sm',
                      subSubItem.url === router.asPath
                        ? 'text-brand'
                        : 'hover:text-brand text-foreground-lighter',
                    ].join(' ')}
                  >
                    {subSubItem.name}
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
    <li className="mb-1.5">
      <Link
        href={props.url}
        className={[
          'cursor-pointer transition text-sm',
          props.url === router.asPath
            ? 'text-brand-link'
            : 'hover:text-foreground text-foreground-lighter',
        ].join(' ')}
      >
        {props.icon && (
          <Image alt={props.icon} width={12} height={12} src={`${router.basePath}${props.icon}`} />
        )}
        {props.name}
      </Link>
    </li>
  )
})

const Content = (props) => {
  const { menu, id } = props

  return (
    <ul className={['relative w-full flex flex-col gap-0 pb-5'].join(' ')}>
      {menu.items.map((x) => {
        return (
          <div key={x.name}>
            {x.items && x.items.length > 0 ? (
              <div className="flex flex-col gap-2.5">
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
