import React, { useState } from 'react'
import discussions from '../data/github/discussions.json'

export default function FrequentlyAskedQuestions() {
  const questions = discussions.data.repository.discussions.nodes.filter((x) => x.answer)

  return (
    <div>
      {questions.map((x) => (
        <div
          class="card"
          style={{
            marginBottom: 20,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 10,
            paddingBottom: 10,
          }}
        >
          <div class="avatar">
            <div
              class="avatar__photo-link avatar__photo avatar__photo--md"
              href="https://twitter.com/dan_abramov"
            >
              <img alt={x.author.login} src={x.author.avatarUrl} />
            </div>
            <div class="avatar__intro">
              <h3 class="avatar__name">{x.title}</h3>
              <small class="avatar__subtitle">
                <a href={x.author.url}>@{x.author.login}</a> {x.createdAt.toString()}
              </small>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  // return (
  //   <div>
  //     {questions.map((x) => (
  //       <div key={x.id}>
  //         <div className="item shadow--lw" style={{ marginBottom: 20, padding: 10 }}>
  //           <h3>{x.title}</h3>
  //           <div>{x.body}</div>
  //           <div style={{ display: 'flex' }}>
  //             <img
  //               src={x.author.avatarUrl}
  //               height="30"
  //               style={{ borderRadius: 5, marginRight: 10 }}
  //             />
  //             <p>
  //               <a href={x.author.url}>@{x.author.login}</a>
  //             </p>
  //           </div>
  //         </div>
  //         {/* Answer */}
  //         <div
  //           className="item shadow--lw"
  //           style={{ marginBottom: 20, marginLeft: 50, padding: 10 }}
  //         >
  //           <div>{x.answer.body}</div>
  //           <div style={{ display: 'flex' }}>
  //             <img
  //               src={x.answer.author.avatarUrl}
  //               height="30"
  //               style={{ borderRadius: 5, marginRight: 10 }}
  //             />
  //             <p>
  //               <a href={x.answer.author.url}>@{x.author.login}</a>
  //             </p>
  //           </div>
  //         </div>
  //       </div>
  //     ))}
  //   </div>
  // )
}
