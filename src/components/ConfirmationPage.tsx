import React from 'react'
import { Card, SectionTitle } from './FormUI'
import { Guest } from '../types'
import { buildGoogleCalUrl } from '../calendar'

export const ConfirmationPage: React.FC<{ guests: Guest[] }> = ({ guests }) => {
  const yesCount = guests.filter((g) => g.rsvp === 'yes').length

  const title = 'Yousef & Nada Wedding'
  const location =
    'Ilderton Community Centre, 13168 Ilderton Rd, Ilderton, Ontario'
  const description = `We're so excited to celebrate our wedding with you at the Ilderton Community Centre in Ilderton, Ontario. Please come dressed formal / modest. The evening will include our entrance and zaffa, heartfelt speeches, Maghrib prayer, dinner, first dance and cake cutting, games, and dancing. We can't wait to share this special day with you!`

  // 5:30 PM on Oct 11, 2025 in your local time (America/Toronto)
  const startLocal = new Date('2025-10-11T17:30:00-04:00')
  const durationHours = 6

  const googleUrl = buildGoogleCalUrl({
    title,
    description,
    location,
    startLocal,
    durationHours,
  })

  return (
    <Card>
      <SectionTitle
        title="Thank you!"
        subtitle={`We saved ${yesCount} seat${yesCount === 1 ? '' : 's'}.`}
      />
      <div className="bg-white/10 border border-white/20 rounded-lg p-4">
        <p className="text-white/90 font-medium mb-3">Summary</p>
        <ul className="space-y-2">
          {guests.map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between text-white"
            >
              <span>{g.fullName}</span>
              <span className="uppercase text-xs tracking-wide px-2 py-1 rounded border border-white/30">
                {g.rsvp}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a
          href="/Yousef-Nada-Wedding.ics"
          download
          className="px-4 py-2 rounded-md border border-white/40 text-white hover:bg-white/10"
        >
          Add to Calendar (ICS)
        </a>

        <a
          href={googleUrl}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-md border border-white/40 text-white hover:bg-white/10"
        >
          Add to Google Calendar
        </a>
      </div>

      <p className="text-white/80 text-sm mt-6">
        Need changes? Reply to your confirmation text or contact{' '}
        <a className="underline" href="mailto:ouda.yousef@gmail.com">
          ouda.yousef@gmail.com
        </a>
        .
      </p>
    </Card>
  )
}
