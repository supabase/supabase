import { motion } from 'framer-motion'
import { FileText, MessageCircleMore, WandSparkles } from 'lucide-react'

import { Button } from 'ui'
import {
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
} from 'ui-patterns/InnerSideMenu'

interface AIOnboardingProps {
  setMessages: (messages: any[]) => void
  onSendMessage: (message: string) => void
}

export default function AIOnboarding({ setMessages, onSendMessage }: AIOnboardingProps) {
  const sendMessageToAssistant = (message: string) => {
    onSendMessage(message)
  }

  return (
    <div className="w-full p-5 flex flex-col grow shrink-0 justify-end overflow-auto">
      <div className="shrink-0">
        <motion.div
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0 }}
        >
          <p className="text-base mb-2">How can I assist you?</p>
          <p className="text-sm text-foreground-lighter mb-4">
            I can help you build and manage your database by writing SQL or supabase-js, set up
            policies, functions or triggers, and query your data - ask me anything.
          </p>
        </motion.div>
        <motion.div>
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0 }}
          >
            <InnerSideMenuCollapsible className="border-b border-muted py-3">
              <InnerSideMenuCollapsibleTrigger className="px-0 -mx-3" title="Tables" />
              <InnerSideMenuCollapsibleContent>
                <div className="mt-3 mb-1 space-y-1">
                  <Button
                    size="small"
                    icon={<WandSparkles strokeWidth={1.5} size={16} />}
                    type="text"
                    className="w-full justify-start py-1 h-auto"
                    onClick={() =>
                      sendMessageToAssistant(
                        "Create a table of countries and a table of cities. The cities table should have a country column that's a foreign key to the countries table."
                      )
                    }
                  >
                    Create a new table
                  </Button>

                  <Button
                    size="small"
                    icon={<FileText strokeWidth={1.5} size={16} />}
                    type="text"
                    className="w-full justify-start py-1 h-auto"
                    onClick={() =>
                      sendMessageToAssistant(
                        'Give me a list of new users from the auth.users table who signed up in the past week'
                      )
                    }
                  >
                    Query your data
                  </Button>

                  <Button
                    size="small"
                    icon={<MessageCircleMore strokeWidth={1.5} size={16} />}
                    type="text"
                    className="w-full justify-start py-1 h-auto"
                    onClick={() =>
                      sendMessageToAssistant(
                        'Give me a chart showing the number of new sign ups in the auth.users table per day over the last week'
                      )
                    }
                  >
                    Chart your data
                  </Button>
                </div>
              </InnerSideMenuCollapsibleContent>
            </InnerSideMenuCollapsible>
          </motion.div>

          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <InnerSideMenuCollapsible className="border-b border-muted py-3">
              <InnerSideMenuCollapsibleTrigger className="px-0 -mx-3" title="RLS Policies" />
              <InnerSideMenuCollapsibleContent>
                <div className="mt-3 mb-1 space-y-1">
                  <Button
                    size="small"
                    icon={<WandSparkles strokeWidth={1.5} size={16} />}
                    type="text"
                    className="w-full justify-start py-1 h-auto"
                    onClick={() =>
                      sendMessageToAssistant(
                        'Suggest some database RLS policies I can add to my public schema'
                      )
                    }
                  >
                    Suggest RLS policies
                  </Button>

                  <Button
                    size="small"
                    icon={<FileText strokeWidth={1.5} size={16} />}
                    type="text"
                    className="w-full justify-start py-1 h-auto"
                    onClick={() =>
                      sendMessageToAssistant('Generate some examples of database RLS policies')
                    }
                  >
                    Examples of RLS policies
                  </Button>

                  <Button
                    size="small"
                    icon={<MessageCircleMore strokeWidth={1.5} size={16} />}
                    type="text"
                    className="w-full justify-start py-1 h-auto"
                    onClick={() => sendMessageToAssistant(`What are database RLS policies`)}
                  >
                    What are RLS policies?
                  </Button>
                </div>
              </InnerSideMenuCollapsibleContent>
            </InnerSideMenuCollapsible>
          </motion.div>

          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <InnerSideMenuCollapsible className="border-b border-muted py-3">
              <InnerSideMenuCollapsibleTrigger className="px-0 -mx-3" title="Functions" />
              <InnerSideMenuCollapsibleContent>
                <div className="mt-3 mb-1 space-y-1">
                  <Button
                    size="small"
                    icon={<WandSparkles strokeWidth={1.5} size={16} />}
                    type="text"
                    className="w-full justify-start py-1 h-auto"
                    onClick={() =>
                      sendMessageToAssistant(
                        'Suggest some database functions I can add to my public schema'
                      )
                    }
                  >
                    Suggest database functions
                  </Button>

                  <Button
                    size="small"
                    icon={<FileText strokeWidth={1.5} size={16} />}
                    type="text"
                    className="w-full justify-start py-1 h-auto"
                    onClick={() =>
                      sendMessageToAssistant('Generate some examples of database functions')
                    }
                  >
                    Examples of database functions
                  </Button>

                  <Button
                    size="small"
                    icon={<MessageCircleMore strokeWidth={1.5} size={16} />}
                    type="text"
                    className="w-full justify-start py-1 h-auto"
                    onClick={() => sendMessageToAssistant('What are database functions')}
                  >
                    What are database functions?
                  </Button>
                </div>
              </InnerSideMenuCollapsibleContent>
            </InnerSideMenuCollapsible>
          </motion.div>

          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <InnerSideMenuCollapsible className="py-3">
              <InnerSideMenuCollapsibleTrigger className="px-0 -mx-3" title="Triggers" />
              <InnerSideMenuCollapsibleContent>
                <div className="mt-3 mb-1 space-y-1">
                  <Button
                    size="small"
                    icon={<WandSparkles strokeWidth={1.5} size={16} />}
                    type="text"
                    className="w-full justify-start py-1 h-auto"
                    onClick={() =>
                      sendMessageToAssistant(
                        'Suggest some database triggers I can add to my public schema'
                      )
                    }
                  >
                    Suggest database Triggers
                  </Button>

                  <Button
                    size="small"
                    icon={<FileText strokeWidth={1.5} size={16} />}
                    type="text"
                    className="w-full justify-start py-1 h-auto"
                    onClick={() =>
                      sendMessageToAssistant(`Generate some examples of database triggers`)
                    }
                  >
                    Examples of database triggers
                  </Button>

                  <Button
                    size="small"
                    icon={<MessageCircleMore strokeWidth={1.5} size={16} />}
                    type="text"
                    className="w-full justify-start py-1 h-auto"
                    onClick={() => sendMessageToAssistant('What are database triggers')}
                  >
                    What are database triggers?
                  </Button>
                </div>
              </InnerSideMenuCollapsibleContent>
            </InnerSideMenuCollapsible>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
