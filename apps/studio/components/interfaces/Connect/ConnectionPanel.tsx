import { FileCode, X } from 'lucide-react'
import { cn, CodeBlock, DIALOG_PADDING_X } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { ConnectionParameters } from './ConnectionParameters'
import { SessionIcon, TransactionIcon } from './pooler-icons-v2'

interface ConnectionPanelProps {
  type?: 'direct' | 'transaction' | 'session'
  title: string
  description: string
  connectionString: string
  onCopy: () => void
  ipv4Status: {
    type: 'error' | 'success'
    title: string
    description?: string
    link?: { text: string; url: string }
  }
  notice?: string
  parameters?: Array<{
    key: string
    value: string
    description?: string
  }>
  contentType?: 'input' | 'code'
  lang?: string
  fileTitle?: string
}

const IPv4StatusIcon = ({ className, active }: { className?: string; active: boolean }) => {
  return (
    <div className={cn('relative inline-flex', className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1"
        stroke="currentColor"
        className="size-6 stroke-foreground-lighter"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
        />
      </svg>

      {!active ? (
        <div className="absolute -right-1.5 -top-1.5 bg-destructive rounded w-4 h-4 flex items-center justify-center">
          <X size={10} strokeWidth={4} className="text-white rounded-full" />
        </div>
      ) : (
        <div className="absolute -right-1.5 -top-1.5 bg-brand-500 rounded w-4 h-4 flex items-center justify-center">
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.33325 2.5L3.74992 7.08333L1.66659 5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  )
}

export const CodeBlockFileHeader = ({ title }: { title: string }) => {
  return (
    <div className="flex items-center justify-between px-4 py-1 bg-surface-100/50 border border-b-0 border-surface rounded-t">
      <div className="flex items-center gap-2">
        <FileCode size={12} className="text-foreground-muted" strokeWidth={1.5} />
        <span className="text-xs text-foreground-light">{title}</span>
      </div>
    </div>
  )
}

export const ConnectionPanel = ({
  type = 'direct',
  title,
  description,
  connectionString,
  onCopy,
  ipv4Status,
  notice,
  parameters = [],
  contentType = 'input',
  lang = 'bash',
  fileTitle,
}: ConnectionPanelProps) => {
  return (
    <div className={cn('py-8', DIALOG_PADDING_X)}>
      <div className="grid grid-cols-2 gap-20 w-full">
        <div className="flex flex-col">
          <h1 className="text-sm mb-2">{title}</h1>
          <p className="text-xs text-foreground-light mb-4">{description}</p>
          <div className="flex flex-col -space-y-px">
            {/* {contentType === 'input' ? ( */}
            {false ? (
              <Input
                copy
                readOnly
                className="text-xs dark:bg-alternative font-mono input-mono [&>div>div>div>input]:text-xs [&>div>div>div>input]:opacity-100 rounded-b-none"
                value={connectionString}
                onCopy={onCopy}
              />
            ) : (
              <>
                {fileTitle && <CodeBlockFileHeader title={fileTitle} />}
                <CodeBlock
                  wrapperClassName={cn(
                    '[&_pre]:rounded-b-none [&_pre]:px-4 [&_pre]:py-3',
                    fileTitle && '[&_pre]:rounded-t-none'
                  )}
                  language={lang}
                  value={connectionString}
                  className="[&_code]:text-[12px] [&_code]:text-foreground"
                  hideLineNumbers
                />
              </>
            )}
            {parameters.length > 0 && <ConnectionParameters parameters={parameters} />}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex flex-col -space-y-px w-full">
            {type !== 'direct' && (
              <>
                <div className="relative border border-muted px-5 flex items-center gap-3 py-3 first:rounded-t last:rounded-b">
                  <div className="absolute top-2 left-2.5">
                    {type === 'transaction' ? <TransactionIcon /> : <SessionIcon />}
                  </div>
                  <div className="flex flex-col pl-[52px]">
                    <span className="text-xs font-medium text-foreground">
                      {type === 'transaction'
                        ? 'Suitable for stateless applications'
                        : 'Suitable for long running applications'}
                    </span>
                    <span className="text-xs text-foreground-light">
                      {type === 'transaction'
                        ? 'Shared pool connection for all client connections'
                        : ' Dedicated pool connection for each client'}
                    </span>
                  </div>
                </div>
                <div className="border border-muted px-5 flex items-center gap-3 py-3 first:rounded-t last:rounded-b">
                  {/* <div className="flex items-center gap-2 -ml-2"> */}
                  {/* {type === 'transaction' ? <TransactionIcon /> : <SessionIcon />} */}
                  {/* </div> */}
                  <div className="flex flex-col pl-[52px]">
                    <span className="text-xs font-medium text-foreground">
                      {type === 'transaction'
                        ? 'Suitable for stateless applications'
                        : 'Suitable for long running applications'}
                    </span>
                    <span className="text-xs text-foreground-light">
                      {type === 'transaction'
                        ? 'Shared pool connection for all client connections'
                        : ' Dedicated pool connection for each client'}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="border border-muted px-5 flex gap-7 py-3 first:rounded-t last:rounded-b">
              <div className="flex items-center gap-2">
                <IPv4StatusIcon active={ipv4Status.type === 'success'} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">{ipv4Status.title}</span>
                {ipv4Status.description && (
                  <span className="text-xs text-foreground-light">{ipv4Status.description}</span>
                )}
                {ipv4Status.link && (
                  <a href={ipv4Status.link.url} className="text-xs text-brand hover:text-brand-600">
                    {ipv4Status.link.text}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
