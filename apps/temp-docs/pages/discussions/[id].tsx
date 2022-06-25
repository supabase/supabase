import { ApolloClient, createHttpLink, InMemoryCache, gql } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import Layout from '../../components/layouts/Layout'
import { IconArrowLeft, Badge, Button, IconArrowUp, IconCheck } from '@supabase/ui'
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'
import Link from 'next/link'

export async function getServerSideProps(context: any) {
  const prams = context.params

  const httpLink = createHttpLink({
    uri: 'https://api.github.com/graphql',
  })

  const authLink = setContext((_, { Headers }) => {
    return {
      headers: {
        Headers,
        authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
      },
    }
  })

  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  })

  const { data } = await client.query({
    query: gql`
      {
        repository(owner: "supabase", name: "supabase") {
          discussion(number: ${prams!.id}) {
            id
            number
            title
            upvoteCount
            body
            createdAt
            answer {
              isAnswer
            }
            author {
              url
              login
              avatarUrl
            }
            category {
              name
            }
            comments(first: 10) {
              totalCount
              nodes {
                id
                isAnswer
                replies(first: 10) {
                  nodes {
                    author {
                      avatarUrl
                      login
                      url
                    }
                    body
                    createdAt
                  }
                  totalCount
                }
                author {
                  avatarUrl
                  login
                  url
                }
                body
                createdAt
                upvoteCount
              }
            }
          }
        }
      }
    `,
  })

  return {
    props: {
      data,
      prams,
    },
  }
}

