/*
 *
 * please note:
 *
 * This file was renamed from 'index' so the docs/about page
 * can be properly served as the homepage
 *
 * @MildTomato
 *
 */

import React, { useState } from 'react'
import clsx from 'clsx'
import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import useBaseUrl from '@docusaurus/useBaseUrl'
import styles from './styles.module.css'
import CustomCodeBlock from '../components/CustomCodeBlock'
import GithubCard from '../components/GithubCard'
import HowCard from '../components/HowCard'

const heroExample = `
const messages = supabase
  .from('messages')
  .select(\`
    id, text,
    user ( id, name )
  \`)

const newMessages = supabase
  .from('messages')
  .on('INSERT', message => console.log('New message!', message) )
  .subscribe()
`.trim()
const subscribeExample = `
import { createClient } from '@supabase/supabase-js'

// Initialize 
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

// Get notified of all new chat messages
const realtime = supabase
  .from('messages')
  .on('INSERT', message => {
    console.log('New message!', message)
  })
  .subscribe()
`.trim()
const readExample = `
import { createClient } from '@supabase/supabase-js'

// Initialize 
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

// Get public rooms and their messages
const publicRooms = await supabase
  .from('rooms')
  .select(\`
    name,
    messages ( text )
  \`)
  .eq('public', true)
`.trim()
const createExample = `
import { createClient } from '@supabase/supabase-js'

// Initialize 
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

// Create a new chat room
const newRoom = await supabase
  .from('rooms')
  .insert({ name: 'Supabase Fan Club', public: true })
`.trim()
const updateExample = `
import { createClient } from '@supabase/supabase-js'

// Initialize 
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

// Update multiple users
const updatedUsers = await supabase
  .from('users')
  .eq('account_type', 'paid')
  .update({ highlight_color: 'gold' })
`.trim()
const nodeTSExample = `
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

type User = {
  id: string;
  username: string;
  status: 'ONLINE' | 'OFFLINE';
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const allOnlineUsers = await supabase
    .from<User>('users')
    .select('*')
    .eq('status', 'ONLINE');
  res.status(200).json(allOnlineUsers);
};
`.trim()

const umdExample = `
<script src="https://unpkg.com/@supabase/supabase-js/umd/supabase.js"></script>

<script>
  // Initialize
  const supabaseUrl = 'https://chat-room.supabase.co'
  const supabaseKey = 'public-anon-key'
  const supabase = Supabase.createClient(supabaseUrl, supabaseKey)

  // Get public rooms and their messages
  supabase
    .from('rooms')
    .select(\`
      name,
      messages ( text )
    \`)
    .eq('public', true)
    .then(response => {
      // Do something with the response
    })
</script>
`.trim()

const features = [
  {
    title: <>Chat apps</>,
    imageUrl: '',
    description: <>Build a realtime chat application using PostgreSQL and Expo</>,
    href: '/docs/guides/examples',
  },
  {
    title: <>Realtime dashboards</>,
    imageUrl: '',
    description: <>Build live dashboards using PostgreSQL and D3.js</>,
    href: '/docs/guides/examples',
  },
  {
    title: <>Logging</>,
    imageUrl: '',
    description: <>Log all your database changes to an immutable logging system</>,
    href: '/docs/guides/examples',
  },
  {
    title: <>Realtime Games</>,
    imageUrl: '',
    description: <>Keep all players in-sync with game actions and leader dashboards.</>,
    href: '/docs/guides/examples',
  },
  {
    title: <>Streaming analytics</>,
    imageUrl: '',
    description: <>Send actions and events to your data warehouses.</>,
    href: '/docs/guides/examples',
  },
  {
    title: <>Backoffice and Admin</>,
    imageUrl: '',
    description: <>Build admin dashboards without stressing about conflict resolution.</>,
    href: '/docs/guides/examples',
  },
]

