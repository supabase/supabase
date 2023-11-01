import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'
import type { FormattedTweet } from './types.ts'

/**
 * Supports plain text, images, quote tweets.
 *
 * Needs support for images, GIFs, and replies maybe?
 * Styles use !important to override Tailwind .prose inside MDX.
 */
export default function Tweet({
  id,
  text,
  author,
  media,
  created_at,
  public_metrics,
  referenced_tweets,
}: FormattedTweet) {
  const authorUrl = `https://twitter.com/${author.username}`
  const likeUrl = `https://twitter.com/intent/like?tweet_id=${id}`
  const retweetUrl = `https://twitter.com/intent/retweet?tweet_id=${id}`
  const replyUrl = `https://twitter.com/intent/tweet?in_reply_to=${id}`
  const tweetUrl = `https://twitter.com/${author.username}/status/${id}`
  const createdAt = new Date(created_at)

  const formattedText = text.replace(/https:\/\/[\n\S]+/g, '').replace('&amp;', '&')
  const quoteTweet = referenced_tweets && referenced_tweets.find((t) => t.type === 'quoted')

  return (
    <div tw="flex">
      <div tw="flex flex-col md:flex-row w-full py-12 px-4 md:items-center justify-between p-8">
        <h2 tw="flex flex-col text-3xl sm:text-4xl font-bold tracking-tight text-left">
          <span>{formattedText}</span>
          <span tw="text-gray-300">{`- @${author.username}`}</span>
        </h2>
      </div>
    </div>
  )
}
