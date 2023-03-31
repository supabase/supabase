import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Badge, Dropdown, GlassPanel, IconChevronDown, IconChevronRight, Popover } from 'ui'

import { references } from './NavigationMenu/NavigationMenu.constants'

const RefSwitcher = () => {
  const router = useRouter()
  const [currentRef, setCurrentRef] = useState()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [router.pathname])

  return (
    <div className="px-10 flex items-center -space-x-px">
      <Popover
        size="content"
        open={open}
        onOpenChange={() => setOpen(!open)}
        overlay={
          <>
            {references.map((section) => {
              return (
                <>
                  <div className="w-full px-5 py-1 border-b border-scale-400 bg-whiteA-200">
                    <span className="text-xs font-mono uppercase tracking-wider font-medium text-scale-1000">
                      {section.label}
                    </span>
                  </div>
                  <div className="px-5 py-8 grid grid-cols-12 gap-8">
                    {section.items.map((item) => {
                      return (
                        <Link href={item.url}>
                          <a
                            className="flex gap-3 col-span-4 group relative cursor-pointer items-start min-w-[180px]"
                            onClick={() => setOpen(!open)}
                          >
                            <div className="flex justify-between gap-3">
                              <img
                                src={item.icon}
                                className="
                    mt-1 w-5 h-5 rounded
                    transition-all
                    ease-out
                    opacity-80 group-hover:opacity-100
                    scale-95 group-hover:scale-100
                  "
                              />
                              <div className="flex flex-col">
                                <div className="transition text-base text-scale-1100 group-hover:text-scale-1200 flex items-center">
                                  <span>{item.label}</span>
                                  <div className="relative h-4 w-4">
                                    <div
                                      className="
                            absolute
                            top-0.5
                            transition-all
                            ease-out
                            opacity-0 group-hover:opacity-100
                            scale-95 group-hover:scale-100
                            left-0 group-hover:left-1
                            "
                                    >
                                      <IconChevronRight strokeWidth={1.5} size={14} />
                                    </div>
                                  </div>
                                </div>
                                <span className="text-xs text-scale-1000">{item.description}</span>
                              </div>
                            </div>
                          </a>
                        </Link>
                      )
                    })}
                  </div>
                </>
              )
            })}
          </>
        }
      >
        <div
          className="
              flex 
              group
              items-center 
              justify-between 
              bg-scaleA-200 
              border 
              transition
              hover:border-scale-600
              hover:bg-scaleA-300 
              border-scale-500 pl-3 pr-1.5 w-full h-[32px] rounded
              rounded-tr-none
              rounded-br-none
              
              "
        >
          <div className="flex items-center justify-between w-full min-w-[128px]">
            <div className="flex items-center space-x-2">
              <img
                src="/docs/img/icons/javascript-icon.svg"
                className="w-4 h-4 rounded drop-shadow-sm"
              />
              <p className="text-scale-1200 text-sm group-hover:text-scale-1200 transition">
                supabase-js
              </p>
            </div>
            <div className="text-scale-900">
              <IconChevronDown size={14} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </Popover>
      <Dropdown size="small" align="start" side="bottom" overlay={<VersionOverlay />}>
        <div className="w-20">
          <div
            className="
              flex 
              group
              items-center 
              justify-between 
              bg-scaleA-200 
              border 
              transition
              hover:border-scale-600
              hover:bg-scaleA-300 
              border-scale-500 pl-3 pr-1.5 w-full h-[32px] rounded
              

              rounded-tl-none
              rounded-bl-none
              "
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <p className="font-mono text-scale-1200 text-xs group-hover:text-scale-1200 transition">
                  v2.0
                </p>
              </div>
              <div className="text-scale-900">
                <IconChevronDown size={14} strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>
      </Dropdown>
    </div>
  )
}

const VersionOverlay = () => {
  return (
    <>
      <Dropdown.Label>Stable releases</Dropdown.Label>
      <Dropdown.Item>
        version 2.0
        <Dropdown.RightSlot>
          <Badge size="small">Latest</Badge>
        </Dropdown.RightSlot>
      </Dropdown.Item>
      <Dropdown.Item>Version 1.0 </Dropdown.Item>
      <Dropdown.Separator />
      <Dropdown.Label>Alpha releases</Dropdown.Label>
      <Dropdown.Misc>
        <p className="text-scale-900 text-xs">Currently no alpha releases</p>
      </Dropdown.Misc>
    </>
  )
}
export default RefSwitcher
