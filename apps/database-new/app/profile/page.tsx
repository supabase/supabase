import { createClient } from '@/lib/supabase/server'
import { default as dayjs, default as relativeTime } from 'dayjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Threads from './Threads'
import { Suspense } from 'react'
import ShimmeringLoader from '@/components/Shimmer'
import type { Metadata } from 'next'

dayjs.extend(relativeTime)
export const metadata: Metadata = {
  title: 'database.design | Profile',
}

// revalidatePath not working in the create route handler
// force-dynamic to refetch every time if needed
// just a hack for now
// export const dynamic = 'force-dynamic'

const Profile = async () => {
  return (
    <div className="grid grid-cols-4 gap-x-8 py-6 xl:py-12 gap-y-6 xl:gap-y-0">
      <div className="col-span-4 xl:col-span-1 flex flex-col gap-y-6">
        <div className="flex items-center gap-x-4">
          <Suspense fallback={<p>Loading user...</p>}>
            <ProfileDetails />
          </Suspense>
        </div>
      </div>

      <div className="col-span-4 xl:col-span-3 flex flex-col gap-y-4">
        <h2>Past conversations</h2>

        <div className="w-full h-px border-t" />

        <Suspense
          fallback={
            <div className="flex flex-col gap-4">
              <ShimmeringLoader className="h-14 bg-surface-100 border rounded" />
              <ShimmeringLoader className="h-14 bg-surface-100 border rounded" />
              <ShimmeringLoader className="h-14 bg-surface-100 border rounded" />
              <ShimmeringLoader className="h-14 bg-surface-100 border rounded opacity-50" />
              <ShimmeringLoader className="h-14 bg-surface-100 border rounded opacity-25" />
              <ShimmeringLoader className="h-14 bg-surface-100 border rounded opacity-10" />
            </div>
          }
        >
          <Threads />
        </Suspense>
      </div>
    </div>
  )
}

async function ProfileDetails() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  return !user ? (
    // make this better!
    <p>No user found</p>
  ) : (
    <>
      <div
        className="border border-foreground-lighter rounded-full w-12 h-12 bg-no-repeat bg-center bg-cover"
        style={{ backgroundImage: `url('${user.user_metadata.avatar_url}')` }}
      />
      <div className="flex flex-col">
        <p className="text-lg">{user.user_metadata.full_name}</p>
        <p className="text-foreground-light">@{user.user_metadata.user_name}</p>
      </div>
    </>
  )
}

export default Profile
