/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import Layout from '@theme/Layout';
import BlogPostItem from '@theme/BlogPostItem';
import BlogPostPaginator from '@theme/BlogPostPaginator';
import useTOCHighlight from '@theme/hooks/useTOCHighlight'
import styles from './styles.module.css'

const LINK_CLASS_NAME = 'contents__link'
const ACTIVE_LINK_CLASS_NAME = 'contents__link--active'
const TOP_OFFSET = 100

function DocTOC({ headings }) {
  useTOCHighlight(LINK_CLASS_NAME, ACTIVE_LINK_CLASS_NAME, TOP_OFFSET)
  return (
    <div className={styles.tableOfContents}>
      <div className="contents contents__left-border">
        <h4 className="title">
          Contents
        </h4>
        <Headings headings={headings} />
      </div>
    </div>
  )
}

/* eslint-disable jsx-a11y/control-has-associated-label */
function Headings({ headings, isChild }) {
  if (!headings.length) return null
  return (
    <ul className={isChild ? '' : ''}>
      {headings.map(heading => (
        <li key={heading.id}>
          <a
            href={`#${heading.id}`}
            className={LINK_CLASS_NAME}
            dangerouslySetInnerHTML={{ __html: heading.value }}
          />
          <Headings isChild headings={heading.children} />
        </li>
      ))}
    </ul>
  )
}


function BlogPostPage(props) {
  const {content: BlogPostContents} = props;
  const {frontMatter, metadata} = BlogPostContents;

  return (
    <Layout title={metadata.title} description={metadata.description}>
      {BlogPostContents && (
        <div className="Blog container margin-vert--xl">
          <div className="row">
            <div className="col col--8 col--offset-1">
              <BlogPostItem frontMatter={frontMatter} metadata={metadata} isBlogPostPage>
                <BlogPostContents />
              </BlogPostItem>
              {(metadata.nextItem || metadata.prevItem) && (
                <div className="margin-vert--xl">
                  <BlogPostPaginator nextItem={metadata.nextItem} prevItem={metadata.prevItem} />
                </div>
              )}
            </div>
            <div className="col col--3">
              <DocTOC headings={BlogPostContents.rightToc} />
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default BlogPostPage;
