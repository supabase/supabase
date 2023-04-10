import Image from 'next/image'
import React from 'react'
import days from '~/components/LaunchWeek/lw7_days'

const HackernewsShare = ({ url, title }: { url: string; title: string }) => {
  const hackerNewsLink = `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(
    url
  )}&t=${encodeURIComponent(title)}`

  return (
    <div className="flex gap-4 lg:gap-6">
      <p className="text-lg">Start a conversation about this topic</p>
      <a href={hackerNewsLink} target="_blank" rel="noopener noreferrer">
        <svg
          width="23"
          height="23"
          viewBox="0 0 23 23"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M22.7969 0.878906H0.703125V22.9727H22.7969V0.878906Z" fill="#A0A0A0" />
          <path
            d="M11.0093 13.3976L7.17969 6.25391H8.94719L11.1566 10.7463C11.1566 10.8199 11.2302 10.8936 11.3039 10.9672C11.3775 11.0409 11.3775 11.1145 11.4511 11.2618L11.5248 11.3355V11.4091C11.5984 11.5564 11.5984 11.6301 11.6721 11.7773C11.7457 11.851 11.7457 11.9983 11.8194 12.0719C11.893 11.851 12.0403 11.7037 12.114 11.4091C12.1876 11.1882 12.3349 10.9672 12.4822 10.7463L14.6916 6.25391H16.3118L12.4822 13.4712V18.0372H11.0093V13.3976Z"
            fill="#1C1C1C"
          />
        </svg>
      </a>
    </div>
  )
}

export default HackernewsShare
