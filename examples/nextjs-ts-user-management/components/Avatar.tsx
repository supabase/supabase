import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Avatar({ url, size }: { url: string | null; size: number }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (url) downloadImage(url)
  }, [url])

  async function downloadImage(path: string) {
    try {
      const { data, error } = await supabase.storage.downloadFile(path)
      if (error) {
        throw error
      }
      const url = URL.createObjectURL(data)
      setAvatarUrl(url)
    } catch (error) {
      console.log('Error downloading image: ', error.message)
    }
  }

  return avatarUrl ? (
    <img src={avatarUrl} className="avatar image" style={{ height: size, width: size }} />
  ) : (
    <div className="avatar no-image" style={{ height: size, width: size }} />
  )
}
