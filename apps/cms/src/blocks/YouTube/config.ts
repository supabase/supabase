import type { Block } from 'payload'

export const YouTube: Block = {
  slug: 'youtube',
  fields: [
    {
      name: 'youtubeId',
      type: 'text',
      label: 'YouTube Video ID',
      required: true,
      admin: {
        description:
          'Enter the YouTube video ID (e.g., "dQw4w9WgXcQ" from https://www.youtube.com/watch?v=dQw4w9WgXcQ)',
      },
    },
  ],
  interfaceName: 'YouTubeBlock',
}
