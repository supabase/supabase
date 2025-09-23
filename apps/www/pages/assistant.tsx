import { useIsLoggedIn, useIsUserLoading } from 'common'
import { motion } from 'framer-motion'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Button } from 'ui'
import DotGrid from '~/components/AIDemo/DotGrid'
import { AIDemoPanel } from '~/components/AIDemo/Panel'
import { SqlSnippet } from '~/components/AIDemo/SqlSnippet'
import { EASE_OUT } from '../lib/animations'

const DefaultLayout = dynamic(() => import('~/components/Layouts/Default'))
const SectionContainer = dynamic(() => import('~/components/Layouts/SectionContainer'))

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string | JSX.Element
  createdAt: Date
  render?: JSX.Element
}

const welcomeMessages = [
  {
    id: 'ph-1',
    role: 'user' as const,
    content: 'I have come from ProductHunt. Show me the goods!',
    createdAt: new Date(),
  },
  {
    id: 'ph-2',
    role: 'assistant' as const,
    content: (
      <div className="flex gap-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 40 40"
          className="w-6 h-6 shrink-0"
        >
          <g fill="none" fill-rule="evenodd">
            <path
              fill="#FF6154"
              d="M40 20c0 11.046-8.954 20-20 20S0 31.046 0 20 8.954 0 20 0s20 8.954 20 20"
            ></path>
            <path
              fill="#FFF"
              d="M22.667 20H17v-6h5.667a3 3 0 0 1 0 6m0-10H13v20h4v-6h5.667a7 7 0 1 0 0-14"
            ></path>
          </g>
        </svg>
        <p>
          Welcome Product Hunter! 👋 Thanks for checking out the Supabase Assistant. Let me show you
          what I can do!
        </p>
      </div>
    ),
    createdAt: new Date(),
  },
]

