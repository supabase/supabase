import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { Card, CardContent, CardHeader, CardTitle, Button, AiIconAnimation, Image } from 'ui'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Logs } from 'icons'
import { BASE_PATH } from 'lib/constants'
import { useParams } from 'common'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'

export const OverviewLearnMore = () => {
  const { ref } = useParams()
  const aiSnap = useAiAssistantStateSnapshot()

  const LearnMoreCards = [
    {
      label: 'Docs',
      title: 'Authentication docs',
      description: 'Read more on authentication and the benefits of using Supabase policies.',
      image: `${BASE_PATH}/img/auth-overview/auth-overview-docs.jpg`,
      actions: [
        {
          label: 'Docs',
          href: 'https://supabase.com/docs/guides/auth',
          icon: <BookOpen />,
        },
      ],
    },
    {
      label: 'Assistant',
      title: 'Explain authentication errors',
      description: 'Our Assistant can help you debug and fix authentication errors.',
      image: `${BASE_PATH}/img/auth-overview/auth-overview-assistant.jpg`,
      actions: [
        {
          label: 'Ask Assistant',
          onClick: () => {
            aiSnap.newChat({
              name: 'Authentication Help',
              open: true,
              initialInput: 'Help me debug and fix authentication errors in my Supabase project',
              suggestions: {
                title: 'I can help you with authentication issues. Here are some common problems:',
                prompts: [
                  {
                    label: 'Login Issues',
                    description: 'Why are users unable to log in to my app?',
                  },
                  {
                    label: 'JWT Problems',
                    description: 'Help me understand and fix JWT token issues',
                  },
                  {
                    label: 'RLS Policies',
                    description: 'Explain my Row Level Security policies and fix issues',
                  },
                  {
                    label: 'Provider Setup',
                    description: 'Help me configure OAuth providers correctly',
                  },
                ],
              },
            })
          },
          icon: <AiIconAnimation size={14} />,
        },
      ],
    },
    {
      label: 'Logs',
      title: 'Dive into the logs',
      description: 'Authentication logs provide a deeper view into your auth requests.',
      image: `${BASE_PATH}/img/auth-overview/auth-overview-logs.jpg`,
      actions: [
        {
          label: 'Go to logs',
          href: `/project/${ref}/logs/auth-logs`,
          icon: <Logs />,
        },
      ],
    },
  ]

  return (
    <ScaffoldSection isFullWidth>
      <ScaffoldSectionTitle className="mb-4">Learn more</ScaffoldSectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {LearnMoreCards.map((card) => (
          <Card key={card.label} className="relative">
            <CardHeader className="absolute top-0 left-0 right-0 border-b-0">
              <CardTitle className="text-foreground-lighter">{card.label}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-black/20 flex w-full">
                <Image
                  src={card.image && card?.image}
                  alt={card.title}
                  width={620}
                  height={324}
                  className="object-fit"
                />
              </div>
              <div className="p-4 flex flex-col">
                <div className="flex flex-col gap-1 mb-4 flex-1">
                  <h4>{card.title}</h4>
                  <p className="text-sm text-foreground-lighter">{card.description}</p>
                </div>
                <div className="flex flex-col gap-2 items-start mt-auto">
                  {card.actions.map((action) => {
                    if ('href' in action) {
                      return (
                        <Button
                          key={action.label}
                          className="inline-flex"
                          type="default"
                          icon={action.icon}
                          asChild
                        >
                          <Link href={action.href} className="inline-flex">
                            {action.label}
                          </Link>
                        </Button>
                      )
                    } else {
                      return (
                        <Button
                          key={action.label}
                          onClick={action.onClick}
                          type="default"
                          className="inline-flex"
                          icon={action.icon}
                        >
                          {action.label}
                        </Button>
                      )
                    }
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScaffoldSection>
  )
}
