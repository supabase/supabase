import React from 'react'
import MarkdownSample from '../../lib/MarkdownSample.md'
import ReactMarkdown from 'react-markdown'
const gfm = require('remark-gfm')

import Typography from '.'

const { Title, Text, Link } = Typography

export default {
  title: 'General/Typography',
  component: Typography,
}

export const article = () => (
  <Typography tag="article">
    <ReactMarkdown className="prose" remarkPlugins={[gfm]} children={MarkdownSample} />
  </Typography>
)

export const Titles = () => (
  <div className="gap-y-5 flex flex-col">
    <Title level={1}>Hello world</Title>
    <Title level={2}>Hello world</Title>
    <Title level={3}>Hello world</Title>
    <Title level={4}>Hello world</Title>
    <Title level={5}>Hello world</Title>
  </div>
)

export const Texts = () => (
  <>
    <Text>Supabase UI (default)</Text>
    <br />
    <Text type="secondary">Supabase UI (secondary)</Text>
    <br />
    <Text type="success">Supabase UI (success)</Text>
    <br />
    <Text type="warning">Supabase UI (warning)</Text>
    <br />
    <Text type="danger">Supabase UI (danger)</Text>
    <br />
    <Text disabled>Supabase UI (disabled)</Text>
    <br />
    <Text mark>Supabase UI (mark)</Text>
    <br />
    <Text code>Supabase UI (code)</Text>
    <br />
    <Text keyboard>Supabase UI (keyboard)</Text>
    <br />
    <Text underline>Supabase UI (underline)</Text>
    <br />
    <Text strikethrough>Supabase UI (strikethrough)</Text>
    <br />
    <Text strong>Supabase UI (strong)</Text>
    <br />
    <Link href="https://supabase.io" target="_blank">
      Supabase (Link)
    </Link>
  </>
)