const demoQueries = [
  {
    label: 'User Growth Over Time',
    messages: [
      {
        id: '1',
        role: 'user' as const,
        content: 'Show me user signups over the past 12 months',
        createdAt: new Date(),
      },
      {
        id: '2',
        role: 'assistant' as const,
        content: 'Here is a chart showing user growth by month:',
        createdAt: new Date(),
        render: (
          <SqlSnippet
            id="user-growth"
            title="Monthly User Signups"
            resultType="chart"
            sql={`SELECT
date_trunc('month', created_at) as month,
count(*) as new_users
FROM users
GROUP BY month
ORDER BY month
LIMIT 12;`}
            mockData={[
              { name: 'Jan 2023', value: 245 },
              { name: 'Feb 2023', value: 312 },
              { name: 'Mar 2023', value: 287 },
              { name: 'Apr 2023', value: 401 },
              { name: 'May 2023', value: 352 },
              { name: 'Jun 2023', value: 489 },
              { name: 'Jul 2023', value: 567 },
              { name: 'Aug 2023', value: 623 },
              { name: 'Sep 2023', value: 712 },
              { name: 'Oct 2023', value: 812 },
              { name: 'Nov 2023', value: 934 },
              { name: 'Dec 2023', value: 1023 },
            ]}
          />
        ),
      },
    ],
  },
  {
    label: 'Latest Products',
    messages: [
      {
        id: '23',
        role: 'user' as const,
        content: 'Show me our latest products',
        createdAt: new Date(),
      },
      {
        id: '24',
        role: 'assistant' as const,
        content: 'Here are the 5 most recently added products:',
        createdAt: new Date(),
        render: (
          <SqlSnippet
            id="latest-products"
            title="Latest Products"
            sql={`SELECT
product_id,
name,
price,
category,
created_at,
stock_level
FROM products
ORDER BY created_at DESC
LIMIT 5;`}
            mockData={{
              rows: [
                {
                  product_id: 'PROD-001',
                  name: 'Wireless Earbuds Pro',
                  price: 199.99,
                  category: 'Electronics',
                  created_at: '2024-01-15T16:30:00Z',
                  stock_level: 45,
                },
                {
                  product_id: 'PROD-002',
                  name: 'Smart Home Hub',
                  price: 299.99,
                  category: 'Smart Home',
                  created_at: '2024-01-15T15:45:00Z',
                  stock_level: 32,
                },
                {
                  product_id: 'PROD-003',
                  name: 'Fitness Tracker Elite',
                  price: 149.99,
                  category: 'Wearables',
                  created_at: '2024-01-15T14:20:00Z',
                  stock_level: 78,
                },
              ],
            }}
          />
        ),
      },
    ],
  },
  {
    label: 'Create Function',
    messages: [
      {
        id: '19',
        role: 'user' as const,
        content: 'Help me create a function to calculate user points',
        createdAt: new Date(),
      },
      {
        id: '20',
        role: 'assistant' as const,
        content: "Here's a Postgres function that calculates user points based on their activity:",
        createdAt: new Date(),
        render: (
          <SqlSnippet
            id="create-function"
            title="Create User Points Function"
            sql={`CREATE OR REPLACE FUNCTION calculate_user_points(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_points INTEGER;
BEGIN
  SELECT 
    COALESCE(
      (SELECT COUNT(*) * 10 FROM posts WHERE author_id = user_id) + -- 10 points per post
      (SELECT COUNT(*) * 5 FROM comments WHERE user_id = user_id) + -- 5 points per comment
      (SELECT COUNT(*) * 2 FROM post_likes WHERE user_id = user_id), -- 2 points per like
      0
    ) INTO total_points;
    
  RETURN total_points;
END;
$$ LANGUAGE plpgsql;`}
          />
        ),
      },
    ],
  },
  {
    label: 'RLS Policy',
    messages: [
      {
        id: '21',
        role: 'user' as const,
        content: 'Show me how to create an RLS policy for a team members table',
        createdAt: new Date(),
      },
      {
        id: '22',
        role: 'assistant' as const,
        content:
          "Here's an RLS policy that allows team members to only see other members in their team:",
        createdAt: new Date(),
        render: (
          <SqlSnippet
            id="rls-policy"
            title="Team Members RLS Policy"
            sql={`-- Enable RLS on the table
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing team members
CREATE POLICY view_team_members ON team_members
FOR SELECT
USING (
  team_id IN (
    -- User can see members of teams they belong to
    SELECT team_id 
    FROM team_members 
    WHERE user_id = auth.uid()
  )
  OR 
  -- Team admins can see all members
  EXISTS (
    SELECT 1 
    FROM team_admins 
    WHERE user_id = auth.uid() 
    AND team_id = team_members.team_id
  )
);`}
          />
        ),
      },
    ],
  },
  {
    label: 'SQL to Supabase-js',
    messages: [
      {
        id: '23',
        role: 'user' as const,
        content: 'How do I query all projects?',
        createdAt: new Date(),
      },
      {
        id: '24',
        role: 'assistant' as const,
        content: "Here's the SQL query to get all projects:",
        createdAt: new Date(),
        render: (
          <SqlSnippet
            id="projects-sql"
            title="Get All Projects SQL"
            sql={`SELECT 
  p.id,
  p.name,
  p.description,
  p.created_at,
  u.email as owner_email
FROM projects p
JOIN users u ON p.owner_id = u.id
WHERE p.is_active = true
ORDER BY p.created_at DESC;`}
            mockData={{
              rows: [
                {
                  id: 1,
                  name: 'Project A',
                  description: 'First project',
                  created_at: '2024-01-15T10:00:00Z',
                  owner_email: 'user@example.com',
                },
                {
                  id: 2,
                  name: 'Project B',
                  description: 'Second project',
                  created_at: '2024-01-14T10:00:00Z',
                  owner_email: 'user2@example.com',
                },
              ],
            }}
          />
        ),
      },
      {
        id: '25',
        role: 'user' as const,
        content: 'Can you show me how to do this with the Supabase client?',
        createdAt: new Date(),
      },
      {
        id: '26',
        role: 'assistant' as const,
        content: "Here's how to perform the same query using the Supabase JavaScript client:",
        createdAt: new Date(),
        render: (
          <SqlSnippet
            id="projects-js"
            title="Get All Projects with Supabase Client"
            sql={`const { data: projects, error } = await supabase
  .from('projects')
  .select(\`
    id,
    name,
    description,
    created_at,
    owner_id (
      email
    )
  \`)
  .eq('is_active', true)
  .order('created_at', { ascending: false })`}
          />
        ),
      },
    ],
  },
  {
    label: 'Recent Orders',
    messages: [
      {
        id: '3',
        role: 'user' as const,
        content: 'Show me the most recent orders',
        createdAt: new Date(),
      },
      {
        id: '4',
        role: 'assistant' as const,
        content: 'Here are the 5 most recent orders:',
        createdAt: new Date(),
        render: (
          <SqlSnippet
            id="recent-orders"
            title="Recent Orders"
            sql={`SELECT
order_id,
customer_name,
amount,
status,
created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;`}
            mockData={{
              rows: [
                {
                  order_id: 'ORD-001',
                  customer_name: 'John Smith',
                  amount: 299.99,
                  status: 'processing',
                  created_at: '2024-01-15T14:22:31Z',
                },
                {
                  order_id: 'ORD-002',
                  customer_name: 'Sarah Johnson',
                  amount: 149.5,
                  status: 'shipped',
                  created_at: '2024-01-15T13:45:12Z',
                },
                {
                  order_id: 'ORD-003',
                  customer_name: 'Mike Wilson',
                  amount: 499.99,
                  status: 'completed',
                  created_at: '2024-01-15T12:30:45Z',
                },
              ],
            }}
          />
        ),
      },
    ],
  },
  {
    label: 'Revenue by Category',
    messages: [
      {
        id: '5',
        role: 'user' as const,
        content: 'What are our top performing product categories?',
        createdAt: new Date(),
      },
      {
        id: '6',
        role: 'assistant' as const,
        content: 'Here is the revenue breakdown by product category:',
        createdAt: new Date(),
        render: (
          <SqlSnippet
            id="category-revenue"
            title="Revenue by Category"
            resultType="chart"
            sql={`SELECT
category_name,
sum(order_amount) as revenue
FROM orders o
JOIN products p ON o.product_id = p.id
GROUP BY category_name
ORDER BY revenue DESC;`}
            mockData={[
              { name: 'Electronics', value: 125000 },
              { name: 'Clothing', value: 98000 },
              { name: 'Home & Garden', value: 87000 },
              { name: 'Sports', value: 76000 },
              { name: 'Books', value: 65000 },
              { name: 'Toys', value: 54000 },
              { name: 'Beauty', value: 43000 },
              { name: 'Automotive', value: 32000 },
              { name: 'Food', value: 21000 },
              { name: 'Art', value: 15000 },
            ]}
          />
        ),
      },
    ],
  },
  {
    label: 'Active Users',
    messages: [
      {
        id: '7',
        role: 'user' as const,
        content: 'Show me our currently active users',
        createdAt: new Date(),
      },
      {
        id: '8',
        role: 'assistant' as const,
        content: 'Here are the currently active users:',
        createdAt: new Date(),
        render: (
          <SqlSnippet
            id="active-users"
            title="Active Users"
            sql={`SELECT
username,
last_login,
session_count
FROM users
WHERE last_active > now() - interval '24 hours'
ORDER BY last_login DESC;`}
            mockData={{
              rows: [
                {
                  username: 'alice_smith',
                  last_login: '2024-01-15T15:30:00Z',
                  session_count: 45,
                },
                {
                  username: 'bob_jones',
                  last_login: '2024-01-15T15:15:00Z',
                  session_count: 32,
                },
                {
                  username: 'carol_white',
                  last_login: '2024-01-15T14:45:00Z',
                  session_count: 28,
                },
              ],
            }}
          />
        ),
      },
    ],
  },

  {
    label: 'Daily Page Views',
    messages: [
      {
        id: '11',
        role: 'user' as const,
        content: 'Show me daily page views for the last 2 weeks',
        createdAt: new Date(),
      },
      {
        id: '12',
        role: 'assistant' as const,
        content: 'Here are the daily page views:',
        createdAt: new Date(),
        render: (
          <SqlSnippet
            id="page-views"
            title="Daily Page Views"
            resultType="chart"
            sql={`SELECT
date_trunc('day', timestamp) as day,
count(*) as views
FROM page_views
WHERE timestamp > now() - interval '14 days'
GROUP BY day
ORDER BY day;`}
            mockData={[
              { name: '2024-01-01', value: 15234 },
              { name: '2024-01-02', value: 14567 },
              { name: '2024-01-03', value: 16789 },
              { name: '2024-01-04', value: 15678 },
              { name: '2024-01-05', value: 17890 },
              { name: '2024-01-06', value: 13456 },
              { name: '2024-01-07', value: 12345 },
              { name: '2024-01-08', value: 16543 },
              { name: '2024-01-09', value: 18765 },
              { name: '2024-01-10', value: 19876 },
              { name: '2024-01-11', value: 20123 },
              { name: '2024-01-12', value: 21234 },
              { name: '2024-01-13', value: 19876 },
              { name: '2024-01-14', value: 18765 },
            ]}
          />
        ),
      },
    ],
  },
  {
    label: 'Error Distribution',
    messages: [
      {
        id: '1',
        role: 'user' as const,
        content: 'Show me the distribution of error types',
        createdAt: new Date(),
      },
      {
        id: '15',
        role: 'assistant' as const,
        content: 'Here is the distribution of error types:',
        createdAt: new Date(),
        render: (
          <SqlSnippet
            id="error-distribution"
            title="Error Distribution"
            resultType="chart"
            sql={`SELECT
error_type,
count(*) as error_count
FROM error_logs
GROUP BY error_type
ORDER BY error_count DESC;`}
            mockData={[
              { name: '404 Not Found', value: 1234 },
              { name: '500 Server Error', value: 567 },
              { name: '403 Forbidden', value: 456 },
              { name: 'Rate Limit Exceeded', value: 345 },
              { name: 'Database Timeout', value: 234 },
              { name: 'Authentication Failed', value: 123 },
              { name: 'Invalid Input', value: 98 },
              { name: 'Network Error', value: 87 },
              { name: 'API Error', value: 76 },
              { name: 'Other', value: 45 },
            ]}
          />
        ),
      },
    ],
  },
  {
    label: 'API Usage Trends',
    messages: [
      {
        id: '17',
        role: 'user' as const,
        content: 'Show me API usage trends over time',
        createdAt: new Date(),
      },
      {
        id: '18',
        role: 'assistant' as const,
        content: 'Here are the API usage trends:',
        createdAt: new Date(),
        render: (
          <SqlSnippet
            id="api-usage"
            title="API Usage Trends"
            resultType="chart"
            sql={`SELECT
date_trunc('hour', timestamp) as hour,
count(*) as request_count
FROM api_logs
WHERE timestamp > now() - interval '24 hours'
GROUP BY hour
ORDER BY hour;`}
            mockData={[
              { name: '00:00', value: 1200 },
              { name: '02:00', value: 800 },
              { name: '04:00', value: 600 },
              { name: '06:00', value: 900 },
              { name: '08:00', value: 2500 },
              { name: '10:00', value: 3500 },
              { name: '12:00', value: 4000 },
              { name: '14:00', value: 3800 },
              { name: '16:00', value: 3200 },
              { name: '18:00', value: 2800 },
              { name: '20:00', value: 2000 },
              { name: '22:00', value: 1500 },
            ]}
          />
        ),
      },
    ],
  },
]