const discussion = ({ data, prams }: any) => {
  const meta_description = 'Discuss Supabase with other developers and users.'

  const getTimeSinceCreated = (createdAt: string) => {
    const date = new Date(createdAt)
    const now = new Date()
    const timeSinceCreated = now.getTime() - date.getTime()
    const days = Math.floor(timeSinceCreated / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeSinceCreated % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeSinceCreated % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeSinceCreated % (1000 * 60)) / 1000)

    if (days < 7) {
      if (days > 1) {
        return `${days} days ago`
      } else {
        if (hours > 1) {
          return `${hours} hours ago`
        } else {
          if (minutes > 1) {
            return `${minutes} minutes ago`
          } else {
            return `${seconds} seconds ago`
          }
        }
      }
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
  }

  return (
    <Layout
      meta={{
        title: data.repository.discussion.title,
        description: meta_description,
      }}
      currentPage={'Discussions'}
    >
      <div className="my-8 space-y-8">
        <div>
          <div className="flex justify-between">
            <Link href="/discussions">
              <a className="text-scale-1100 group flex w-fit items-center text-sm">
                <IconArrowLeft
                  className="stroke-2 transition group-hover:-translate-x-1"
                  height={15}
                />
                Go Back
              </a>
            </Link>
            <Link href={`https://github.com/supabase/supabase/discussions/${prams.id}`}>
              <a target="_blank">
                <Button className="text-base text-white">Open in Github</Button>
              </a>
            </Link>
          </div>
          <div className="mt-3 flex items-center text-3xl">
            <span>{data.repository.discussion.title}</span>
            <span className="text-scale-1000 ml-1">#{data.repository.discussion.number}</span>
          </div>
          <div className="text-scale-1100 mt-1 flex items-center space-x-2">
            <Badge color={data.repository.discussion.answer?.isAnswer ? 'green' : 'gray'}>
              {data.repository.discussion.answer?.isAnswer ? 'Answered' : 'Unanswered'}
            </Badge>
            <span>
              <Link href={data.repository.discussion.author.url}>
                <a target="_blank">{data.repository.discussion.author.login}</a>
              </Link>
              {` started this conversation in ${data.repository.discussion.category.name}`}
            </span>
          </div>
        </div>
        <div className="bg-scale-400 border-scale-600 space-y-4 rounded-lg border px-6 py-4">
          <div className="flex items-center">
            <Link href={data.repository.discussion.author.url}>
              <a target="_blank" className="flex items-center">
                <Image
                  className="rounded-full"
                  src={data.repository.discussion.author.avatarUrl}
                  width={30}
                  height={30}
                />
                <span className="ml-2">{data.repository.discussion.author.login}</span>
              </a>
            </Link>
            <span className="text-scale-1100 ml-2">{`on ${getTimeSinceCreated(
              data.repository.discussion.createdAt
            )}`}</span>
          </div>
          <div className="mt-4">
            <ReactMarkdown>{data.repository.discussion.body}</ReactMarkdown>
          </div>
          <div className="item-center bg-scale-400 border-scale-600 flex h-fit w-fit items-center space-x-1 rounded-xl border py-1 pl-1 pr-2">
            <IconArrowUp className="stroke-2" height={10} />
            <span className="text-sm">{data.repository.discussion.upvoteCount}</span>
          </div>
        </div>
        <div>{`${data.repository.discussion.comments.totalCount} comments`}</div>
        <div className="space-y-8">
          {data.repository.discussion.comments.nodes.map((comment: any) => {
            return (
              <div key={comment.id}>
                <div
                  className={`bg-scale-400 space-y-4 border px-6 py-4 ${
                    comment.replies.totalCount > 0 ? 'rounded-t-lg' : 'rounded-lg'
                  } ${comment.isAnswer === true ? 'border-brand-900' : 'border-scale-600'}`}
                >
                  <div className="flex items-center">
                    <Link href={comment.author.url}>
                      <a target="_blank" className="flex items-center">
                        <Image
                          className="rounded-full"
                          src={comment.author.avatarUrl}
                          width={30}
                          height={30}
                        />
                        <span className="ml-2">{comment.author.login}</span>
                      </a>
                    </Link>
                    <span className="text-scale-1100 ml-2">{`on ${getTimeSinceCreated(
                      comment.createdAt
                    )}`}</span>
                  </div>
                  <div>
                    <ReactMarkdown>{comment.body}</ReactMarkdown>
                  </div>
                  <div className="flex items-center space-x-2">
                    {comment.isAnswer === true && (
                      <div className="bg-brand-900 rounded-full px-1.5 py-2 text-white">
                        <IconCheck className="stroke-2" height={15} />
                      </div>
                    )}
                    <div className="item-center bg-scale-400 border-scale-600 flex h-fit items-center space-x-1 rounded-xl border py-1 pl-1 pr-2">
                      <IconArrowUp className="stroke-2" height={10} />
                      <span className="text-sm">{comment.upvoteCount}</span>
                    </div>
                  </div>
                </div>
                {comment.replies.totalCount > 0 && (
                  <div className="border-scale-600 bg-scale-100 space-y-4 rounded-b-lg border p-4">
                    {comment.replies.nodes.map((reply: any, i: number) => {
                      const lastReply = i === comment.replies.nodes.length - 1
                      return (
                        <div
                          className={`space-y-4 pb-4 ${
                            lastReply === true ? null : 'border-scale-600 border-b'
                          }`}
                          key={i}
                        >
                          <div className="flex items-center">
                            <Link href={reply.author.url}>
                              <a target="_blank" className="flex items-center">
                                <Image
                                  className="rounded-full"
                                  src={reply.author.avatarUrl}
                                  width={30}
                                  height={30}
                                />
                                <span className="ml-2">{reply.author.login}</span>
                              </a>
                            </Link>
                            <span className="text-scale-1100 ml-2">{`on ${getTimeSinceCreated(
                              reply.createdAt
                            )}`}</span>
                          </div>
                          <div>
                            <ReactMarkdown>{reply.body}</ReactMarkdown>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-8">
          <Link href={`https://github.com/supabase/supabase/discussions/${prams.id}`}>
            <a target="_blank">
              <Button className="text-base text-white">comment on Github</Button>
            </a>
          </Link>
        </div>
      </div>
    </Layout>
  )
}

export default discussion
