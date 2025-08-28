import React, { useMemo, useState } from 'react'
import { Card, SectionTitle, PrimaryButton } from './FormUI'
import { Guest, Household } from '../types'
import { GuestCard } from './GuestCard'

export const HouseholdRsvpPage: React.FC<{
  household: Household
  onBack: () => void
  onSubmitAll: (guests: Guest[]) => void
}> = ({ household, onBack, onSubmitAll }) => {
  const [guests, setGuests] = useState<Guest[]>(household.guests)
  const allAnswered = useMemo(
    () => guests.every((g) => g.rsvp === 'yes' || g.rsvp === 'no'),
    [guests]
  )

  const setGuestRsvp = (id: string, rsvp: 'yes' | 'no') => {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, rsvp } : g)))
  }

  return (
    <Card>
      <SectionTitle title="Your Rsvp" subtitle={household.displayName} />
      <div className="space-y-3">
        {guests.map((g) => (
          <GuestCard
            key={g.id}
            guest={g}
            onChange={(r) => setGuestRsvp(g.id, r)}
          />
        ))}
      </div>
      <div className="flex items-center gap-4 mt-6">
        <button onClick={onBack} className="text-white/80 underline">
          Back
        </button>
        <PrimaryButton
          onClick={() => onSubmitAll(guests)}
          disabled={!allAnswered}
        >
          Submit RSVP
        </PrimaryButton>
      </div>
    </Card>
  )
}
