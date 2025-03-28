import { useEffect, useState } from 'react'
import supabase from '~/lib/supabaseAdmin'
import Link from 'next/link'
import { Database } from '~/lib/database.types'
import CMSLayout from '~/components/Layouts/CMSLayout'
import { Badge, Button } from 'ui'
import Image from 'next/image'
import { useRouter } from 'next/router'

type Meetup = Database['public']['Tables']['meetups']['Row']

export default function MeetupsCMS() {
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const { basePath } = useRouter()

  useEffect(() => {
    fetchMeetups()
  }, [])

  async function fetchMeetups() {
    const { data, error } = await supabase.from('meetups').select('*')

    if (error) {
      console.error('Error fetching meetups:', error)
      return
    }

    setMeetups(data as Meetup[])
  }

  // Group meetups by country
  const meetupsByCountry = meetups.reduce(
    (acc, meetup) => {
      const country = meetup.country || 'Uncategorized'
      if (!acc[country]) {
        acc[country] = []
      }
      acc[country].push(meetup)
      return acc
    },
    {} as Record<string, Meetup[]>
  )

  // Convert to array and sort by country name
  const countryGroups = Object.entries(meetupsByCountry).sort(([a], [b]) => a.localeCompare(b))

  // Calculate how many countries should go in each column
  const countriesPerColumn = Math.ceil(countryGroups.length / 3)
  const columns = [
    countryGroups.slice(0, countriesPerColumn),
    countryGroups.slice(countriesPerColumn - 1, countriesPerColumn * 2 - 5),
    countryGroups.slice(countriesPerColumn * 2 - 5),
  ]

  return (
    <CMSLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="h1">Meetups CMS</h1>
          <div className="flex items-center space-x-4">
            <Button asChild>
              <Link href="/cms/meetups">All Meetups</Link>
            </Button>
          </div>
        </div>

        <div className="relative font-['DepartureMono'] text-foreground-lighter w-[1200px] h-fit bg-alternative text-lg border flex items-start justify-center gap-2 p-10">
          <Image
            src={`${basePath}/images/launchweek/14/meetups-og-bg.png`}
            alt="meetups bg"
            width={1200}
            height={600}
            className="absolute inset-0 w-full h-full bg-cover"
            quality={100}
          />
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="relative z-10 flex-1 flex flex-col">
              {columnIndex === 0 && (
                <div className="text-2xl mb-[53px] flex items-center gap-3 text-foreground">
                  <svg
                    width="27"
                    height="25"
                    viewBox="0 0 71 81"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect y="30" width="10" height="10" fill="white" />
                    <rect x="10" y="20" width="10" height="10" fill="white" />
                    <rect x="10" y="30" width="10" height="10" fill="white" />
                    <rect x="20" y="20" width="10" height="10" fill="white" />
                    <rect x="20" y="40" width="10" height="10" fill="white" />
                    <rect x="10" y="40" width="10" height="10" fill="white" />
                    <rect y="40" width="10" height="10" fill="white" />
                    <rect x="20" y="10" width="10" height="10" fill="white" />
                    <rect x="30" width="10" height="10" fill="white" />
                    <rect x="30" y="10" width="10" height="10" fill="white" />
                    <rect x="30" y="20" width="10" height="10" fill="white" />
                    <rect x="20" y="30" width="10" height="10" fill="white" />
                    <rect x="30" y="30" width="10" height="10" fill="white" />
                    <rect x="40" y="30" width="10" height="10" fill="white" />
                    <rect x="50" y="30" width="10" height="10" fill="white" />
                    <rect x="60" y="30" width="10" height="10" fill="white" />
                    <rect x="30" y="40" width="10" height="10" fill="white" />
                    <rect x="30" y="60" width="10" height="10" fill="white" />
                    <rect x="30" y="70" width="10" height="10" fill="white" />
                    <rect x="30" y="50" width="10" height="10" fill="white" />
                    <rect x="40" y="40" width="10" height="10" fill="white" />
                    <rect x="40" y="50" width="10" height="10" fill="white" />
                    <rect x="50" y="50" width="10" height="10" fill="white" />
                    <rect x="40" y="60" width="10" height="10" fill="white" />
                    <rect x="50" y="40" width="10" height="10" fill="white" />
                    <rect x="60" y="40" width="10" height="10" fill="white" />
                  </svg>
                  <span>LW14 Meetups</span>
                </div>
              )}
              {column.map(([country, countryMeetups]) => (
                <div key={country} className="">
                  <div className="grid grid-cols-[130px_1fr] gap-4">
                    <div className="">{country === 'Saudi Arabia' ? 'S. Arabia' : country}</div>
                    <div className="gap-1">
                      {[...countryMeetups]
                        .sort((a, b) => (a.city || '').localeCompare(b.city || ''))
                        .map((meetup) => (
                          <div key={meetup.id} className="text-foreground flex items-center gap-2">
                            {meetup.city || 'Unnamed Meetup'}
                            {meetup.is_live && (
                              <Badge variant="brand" className="!py-0">
                                New
                              </Badge>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </CMSLayout>
  )
}
