/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'

import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import BlogPostItem from '@theme/BlogPostItem'
import BlogListPaginator from '@theme/BlogListPaginator'
import type { Props } from '@theme/BlogListPage'
import Link from '@docusaurus/Link'
import styles from './styles.module.css'
import clsx from 'clsx'
import cuid from 'cuid'
import {
  ArrowUpIcon,
  ZapIcon,
  CheckCircleIcon,
  CheckCircleFillIcon,
  CommentIcon,
} from '@primer/octicons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

function BlogListPage(props: Props): JSX.Element {
  const { metadata, items } = props
  const {
    siteConfig: { title: siteTitle },
  } = useDocusaurusContext()
  const isBlogOnlyMode = metadata.permalink === '/'
  const title = isBlogOnlyMode ? siteTitle : 'Blog'
  const { blogDescription } = metadata

  return (
    <Layout title={title} description={blogDescription}>
      <div className="BlogListPage container margin-vert--lg">
        <div className="row">
          <main className="col col--10 col--offset-1">
            {items.map(({ content: BlogPostContent }) => {
              const { date, permalink, tags, readingTime } = BlogPostContent.metadata
              const {
                frontMatter: {
                  title,
                  author_image_url,
                  author,
                  category,
                  answered,
                  commentCount,
                  upvoteCount,
                },
              } = BlogPostContent

              const categoryIcon = {
                General: '⚡',
                Ideas: '💡',
                'Jobs Board': '📋',
                'Q&A': '❓',
                'Show and tell': '🙌',
              }

              return (
                <div className="row" key={cuid()}>
                  <Link
                    className={clsx('', 'row row--no-gutters', styles.PostPreview)}
                    to={permalink}
                  >
                    <div className="row card__body">
                      <div className="col col--1 padding-vert--md padding-horiz-md">
                        <button className="button button--sm button--outline button--secondary padding-horiz--sm">
                          <ArrowUpIcon className="margin-right--sm" />
                          {upvoteCount}
                        </button>
                      </div>
                      <div className="col col--1">
                        <button className="button padding-horiz--md padding-vert--md margin-right--none">
                          {categoryIcon[category]}
                        </button>
                      </div>
                      <div className="col col--8 margin-right--none padding-horiz--none">
                        <div>
                          <h3>{title}</h3>
                        </div>
                        <div className="row row--no-gutters">
                          {`${author} asked ${dayjs(date).fromNow()} in ${category} • Answered`}
                        </div>
                      </div>
                      <div className="col col--1 avatar">
                        <img className="avatar__photo avatar__photo--sm" src={author_image_url} />
                      </div>
                      <div className="col col--1">
                        {category == 'Ideas' ? (
                          <CommentIcon />
                        ) : answered ? (
                          <CheckCircleFillIcon />
                        ) : (
                          <CheckCircleIcon />
                        )}
                        <span className="margin-left--sm">{`${commentCount}`}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
            <div style={{ paddingLeft: 12 }}>
              <BlogListPaginator metadata={metadata} />
            </div>
          </main>
        </div>
      </div>
    </Layout>
  )
}

export default BlogListPage
