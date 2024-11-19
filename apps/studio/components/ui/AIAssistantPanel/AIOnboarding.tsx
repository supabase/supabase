import { motion } from 'framer-motion'
import { Button } from 'ui'
import { WandSparkles, FileText, MessageCircle, MessageCircleMore } from 'lucide-react'

interface AIOnboardingProps {
  setMessages: (messages: any[]) => void
  onSendMessage: (message: string) => void
}

export default function AIOnboarding({ setMessages, onSendMessage }: AIOnboardingProps) {
  const sendMessageToAssistant = (message: string) => {
    onSendMessage(message)
  }

  return (
    <div className="w-full px-8 py-content flex flex-col flex-1 h-full">
      <div className="shrink-0 h-64 mb-5 w-auto overflow-hidden -mx-8 -mt-8 relative">
        <motion.div
          initial={{ height: '800%', bottom: 0 }}
          animate={{ height: '100%', bottom: 0, transition: { duration: 8 } }}
          className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-b from-transparent to-background"
        />
        <div className="h-full w-full relative">
          <motion.div
            initial={{ x: 350, rotate: -45 }}
            animate={{
              x: 400,
              rotate: -45,
              transition: { duration: 5, ease: 'easeInOut' },
            }}
            className="absolute -inset-full bg-gradient-to-b from-black/[0.05] dark:from-white/[0.08] to-transparent "
          />
          <motion.div
            initial={{ x: 380, rotate: -45 }}
            animate={{
              x: 500,
              rotate: -45,
              transition: { duration: 5, ease: 'easeInOut' },
            }}
            className="absolute -inset-full bg-gradient-to-b from-black/[0.05] dark:from-white/[0.08] to-transparent "
          />
          <motion.div
            initial={{ x: 410, rotate: -45 }}
            animate={{
              x: 600,
              rotate: -45,
              transition: { duration: 5, ease: 'easeInOut' },
            }}
            className="absolute -inset-full bg-gradient-to-b from-black/[0.05] dark:from-white/[0.08] to-transparent "
          />
        </div>
      </div>
      <motion.div
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0 }}
      >
        <p className="text-base mb-8">How can I help you today?</p>
      </motion.div>
      <motion.div className="space-y-6 pb-16">
        <motion.section
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0 }}
        >
          <h3 className="text-foreground-light font-mono text-sm uppercase mb-3">Tables</h3>
          <div className="-mx-3">
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
        </motion.section>

        <motion.section
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-foreground-light font-mono text-sm uppercase mb-3">RLS Policies</h3>
          <div className="-mx-3">
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
        </motion.section>

        <motion.section
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-foreground-light font-mono text-sm uppercase mb-3">Functions</h3>
          <div className="-mx-3">
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
              onClick={() => sendMessageToAssistant('Generate some examples of database functions')}
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
        </motion.section>

        <motion.section
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-foreground-light font-mono text-sm uppercase mb-3">Triggers</h3>
          <div className="-mx-3">
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
              onClick={() => sendMessageToAssistant(`Generate some examples of database triggers`)}
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
        </motion.section>
      </motion.div>
    </div>
  )
}
