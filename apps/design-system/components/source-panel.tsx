import { Doc } from '@/.contentlayer/generated'
import Link from 'next/link'
import { forwardRef } from 'react'

import { ExternalLink } from 'lucide-react'
import { Button } from 'ui'
import { cn } from 'ui/src/lib/utils/cn'
import Image from 'next/image'

const SourcePanel = forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement> & { doc: Doc }>(
  ({ doc, children, ...props }, ref) => {
    const ShadcnPanel = () => {
      if (doc.source?.shadcn) {
        return (
          <div
            className={cn(
              'bg-surface-75/50 border flex items-center p-3 px-5 gap-6 first:rounded-t-md last:rounded-b-md',
              props.className
            )}
            {...props}
          >
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6">
                <rect width="256" height="256" fill="none"></rect>
                <line
                  x1="208"
                  y1="128"
                  x2="128"
                  y2="208"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="16"
                ></line>
                <line
                  x1="192"
                  y1="40"
                  x2="40"
                  y2="192"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="16"
                ></line>
              </svg>
              <span className="hidden font-bold sm:inline-block">shadcn/ui</span>
            </div>
            <span className="text-foreground-light text-sm">
              This component is based on ui.shadcn
            </span>
          </div>
        )
      }
    }

    const VaulPanel = () => {
      if (doc.source?.vaul) {
        return (
          <div
            className={cn(
              'bg-surface-75/50 border flex items-center p-3 px-5 gap-6 first:rounded-t-md last:rounded-b-md',
              props.className
            )}
            {...props}
          >
            <div className="flex items-center gap-2">
              <Image
                width={24}
                height={24}
                src="https://avatars.githubusercontent.com/u/36730035?s=48&v=4"
                alt="Vaul"
                className="h-6 w-6 rounded-full"
              />
              <span className="hidden font-bold text-xs sm:inline-block">vaul</span>
            </div>
            <span className="text-foreground-light text-xs">
              This component is based on vaul by emilkowalski
            </span>
          </div>
        )
      }
    }

    const ReactAccesibleTreeViewPanel = () => {
      if (doc.source?.reactAccessibleTreeview) {
        return (
          <div
            className={cn(
              'bg-surface-75/50 border flex items-center p-3 px-5 gap-6 first:rounded-t-md last:rounded-b-md justify-between',
              props.className
            )}
            {...props}
          >
            <div className="flex items-center gap-2">
              <Image
                width={24}
                height={24}
                src="https://avatars.githubusercontent.com/u/14020024?v=4"
                alt="dgreene1"
                className="h-6 w-6 rounded-full"
              />
              <span className="hidden text-xs font-bold sm:inline-block">
                react-accessible-treeview
              </span>
              <span className="text-foreground-light text-xs">
                Component based on react-accessible-treeview by dgreene1
              </span>
            </div>
            {doc.links ? (
              <div className="flex items-center gap-2 justify-end">
                {doc.links?.doc && (
                  <Button
                    type="outline"
                    className="rounded-full"
                    icon={<ExternalLink className="text-foreground-muted" strokeWidth={1} />}
                  >
                    <Link
                      href={doc.links.doc}
                      target="_blank"
                      rel="noreferrer"

                      // className={cn(buttonVariants({ variant: 'default' }), 'gap-1')}
                    >
                      Docs
                    </Link>
                  </Button>
                )}
                {doc.links?.api && (
                  <Button
                    type="outline"
                    className="rounded-full"
                    icon={<ExternalLink className="text-foreground-muted" strokeWidth={1} />}
                  >
                    <Link
                      href={doc.links.api}
                      target="_blank"
                      rel="noreferrer"

                      // className={cn(badgeVariants({ variant: 'default' }), 'gap-1')}
                    >
                      API Reference
                    </Link>
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        )
      }
    }

    const InputOtp = () => {
      if (doc.source?.inputOtp) {
        return (
          <div
            className={cn(
              'bg-surface-75/50 border flex items-center p-3 px-5 gap-6 first:rounded-t-md last:rounded-b-md',
              props.className
            )}
            {...props}
          >
            <div className="flex items-center gap-2">
              <Image
                width={24}
                height={24}
                src="https://avatars.githubusercontent.com/u/10366880?s=48&v=4"
                alt="inputOtp"
                className="h-6 w-6 rounded-full"
              />
              <span className="hidden font-bold text-xs sm:inline-block">input-otp</span>
            </div>
            <span className="text-foreground-light text-xs">
              This component is based on input-otp by guilhermerodz
            </span>
          </div>
        )
      }
    }

    const RadixPanel = () => {
      if (doc.source?.radix) {
        return (
          <div
            className={cn(
              'bg-surface-75/50 border flex items-center p-3 px-5 gap-6 first:rounded-t-md last:rounded-b-md',
              props.className
            )}
            {...props}
          >
            <svg
              width="76"
              height="24"
              viewBox="0 0 76 24"
              fill="currentcolor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M43.9022 20.0061H46.4499C46.2647 19.0375 46.17 18.1161 46.17 17.0058V12.3753C46.17 9.25687 44.3893 7.72127 41.1943 7.72127C38.3003 7.72127 36.3324 9.23324 36.0777 11.8083H38.9254C39.0181 10.698 39.8052 9.96561 41.1017 9.96561C42.4446 9.96561 43.3243 10.6743 43.3243 12.1391V12.7061L39.8052 13.1077C37.4206 13.3912 35.5684 14.3834 35.5684 16.7931C35.5684 18.9666 37.2353 20.2659 39.5274 20.2659C41.4027 20.2659 42.9845 19.4863 43.6401 18.1161C43.6689 18.937 43.9022 20.0061 43.9022 20.0061ZM40.3377 18.1634C39.157 18.1634 38.5087 17.5727 38.5087 16.6278C38.5087 15.3757 39.4579 15.0922 40.7082 14.9268L43.3243 14.6197V15.352C43.3243 17.242 41.8658 18.1634 40.3377 18.1634ZM56.2588 20.0061H59.176V3H56.2125V9.96561C55.6569 8.76075 54.3141 7.72127 52.4851 7.72127C49.3058 7.72127 47.099 10.2963 47.099 14.0054C47.099 17.7381 49.3058 20.2896 52.4851 20.2896C54.2678 20.2896 55.68 19.2973 56.2588 18.0925V20.0061ZM56.282 14.218C56.282 16.5569 55.1938 18.0689 53.3185 18.0689C51.3969 18.0689 50.1856 16.486 50.1856 14.0054C50.1856 11.5485 51.3969 9.94198 53.3185 9.94198C55.1938 9.94198 56.282 11.454 56.282 13.7928V14.218ZM60.9066 5.97304H64.0553V3.01996H60.9066V5.97304ZM60.9992 20.0061H63.9627V8.00476H60.9992V20.0061ZM67.6638 20.0061L70.6041 15.8954L73.5212 20.0061H76.9246L72.3636 13.7219L76.5542 8.00476H73.3823L70.7661 11.7138L68.1731 8.00476H64.7697L69.0066 13.8637L64.4919 20.0061H67.6638Z"></path>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M24.9132 20V14.0168H28.7986L32.4513 20H35.7006L31.6894 13.5686C33.5045 12.986 35.0955 11.507 35.0955 9.01961C35.0955 5.7479 32.7994 4 28.9571 4H22V20H24.9132ZM24.9132 6.35294V11.6863H28.821C31.0395 11.6863 32.1599 10.7675 32.1599 9.01961C32.1599 7.27171 30.9395 6.35294 28.621 6.35294H24.9132Z"
              ></path>
              <path d="M7 23C3.13401 23 0 19.6422 0 15.5C0 11.3578 3.13401 8 7 8V23Z"></path>
              <path d="M7 0H0V7H7V0Z"></path>
              <path d="M11.5 7C13.433 7 15 5.433 15 3.5C15 1.567 13.433 0 11.5 0C9.56704 0 8 1.567 8 3.5C8 5.433 9.56704 7 11.5 7Z"></path>
            </svg>
            <div className="flex flex-row items-center justify-between text-sm w-full">
              <span className="text-foreground-light text-xs">This component uses Radix UI</span>
              {doc.links ? (
                <div className="flex items-center gap-2 justify-end">
                  {doc.links?.doc && (
                    <Button
                      type="outline"
                      className="rounded-full"
                      icon={<ExternalLink className="text-foreground-muted" strokeWidth={1} />}
                    >
                      <Link
                        href={doc.links.doc}
                        target="_blank"
                        rel="noreferrer"

                        // className={cn(buttonVariants({ variant: 'default' }), 'gap-1')}
                      >
                        Docs
                      </Link>
                    </Button>
                  )}
                  {doc.links?.api && (
                    <Button
                      type="outline"
                      className="rounded-full"
                      icon={<ExternalLink className="text-foreground-muted" strokeWidth={1} />}
                    >
                      <Link
                        href={doc.links.api}
                        target="_blank"
                        rel="noreferrer"

                        // className={cn(badgeVariants({ variant: 'default' }), 'gap-1')}
                      >
                        API Reference
                      </Link>
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )
      }
    }

    return (
      <div className="flex flex-col -space-y-px">
        <RadixPanel />
        <VaulPanel />
        <InputOtp />
        <ReactAccesibleTreeViewPanel />
        {/* <ShadcnPanel /> */}
      </div>
    )
  }
)

SourcePanel.displayName = 'SourcePanel'

export { SourcePanel }
