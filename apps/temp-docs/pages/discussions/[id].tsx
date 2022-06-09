import { ApolloClient, createHttpLink, InMemoryCache, gql } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import Layout from '../../components/layouts/Layout'
import { IconArrowLeft } from '@supabase/ui'
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
            bodyText
            createdAt
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
                replies(first: 10) {
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

const discussion = ({ data }: any) => {
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
      <div className="mt-8 space-y-8">
        <div>
          <Link href="/discussions">
            <a className="text-scale-1100 group flex w-fit items-center">
              <IconArrowLeft
                className="stroke-2 transition group-hover:-translate-x-1"
                height={15}
              />
              Back
            </a>
          </Link>
          <div className="mt-3 flex items-center text-3xl">
            <span>{data.repository.discussion.title}</span>
            <span className="text-scale-1000 ml-1">#{data.repository.discussion.number}</span>
          </div>
          <div className="text-scale-1100 mt-1">
            {`${data.repository.discussion.author.login} started this conversation in ${data.repository.discussion.category.name}`}
          </div>
        </div>
        <div className="bg-scale-400 border-scale-600 rounded-lg border px-6 py-4">
          <div className="flex items-center">
            <Link href={data.repository.discussion.author.url}>
              <a className="flex items-center">
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
        </div>
        <div>
          {`${data.repository.discussion.comments.totalCount} comments${
            data.repository.discussion.comments?.nodes[0] === undefined
              ? ``
              : ` • ${data.repository.discussion.comments.nodes[0].replies.totalCount} replies`
          }`}
        </div>
        <div className="space-y-8">
          {data.repository.discussion.comments.nodes.map((comment: any) => {
            return (
              <div
                className="bg-scale-400 border-scale-600 rounded-lg border px-6 py-4"
                key={comment.id}
              >
                <div className="flex items-center">
                  <Link href={comment.author.url}>
                    <a className="flex items-center">
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
                <div className="mt-4">
                  <ReactMarkdown>{comment.body}</ReactMarkdown>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}

export default discussion
