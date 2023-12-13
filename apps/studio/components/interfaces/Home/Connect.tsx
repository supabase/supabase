import { useParams } from 'common'
import { Plug } from 'lucide-react'
import { useState } from 'react'
import {
  Alert,
  Button,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  Dialog_Shadcn_,
  DialogContent_Shadcn_,
  DialogDescription_Shadcn_,
  DialogFooter_Shadcn_,
  DialogHeader_Shadcn_,
  DialogTitle_Shadcn_,
  DialogTrigger_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  IconChevronDown,
  Input,
  Tabs,
} from 'ui'

import { DATA, LIBS } from './Connect.utils'
import CopyButton from 'components/ui/CopyButton'

const Connect = () => {
  const { ref } = useParams()
  //const project = useSelectedProject()
  //const [open, setOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState(DATA[0])
  const [libSelectorOpen, setLibSelectorOpen] = useState(false)
  const [selectedLib, setSelectedLib] = useState(LIBS[0].key)

  function onSelectLib(key: string) {
    console.log('key', key)
    setSelectedLib(key)
    setLibSelectorOpen(false)
  }
  return (
    <div>
      <Dialog_Shadcn_ open={true}>
        <DialogTrigger_Shadcn_ asChild>
          <Button type="secondary">
            <span className="flex items-center gap-2">
              <Plug size={12} className="rotate-90" /> <span>Connect</span>
            </span>
          </Button>
        </DialogTrigger_Shadcn_>
        <DialogContent_Shadcn_ className="sm:max-w-5xl">
          <DialogHeader_Shadcn_>
            <DialogTitle_Shadcn_>Connect to your project</DialogTitle_Shadcn_>
            <DialogDescription_Shadcn_>
              Get the connection strings and environment variables for your app
            </DialogDescription_Shadcn_>
          </DialogHeader_Shadcn_>

          <div className="w-full">
            <div className="flex gap-4 ">
              <div className="text-sm w-4/6 shrink-0">
                <ul className="grid gap-4">
                  {DATA.map((item) => (
                    <li key={item.key} onMouseEnter={() => setHoveredItem(item)}>
                      <div className="flex items-center gap-8 w-full grow">
                        <div className="font-bold w-28">{item.label}</div>
                        <div className="font-mono w-full">
                          <Input copy disabled id="ref" size="small" value={item.value} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="h-full">
                  <Alert
                    withIcon
                    variant={hoveredItem.type as 'info' | 'warning'}
                    title={hoveredItem.label}
                  >
                    <div className="w-full space-y-2">
                      <p className="text-sm">{hoveredItem.description}</p>
                    </div>
                  </Alert>
                </div>
              </div>
            </div>
          </div>
          <Tabs type="underlined" size="small">
            <Tabs.Panel id="api_keys" label="API Keys" key="keys">
              <div className="bg-surface-300 p-4">
                <Popover_Shadcn_
                  open={libSelectorOpen}
                  onOpenChange={setLibSelectorOpen}
                  modal={false}
                >
                  <PopoverTrigger_Shadcn_ asChild>
                    <Button
                      size={'small'}
                      type="text"
                      iconRight={
                        <IconChevronDown
                          className="text-foreground-light"
                          strokeWidth={1.5}
                          size={14}
                        />
                      }
                    >
                      <div className="w-full flex space-x-3 py-0.5">
                        <p className="text-xs text-foreground-light">
                          {LIBS.find((lib) => lib.key === selectedLib)?.label}
                        </p>
                      </div>
                    </Button>
                  </PopoverTrigger_Shadcn_>
                  <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
                    <Command_Shadcn_>
                      <CommandList_Shadcn_>
                        {LIBS.map((lib) => (
                          <CommandItem_Shadcn_
                            key={lib.key}
                            value={lib.key}
                            className=""
                            onSelect={() => {
                              onSelectLib(lib.key)
                              setLibSelectorOpen(false)
                            }}
                            onClick={() => {
                              onSelectLib(lib.key)
                              setLibSelectorOpen(false)
                            }}
                          >
                            {lib.label}
                          </CommandItem_Shadcn_>
                        ))}
                      </CommandList_Shadcn_>
                    </Command_Shadcn_>
                  </PopoverContent_Shadcn_>
                </Popover_Shadcn_>

                <div className="bg-surface bg-surface-100 p-4 rounded-md">
                  <Tabs type="underlined" size="small">
                    {LIBS.find((lib) => lib.key === selectedLib)?.files?.map((file) => (
                      <Tabs.Panel
                        id={file.name}
                        label={file.name}
                        key={file.name}
                        className="flex items-center gap-1 relative"
                      >
                        <CopyButton
                          text={file.content}
                          type="default"
                          title="Copy log to clipboard"
                          className="absolute right-1 top-1"
                        />
                        <pre className="text-sm">{file.content}</pre>
                      </Tabs.Panel>
                    ))}
                  </Tabs>
                </div>
              </div>
            </Tabs.Panel>
            <Tabs.Panel id="connection_strings" label="Connection strings" key="connection_strings">
              <div className="bg-surface-300 p-4">aeu</div>
            </Tabs.Panel>
          </Tabs>

          <DialogFooter_Shadcn_>
            <Button type="secondary">Close</Button>
          </DialogFooter_Shadcn_>
        </DialogContent_Shadcn_>
      </Dialog_Shadcn_>
    </div>
  )
}

export default Connect
