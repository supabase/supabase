import { Plug } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Button,
  DialogContent_Shadcn_,
  DialogDescription_Shadcn_,
  DialogFooter_Shadcn_,
  DialogHeader_Shadcn_,
  DialogTitle_Shadcn_,
  DialogTrigger_Shadcn_,
  Dialog_Shadcn_,
  Tabs,
} from 'ui'

import CopyButton from 'components/ui/CopyButton'

import DatabaseConnectionString from 'components/interfaces/Settings/Database/DatabaseSettings/DatabaseConnectionString'
import { LIBS } from '../Connect.utils'
import ConnectDropdown from './ConnectDropdown'
import { Markdown } from 'components/interfaces/Markdown'

const Connect = () => {
  const [parentSelectorOpen, setParentSelectorOpen] = useState(false)
  const [childDropdownOpen, setChildDropdownOpen] = useState(false)
  const [grandChildDropdownOpen, setGrandChildDropdownOpen] = useState(false)

  // Parent -> child -> grandchild
  // nextjs -> app router -> supabase-js
  const [selectedParent, setSelectedParent] = useState(LIBS[0].key)
  const [selectedChild, setSelectedChild] = useState('')
  const [selectedGrandChild, setSelectedGrandChild] = useState('')

  useEffect(() => {
    if (LIBS.find((item) => item.key === selectedParent)?.variants) {
      setSelectedChild(LIBS.find((item) => item.key === selectedParent).variants[0].key)
    }

    // if the selectedParent has clients, set the first one
    if (LIBS.find((item) => item.key === selectedParent).clients) {
      setSelectedGrandChild(LIBS.find((item) => item.key === selectedParent).clients[0].key)
    }
  }, [selectedParent])

  console.log({ selectedParent }, { selectedChild })

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

          <Tabs type="underlined" size="small">
            <Tabs.Panel id="api_keys" label="API Keys" key="keys">
              <div className="bg-surface-300 p-4">
                <div className="flex items-center gap-2">
                  <ConnectDropdown
                    level="parent"
                    open={parentSelectorOpen}
                    setOpen={setParentSelectorOpen}
                    state={selectedParent}
                    updateState={setSelectedParent}
                    label="Framework"
                    items={LIBS}
                  />

                  {selectedParent && LIBS.find((item) => item.key === selectedParent)?.variants && (
                    <ConnectDropdown
                      level="child"
                      open={childDropdownOpen}
                      setOpen={setChildDropdownOpen}
                      state={selectedChild as string}
                      updateState={setSelectedChild}
                      label="Using"
                      items={LIBS.find((item) => item.key === selectedParent)?.variants || []}
                    />
                  )}

                  {selectedParent && LIBS.find((item) => item.key === selectedParent)?.clients && (
                    <ConnectDropdown
                      level="grandchild"
                      open={grandChildDropdownOpen}
                      setOpen={setGrandChildDropdownOpen}
                      state={selectedGrandChild as string}
                      updateState={setSelectedChild}
                      label="Client"
                      items={LIBS.find((item) => item.key === selectedParent)?.clients || []}
                    />
                  )}
                </div>

                <div className="bg-surface bg-surface-100 p-4 rounded-md mt-4">
                  <Tabs type="underlined" size="small">
                    <Tabs.Panel
                      id="1"
                      label="file name"
                      key={1}
                      className="flex items-center gap-1 relative"
                    >
                      <CopyButton
                        text="file.content"
                        type="default"
                        title="Copy log to clipboard"
                        className="absolute right-1 top-1"
                      />

                      <Markdown
                        className="text-foreground-light"
                        content={`Move the GraphiQL interface the Database section of the dashboard [here](/project/_/database/graphiql).`}
                      />
                    </Tabs.Panel>
                  </Tabs>
                </div>
              </div>
            </Tabs.Panel>
            <Tabs.Panel id="connection_strings" label="Connection strings" key="connection_strings">
              <div className="bg-surface-300 p-4">
                <DatabaseConnectionString />
              </div>
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