function Assistant() {
  const [incomingMessages, setIncomingMessages] = useState<Message[]>([])
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()
  const meta_title = 'AI | Supabase'
  const meta_description = 'Build AI-powered applications with Supabase'
  const router = useRouter()
  const { query } = router

  useEffect(() => {
    if (incomingMessages.length === 0) {
      const timeoutId = setTimeout(() => {
        const isFromProductHunt = query.ref === 'producthunt'
        const initialMessages = isFromProductHunt
          ? [...welcomeMessages, ...demoQueries[0].messages]
          : demoQueries[Math.floor(Math.random() * demoQueries.length)].messages

        setIncomingMessages(initialMessages)
      }, 3000)
      return () => clearTimeout(timeoutId)
    }
  }, [query.ref])

  const handleNewMessage = (messages: Message[]) => {
    setIncomingMessages(messages.map((message) => ({ ...message, id: Date.now().toString() })))
  }

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/ai`,
        }}
      />
      <DefaultLayout className="lg:h-screen min-h-screen overflow-hidden">
        <SectionContainer className="h-full lg:pt-6 relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1, duration: 5 } }}
            className="absolute inset-0 hidden lg:block left-1/3"
          >
            <DotGrid rows={30} columns={30} count={900} />
          </motion.div>
          <div className="h-full grid grid-cols-12 gap-8 items-center">
            {/* Left Column */}
            <div className="col-span-12 lg:col-span-6 relative z-10">
              {/* Main content */}
              <div className="mb-6 flex flex-col gap-4 max-w-lg">
                <h1 className="text-4xl sm:text-5xl sm:leading-none">Chat with Postgres</h1>
                <p className="p text-lg !m-0">
                  Generate, run and debug queries, chart your data, create functions, policies and
                  more. The Assistant is here to help.
                </p>
                <div className="min-h-12 flex items-center gap-x-2">
                  {!isUserLoading && (
                    <Button type="primary" size="medium" asChild>
                      <Link href="/dashboard/project/_?aiAssistantPanelOpen=true">
                        {isLoggedIn ? 'Dashboard' : 'Start your project'}
                      </Link>
                    </Button>
                  )}
                  <Button type="default" size="medium" asChild>
                    <Link
                      target="_blank"
                      rel="noreferrer noopener"
                      href="https://supabase.com/blog/supabase-ai-assistant-v2"
                    >
                      Blog Post
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Grid of secondary buttons */}
              <div>
                <h2 className="font-mono text-foreground-lighter text-sm mb-4">Try me</h2>
                <div className="flex flex-wrap items-start gap-2 min-h-24">
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                        },
                      },
                    }}
                    className="flex flex-wrap gap-2"
                  >
                    {demoQueries.map((query, i) => (
                      <motion.div
                        key={i}
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: { opacity: 1, y: 0 },
                        }}
                      >
                        <Button
                          className="rounded-full"
                          type="default"
                          onClick={() => handleNewMessage(query.messages)}
                        >
                          {query.label}
                        </Button>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <motion.div className="col-span-12 relative lg:col-span-6 h-[500px] lg:h-full justify-center flex items-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 1, duration: 5 } }}
                className="absolute w-screen bottom-0 -top-28 -inset-x-[calc(((100vw-480px)/2)+24px)] sm:-inset-x-[calc(((100vw-640px)/2)+24px)] md:-inset-x-[calc(((100vw-768px)/2)+24px)] lg:hidden"
              >
                <DotGrid rows={30} columns={30} count={900} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 1.04, filter: 'blur(5px)' }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  filter: 'blur(0px)',
                  transition: { duration: 1.5, ease: EASE_OUT, delay: 0.5 },
                }}
                className="w-full lg:max-w-[400px] h-full max-h-[700px] relative overflow-hidden"
              >
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{
                    duration: 0.5,
                    ease: 'easeInOut',
                    delay: 0.5,
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-background-muted/40 to-transparent transform -skew-x-12 z-10"
                />
                <AIDemoPanel incomingMessages={incomingMessages} />
              </motion.div>
            </motion.div>
          </div>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default Assistant
