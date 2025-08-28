import React from 'react'
import { Guest } from '../types'

export const GuestCard: React.FC<{
  guest: Guest
  onChange: (rsvp: 'yes' | 'no') => void
}> = ({ guest, onChange }) => (
  <div className="bg-white/10 border border-white/20 rounded-lg p-4 flex items-center justify-between">
    <div>
      <p className="text-white text-base font-medium">{guest.fullName}</p>
    </div>
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange('yes')}
        className={`px-4 py-2 rounded-md border ${
          guest.rsvp === 'yes'
            ? 'bg-white text-black border-white'
            : 'text-white border-white/40 hover:bg-white/10'
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange('no')}
        className={`px-4 py-2 rounded-md border ${
          guest.rsvp === 'no'
            ? 'bg-white text-black border-white'
            : 'text-white border-white/40 hover:bg-white/10'
        }`}
      >
        No
      </button>
    </div>
  </div>
)
