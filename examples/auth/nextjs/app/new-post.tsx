import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

import type { Database } from '@/lib/database.types'

export default function NewPost() {
  const addPost = async (formData: FormData) => {
    'use server'
    const content = String(formData.get('content'))
    const supabase = createServerActionClient<Database>({ cookies })
    await supabase.from('posts').insert({ content }).select()
    revalidatePath('/')
  }

  return (
    <form action={addPost}>
      <input name="content" />
    </form>
  )
}