function Home() {
  const context = useDocusaurusContext()
  const { siteConfig = {} } = context
  const [visibleCodeExample, showCodeExample] = useState('READ')
  return (
    <Layout title={`${siteConfig.title}`} description={siteConfig.tagline}>
      <main className="HomePage">
        {/* HEADER */}
        <header className={clsx('hero full', styles.heroBanner)}>
          <div className="container">
            <div className="row">
              <div className="col col--5">
                <h2 className="hero__title">{siteConfig.tagline}</h2>
                <p className="hero__subtitle">
                  Supabase adds realtime and restful APIs to Postgres without a single line of code.
                </p>
                <div>
                  <Link
                    className={clsx(
                      'button hero--button button--md button--secondary button--outline responsive-button',
                      styles.button
                    )}
                    to={useBaseUrl('docs')}
                    style={{ marginLeft: 0, marginTop: 10 }}
                  >
                    Learn More
                  </Link>
                  <Link
                    className={clsx(
                      'button hero--button button--md button--primary responsive-button',
                      styles.button
                    )}
                    to={'https://app.supabase.io'}
                    style={{ marginTop: 10 }}
                  >
                    Beta sign up →
                  </Link>
                </div>
              </div>
              <div className="col col--7">
                <CustomCodeBlock
                  header="Query your PostgreSQL database and listen in real-time."
                  js={heroExample}
                />
              </div>
            </div>
          </div>
        </header>

        <section
          style={{
            padding: 30,
          }}
          className="hero is--dark"
        >
          <div
            className="container "
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <img src="/img/yc-gray.png" alt="Y Combinator" width="50" />
            <p
              style={{
                fontWeight: 'bold',
                padding: '0px 20px',
                margin: 0,
                display: 'inline-block',
              }}
            >
              Backed by Y Combinator
            </p>
          </div>
        </section>

        {/* HOW */}
        <section className={'section-lg'}>
          <div className="container">
            <div className={clsx('row', styles.responsiveCentered)}>
              <div className="col col--6 col--offset-3">
                <h2 className="">How it works</h2>
                <p className="">
                  Supabase helps you build faster, so you can focus on your core products.
                </p>
              </div>
            </div>

            <div className="HowSections row is-multiline">
              <div className={'col col--4 '}>
                <div>
                  <img
                    className="diagram"
                    src="/img/how-replication.png"
                    alt="Database replication"
                  />
                </div>
                <div>
                  <HowCard
                    title="Built with PostgreSQL"
                    description={
                      <>Sign up and query your Postgres database in less than 2 minutes.</>
                    }
                    featureTitle="You get"
                    features={[
                      'Full Postgres database',
                      'Instant RESTful API',
                      'Realtime notifications via websockets',
                    ]}
                  />
                </div>
              </div>

              <div className={'col col--4 '}>
                <div>
                  <img className="diagram" src="/img/how-transformation.png" alt="Supabase" />
                </div>
                <div>
                  <HowCard
                    title="Supabase handles the magic"
                    description={<>Supabase handles the stuff you're usually too busy to build.</>}
                    featureTitle="You get"
                    features={[
                      'APIs always in sync with your schema',
                      'Custom API docs for your schema',
                      'Built-in security & monitoring',
                    ]}
                  />
                </div>
              </div>

              <div className={'col col--4 '}>
                <div>
                  <img className="diagram" src="/img/how-client-libs.png" alt="Client libraries" />
                </div>
                <div>
                  <HowCard
                    title="Build realtime applications"
                    description={<>Supabase provides libraries and examples to get you started.</>}
                    featureTitle="Build"
                    features={[
                      'Auto-updating dashboards',
                      'IoT applications',
                      'Realtime chat apps',
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For Devs */}
        <section className={styles.forDevelopers}>
          <div className="container">
            <div className={clsx('row', styles.responsiveCentered)}>
              <div className="col col--6 col--offset-3">
                <h2 className="">For Developers</h2>
                <p className="">
                  We introspect your database and provide APIs 
                  <strong className="has-emphasis">instantly</strong> so you can stop building
                  repetitive CRUD APIs and focus on building your products.
                </p>
              </div>
            </div>
            <div className="ForDevelopers">
              <div className="row">
                <div className="ButtonTabs col col--3">
                  <div>
                    <button
                      className={`button button--${
                        visibleCodeExample === 'READ' ? 'info is-active' : 'info '
                      }`}
                      onClick={() => showCodeExample('READ')}
                    >
                      Get your data
                    </button>
                    <button
                      className={`button button--${
                        visibleCodeExample === 'SUBSCRIBE' ? 'info is-active' : 'info'
                      }`}
                      onClick={() => showCodeExample('SUBSCRIBE')}
                    >
                      Realtime subscriptions
                    </button>
                    <button
                      className={`button button--${
                        visibleCodeExample === 'CREATE' ? 'info is-active' : 'info '
                      }`}
                      onClick={() => showCodeExample('CREATE')}
                    >
                      Create a record
                    </button>
                    <button
                      className={`button button--${
                        visibleCodeExample === 'UPDATE' ? 'info is-active' : 'info '
                      }`}
                      onClick={() => showCodeExample('UPDATE')}
                    >
                      Update multiple rows
                    </button>
                    <button
                      className={`button button--${
                        visibleCodeExample === 'NODETS' ? 'info is-active' : 'info '
                      }`}
                      onClick={() => showCodeExample('NODETS')}
                    >
                      Node.js & TypeScript support
                    </button>
                    <button
                      className={`button button--${
                        visibleCodeExample === 'UMD' ? 'info is-active' : 'info '
                      }`}
                      onClick={() => showCodeExample('UMD')}
                    >
                      Install from CDN
                    </button>
                  </div>
                </div>
                <div className="col col--9 code-with-header">
                  {visibleCodeExample === 'READ' && (
                    <CustomCodeBlock
                      header="Get all public rooms and their messages"
                      js={readExample}
                    />
                  )}
                  {visibleCodeExample === 'SUBSCRIBE' && (
                    <CustomCodeBlock
                      header="Receive realtime messages in an example chat room"
                      js={subscribeExample}
                    />
                  )}
                  {visibleCodeExample === 'CREATE' && (
                    <CustomCodeBlock header="Create a new chat room" js={createExample} />
                  )}
                  {visibleCodeExample === 'UPDATE' && (
                    <CustomCodeBlock header="Update a user" js={updateExample} />
                  )}
                  {visibleCodeExample === 'NODETS' && (
                    <CustomCodeBlock
                      header="Server-side & client-side TypeScript support e.g. in Next.js API routes"
                      js={nodeTSExample}
                    />
                  )}
                  {visibleCodeExample === 'UMD' && (
                    <CustomCodeBlock header="Supabase-js standalone bundle" js={umdExample} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* USE CASES */}
        {/* <section className={'section-lg'}>
          <div className="container">
            <h2 className="">Use Cases</h2>
            <div className="row is-multiline">
              {features.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section> */}

        <section className={'section-lg'}>
          <div className="container">
            <div className={clsx('row', styles.centered)}>
              <div className="col col--6 col--offset-3">
                <h2 className="">Self-documenting</h2>
                <p className="">
                  We introspect your database to give you instant, custom documentation for your
                  REST and Realtime APIs.
                </p>
              </div>
            </div>

            <div className={clsx('row', styles.centered)}>
              <div className="col">
                <img
                  className={''}
                  src={'/img/custom-docs.png'}
                  alt={'Self-documenting dashboards'}
                />
              </div>
            </div>
          </div>
        </section>

        {/* <section className={'section-lg'}>
          <div className="container">
            <div className={clsx('row', styles.centered)}>
              <div className="col col--6 col--offset-3">
                <h2 className="">Table view</h2>
                <p className="">Start building your database directly from the dashboard.</p>
              </div>
            </div>

            <div className={clsx('row', styles.centered)}>
              <div className="col">
                <img
                  className={''}
                  src={'/img/table-view.png'}
                  alt={'Self-documenting dashboards'}
                />
              </div>
            </div>
          </div>
        </section> */}

        {/* OSS */}
        <section className={'section-lg'}>
          <div className="container">
            <div className={clsx('row', styles.responsiveCentered)}>
              <div className="col col--6 col--offset-3">
                <h2 className="">Open source</h2>
                <p className="">
                  Supabase <Link to={'/oss'}>loves open source</Link>. Follow us on{' '}
                  <a href="https://github.com/supabase">GitHub</a>. <strong>Watch</strong> the
                  releases of each repo to get notified when we are ready for Beta launch.
                </p>
              </div>
            </div>

            <div className="row is-multiline">
              {/*repos
                .filter((x) =>
                  ['supabase', 'realtime', 'postgres', 'postgres-meta'].includes(x.name)
                )
                .map((props, idx) => (
                  <div className={'col col--6'} key={idx}>
                    <GithubCard
                      key={idx}
                      title={props.name}
                      description={props.description}
                      href={props.html_url}
                      stars={props.stargazers_count}
                      handle={props.full_name}
                    />
                  </div>
                ))*/}
            </div>
            <div style={{ textAlign: 'right' }}>
              <a href="/oss">See more →</a>
            </div>
          </div>
        </section>

        {/* <section
          style={{
            marginTop: 100,
            padding: '50px 0',
            borderTop: '1px solid var(--custom-border-color)',
          }}
          className="hero is--dark"
        >
          <div className="container">
            <div>
              <h2
                style={{
                  margin: 10,
                }}
              >
                Enterprise sponsors
              </h2>
            </div>
            <div className="">
              <a
                href={'http://worklife.vc/'}
                target="_blank"
                style={{
                  height: 150,
                  margin: 10,
                }}
              >
                <img src="/img/worklife-dark.png" alt="WorkLife VC" />
              </a>
              <a
                href={'https://github.com/sponsors/supabase'}
                target="_blank"
                style={{
                  height: 150,
                  margin: 10,
                }}
              >
                <img src="/img/new-sponsor-dark.png" alt="Become a sponsor" />
              </a>
            </div>
          </div>
        </section> */}

        <section
          style={{
            marginTop: 100,
            padding: '50px 0',
            borderTop: '1px solid var(--custom-border-color)',
          }}
          className="hero is--dark"
        >
          <div className="container text--center">
            {/* <div>
              <h2>Get Early Access</h2>
            </div> */}
            <div className="">
              <a
                className={clsx('button hero--button button--md responsive-button', styles.button)}
                href="https://www.producthunt.com/posts/supabase?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-supabase"
                style={{ width: 250, height: 54, margin: 0, padding: 0, display: 'inline-block' }}
              >
                <img
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=203792&theme=dark"
                  alt="Supabase - An open source Firebase alternative | Product Hunt Embed"
                  style={{ width: 250, height: 54 }}
                  width="250px"
                  height="54px"
                />
              </a>
              <Link
                className={clsx(
                  'button hero--button button--md button--primary responsive-button',
                  styles.button
                )}
                to={'https://app.supabase.io'}
                style={{ margin: 5 }}
              >
                Beta sign up →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}

// export default Home
export default () => {
  if (typeof window !== 'undefined') {
    if (window.location.href.indexOf('localhost') === -1) {
      window.location.replace('https://supabase.com')
    } else {
      window.location.replace('/docs')
    }
  }
  return null
}
