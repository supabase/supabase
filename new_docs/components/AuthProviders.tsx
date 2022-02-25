import authProviders from '../data/authProviders'
import { Card } from '@supabase/ui'
import Link from 'next/link'

export default function AuthProviders() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {authProviders.map((x: any) => (
        <div key={x.name}>
          <Link href={x.href}>
            <Card>
              <div className="flex justify-between gap-10">
                <p>{x.name}</p>
                <p className="text-white text-tiny font-normal uppercase flex items-center">
                  {x.official ? (
                    <span className="bg-green-600 rounded py-1 px-2">Official</span>
                  ) : (
                    <span className="bg-gray-500 rounded p-1">Unofficial</span>
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex w-full justify-between text-xs border-2 border-solid border-gray-600 rounded p-1">
                  <span>Platform:</span>
                  <span>{x.platform.toString()}</span>
                </div>
                <div className="flex w-full justify-between text-xs border-2 border-solid border-gray-600 rounded p-1">
                  <span>Self-Hosted:</span>
                  <span>{x.selfHosted.toString()}</span>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      ))}
    </div>
  )
}
