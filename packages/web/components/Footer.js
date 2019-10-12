import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer p-b-md">
      <div className="section container p-t-none">
        <div className="columns">
          <div className="column">
            <h3 className="title is-3 ">
              <img src="/supabase-logo.svg" alt="Supabase" width="180" />
            </h3>
          </div>
          <div className="column">
            <p>Link</p>
            <p>Link</p>
          </div>
        </div>
      </div>
      <hr />
      <div className="level">
        <div className="level-left ">
          <div className="level-item ">
            <small className="has-text-weight-bold">© Supabase</small>
          </div>
        </div>
        <div className="level-right">
          <div className="level-item">
            <a className="is-size-7 m-r-md">Terms of Use</a>·
            <a className="is-size-7 m-l-md">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
