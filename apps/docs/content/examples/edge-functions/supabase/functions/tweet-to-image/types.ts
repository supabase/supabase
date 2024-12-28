export type Tweet = {
  edit_history_tweet_ids: string[]
  text: string
  referenced_tweets:
    | Array<{
        type: string
        id: string
      }>
    | undefined
  attachments: {
    media_keys: string[]
  }
  id: string
  created_at: string
  public_metrics: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
    impression_count: number
  }
  author_id: string
  author?: User
}

export type Media = {
  width: number
  media_key: string
  type: string
  url: string
  height: number
}

export type User = {
  name: string
  url: string
  verified: boolean
  profile_image_url: string
  id: string
  username: string
  protected: boolean
}

// raw
export type TwitterApiResponse = {
  data: Tweet[]
  includes: {
    media: Media[]
    users: User[]
    tweets: Tweet[]
  }
}

export type FormattedTweet = {
  type: string
  edit_history_tweet_ids: string[]
  text: string
  referenced_tweets: FormattedTweet[]
  attachments: {
    media_keys: string[]
  }
  id: string
  created_at: string
  public_metrics: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
    impression_count: number
  }
  author_id: string
  media: Media[]
  author: User
}
