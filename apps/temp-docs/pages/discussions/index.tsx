import { ApolloClient, createHttpLink, InMemoryCache, gql } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import Layout from '../../components/layouts/Layout'
import { IconArrowUp, IconCheckCircle } from '@supabase/ui'
import Image from 'next/image'
import Link from 'next/link'
import Pagination from '../../components/pagination'

export async function getServerSideProps(context: { query: { page: number } }) {
  const Page: any = context.query?.page || 1
  const page: number = parseInt(Page)

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
          pinnedDiscussions(first: 3) {
            edges {
              node {
                id
                discussion {
                  id
                  number
                  title
                  author {
                    url
                    avatarUrl
                    login
                  }
                  category {
                    id
                    emoji
                    name
                  }
                }
              }
            }
            totalCount
          }
          discussions(first: ${page}0) {
            nodes {
              id
              number
              createdAt
              upvoteCount
              title
              body
              comments(first: 3) {
                totalCount
                nodes {
                  id
                  author {
                    avatarUrl
                    login
                  }
                }
              }
              category {
                id
                name
                emoji
              }
              author {
                login
                url
                avatarUrl
              }
              answer {
                isAnswer
                author {
                  avatarUrl
                  login
                }
              }
            }
            totalCount
          }
        }
      }
    `,
  })

  return {
    props: {
      data,
      page,
    },
  }
}

const discussions = ({ data, page }: { data: any; page: number }) => {
  const meta_title = 'Discussions'
  const meta_description = 'Discuss Supabase with other developers and users.'

  // TODO: This was a quick hack to show emojis in discussions. should be replaced with a proper solution.
  const emojiInput = [':zap:', ':ship:', ':bulb:', ':question:', ':raised_hands:']
  const emojiOutput = ['⚡️', '🚢', '💡', '❓', '🙌']

  const getEmoji = (category: string) => {
    const index = emojiInput.indexOf(category)
    return emojiOutput[index]
  }

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
    <Layout meta={{ title: meta_title, description: meta_description }} currentPage={'Discussions'}>
      <div className="mb-16 space-y-8">
        <div className="mt-4 flex items-center justify-between">
          <h2 className="text-3xl md:text-4xl">Discussions</h2>
          <Link href="https://github.com/supabase/supabase/discussions/new">
            <a
              target="_blank"
              className="rounded-lg bg-[#34b17b] px-4 py-2 text-xs text-white transition duration-150 hover:bg-[#40cf8e] md:text-sm"
            >
              New Discussion
            </a>
          </Link>
        </div>
        <div className="justify-around space-y-4 md:flex md:space-y-0 md:space-x-4">
          {data.repository.pinnedDiscussions.edges.map((discussion: any) => {
            const item = discussion.node
            return (
              <div
                className="border-scale-600 bg-scale-400 rounded-xl border px-4 py-4 md:w-1/3"
                key={item.id}
              >
                <Link href={`/discussions/${item.discussion.number}`}>
                  <a className="space-y-4">
                    <div className="flex justify-end text-2xl">
                      {getEmoji(item.discussion.category.emoji)}
                    </div>
                    <div>
                      <p className="text-sm font-normal">{item.discussion.category.name}</p>
                      <h2 className="max-w-[350px] truncate text-xl font-semibold">
                        {item.discussion.title}
                      </h2>
                    </div>
                    <Link href={item.discussion.author.url}>
                      <a className="flex w-fit items-center space-x-2">
                        <Image
                          className="rounded-full"
                          src={item.discussion.author.avatarUrl}
                          height={30}
                          width={30}
                        />
                        <span className="text-sm">{item.discussion.author.login}</span>
                      </a>
                    </Link>
                  </a>
                </Link>
              </div>
            )
          })}
        </div>
        <div className="space-y-6">
          {data.repository.discussions.nodes
            .slice(page * 10 - 10, page * 10)
            .map((discussion: any) => {
              return (
                <div className="border-scale-600 border-b pb-6 md:pb-0" key={discussion.id}>
                  <Link href={`/discussions/${discussion.number}`}>
                    <a className="mb-6 items-center justify-between md:mx-6 md:flex">
                      <div className="flex items-center">
                        <div className="item-center flex items-center md:space-x-6">
                          <div className="item-center bg-scale-400 border-scale-600 hidden h-fit items-center space-x-1 rounded-xl border py-1 pl-1 pr-2 md:flex">
                            <IconArrowUp className="stroke-2" height={15} />
                            <span>{discussion.upvoteCount}</span>
                          </div>
                          <div className="rounded-lg bg-gray-400 px-3 py-2 md:px-5 md:py-4">
                            {getEmoji(discussion.category.emoji)}
                          </div>
                        </div>
                        <div className="ml-6">
                          <h2 className="text-base font-semibold md:max-w-sm md:text-lg lg:max-w-4xl">
                            {discussion.title}
                          </h2>
                          <span className="text-scale-1000 text-xs">
                            <Link href={discussion.author.url}>
                              <a>{discussion.author.login}</a>
                            </Link>
                            <span>{` asked ${getTimeSinceCreated(discussion.createdAt)} • `}</span>
                            <span className={discussion.answer?.isAnswer ? 'text-brand-900' : ''}>
                              {discussion.answer?.isAnswer ? 'Answered' : 'Unanswered'}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="ml-16 mt-2 flex items-center space-x-2 md:ml-0 md:mt-0">
                        <div className="flex items-center -space-x-2">
                          <Link href={discussion.author.url}>
                            <a>
                              <Image
                                className="rounded-full"
                                src={discussion.author.avatarUrl}
                                height={30}
                                width={30}
                              />
                            </a>
                          </Link>
                        </div>
                        <div
                          className={`item-center flex items-center space-x-1 ${
                            discussion.answer?.isAnswer ? 'text-brand-900' : ''
                          }`}
                        >
                          <IconCheckCircle className="stroke-2" height={15} />
                          <span>{discussion.comments.totalCount}</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                </div>
              )
            })}
        </div>
        <div>
          <Pagination currentPage={page} totalCount={data.repository.discussions.totalCount} />
        </div>
      </div>
    </Layout>
  )
}

export default discussions
