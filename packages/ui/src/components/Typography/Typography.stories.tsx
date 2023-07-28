import React from 'react'
// import { AutoForm } from 'uniforms'
// @ts-ignore
import MarkdownExample from './../../lib/MarkdownSample.md'
import ReactMarkdown from 'react-markdown'
const gfm = require('remark-gfm')

import Typography from '.'
// @ts-ignore
import { Space } from '../../index'

const { Title, Text, Link } = Typography

export default {
  title: 'General/Typography',
  component: Typography,
}

export const article = () => (
  <Typography tag="article">
    <ReactMarkdown plugins={[gfm]} source={MarkdownExample} />
  </Typography>
)

export const Titles = () => (
  <React.Fragment>
    <Title level={1}>Hello world</Title>
    <Title level={2}>Hello world</Title>
    <Title level={3}>Hello world</Title>
    <Title level={4}>Hello world</Title>
    <Title level={5}>Hello world</Title>
  </React.Fragment>
)

export const Texts = () => (
  <>
    <Text>iEchor UI (default)</Text>
    <br />
    <Text type="secondary">iEchor UI (secondary)</Text>
    <br />
    <Text type="success">iEchor UI (success)</Text>
    <br />
    <Text type="warning">iEchor UI (warning)</Text>
    <br />
    <Text type="danger">iEchor UI (danger)</Text>
    <br />
    <Text disabled>iEchor UI (disabled)</Text>
    <br />
    <Text mark>iEchor UI (mark)</Text>
    <br />
    <Text code>iEchor UI (code)</Text>
    <br />
    <Text keyboard>iEchor UI (keyboard)</Text>
    <br />
    <Text underline>iEchor UI (underline)</Text>
    <br />
    <Text strikethrough>iEchor UI (strikethrough)</Text>
    <br />
    <Text strong>iEchor UI (strong)</Text>
    <br />
    <Link href="https://supabase.io" target="_blank">
      iEchor (Link)
    </Link>
  </>
)
